import secrets
import threading
import time
from collections import defaultdict, deque
from fastapi import HTTPException
try:
    from .scoring import generate_events, calculate_score
except ImportError:
    from scoring import generate_events, calculate_score


class GameSessions:
    def __init__(self, clock=time.monotonic):
        self.clock = clock
        self.sessions = {}
        self.lock = threading.RLock()
        self.requests = defaultdict(deque)

    def limit(self, key, maximum):
        with self.lock:
            now = self.clock()
            for old_key in list(self.requests):
                if not self.requests[old_key] or self.requests[old_key][-1] <= now - 60:
                    del self.requests[old_key]
            history = self.requests[key]
            while history and history[0] <= now - 60:
                history.popleft()
            if len(history) >= maximum:
                raise HTTPException(429, 'Too many requests. Please wait a minute and retry.')
            history.append(now)

    def start(self):
        with self.lock:
            now = self.clock()
            self.sessions = {key: value for key, value in self.sessions.items() if value['expires'] > now}
            if len(self.sessions) >= 2000:
                raise HTTPException(503, 'Round capacity reached. Please try later.')
            token = secrets.token_urlsafe(32)
            events = generate_events()
            self.sessions[token] = {'start': now + 3.5, 'expires': now + 7200, 'events': events, 'result': None}
            return {'session_id': token, 'countdown_ms': 3500, 'duration_ms': 45000, 'events': events}

    def submit(self, payload, store):
        with self.lock:
            session = self.sessions.get(payload.session_id)
            if not session or self.clock() >= session['expires']:
                raise HTTPException(410, 'This round expired or the server restarted. Ask the organizer for assistance.')
            if session['result'] is not None:
                # A lost HTTP response can be recovered without incrementing attempts.
                raise HTTPException(409, {'message': 'This round was already saved.', 'result': session['result']})
            if self.clock() < session['start'] + 45:
                raise HTTPException(409, 'The 45-second round has not finished yet.')
            try:
                score = calculate_score(session['events'], [hit.model_dump() for hit in payload.hits])
            except ValueError as exc:
                raise HTTPException(422, str(exc)) from exc
            if score != payload.score:
                raise HTTPException(422, 'Score does not match the validated hit history.')
            result = store.save(payload.phone_number, payload.name, payload.filiere, score)
            session['result'] = result
            return result
