import csv
import json
import random
from concurrent.futures import ThreadPoolExecutor
import subprocess
import sys
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.main import create_app
from backend.models import normalize_phone
from backend.scoring import calculate_score, difficulty, generate_events, multiplier
from backend.storage import PlayerStore, StorageError


@pytest.fixture
def store(tmp_path):
    return PlayerStore(tmp_path / 'players.csv')


@pytest.fixture
def api(tmp_path):
    clock = [100.0]
    app = create_app(tmp_path / 'players.csv', clock=lambda: clock[0])
    with TestClient(app) as client:
        yield client, app, clock


def event(i, kind='happy', start=None, end=None):
    start = i * 1000 if start is None else start
    return dict(id=i, kind=kind, hole=i % 9, start=start, end=start + 700 if end is None else end)


def body(token, **kwargs):
    return dict(session_id=token, name='Youssef Naji', filiere='BDCC', phone_number='0612345678', score=0, hits=[], **kwargs)


@pytest.mark.parametrize('raw', ['0612345678', '+212612345678', '00212612345678', '+212 6 12 34 56 78', '06-12-34-56-78'])
def test_phone_normalization(raw):
    assert normalize_phone(raw) == '0612345678'


@pytest.mark.parametrize('raw', ['0512345678', '612345678', '+2120612345678', 'invalid', '=123', '06123456789', '０６１２３４５６７８'])
def test_invalid_phone(raw):
    with pytest.raises(ValueError):
        normalize_phone(raw)


def test_07_phone():
    assert normalize_phone('+212712345678') == '0712345678'


def test_creation_and_utf8_csv_quoting(store):
    assert store.path.read_text(encoding='utf-8').strip() == 'phone_number,name,filiere,best_score,attempts,updated_at'
    store.save('0612345678', 'Élève, "Test"', 'Génie', 50)
    reloaded = PlayerStore(store.path)
    assert reloaded.snapshot()['players'][0]['name'] == 'Élève, "Test"'
    assert store.path.with_suffix('.csv.bak').exists()


def test_required_competition_scenario(store):
    first = store.save(normalize_phone('+212612345678'), 'Youssef Naji', 'BDCC', 650)
    assert first['attempts'] == 1
    store.save('0712345678', 'Amine', 'GI', 800)
    assert store.snapshot()['players'][0]['name'] == 'Amine'
    improved = store.save('0612345678', 'Name must not change', 'OTHER', 950)
    assert improved['rank'] == 1 and improved['is_new_record']
    assert improved['previous_best'] == 650
    last = store.save('0612345678', 'Other', 'OTHER', 400)
    assert last['best_score'] == 950 and last['attempts'] == 3
    assert last['is_new_record'] is False
    state = PlayerStore(store.path).snapshot()
    assert state['stats'] == {'total_players': 2, 'total_games': 4, 'highest_score': 950}
    assert state['players'][0]['name'] == 'Youssef Naji'
    assert state['players'][0]['filiere'] == 'BDCC'
    assert 'phone' not in json.dumps(state) and '0612345678' not in json.dumps(state)


def test_formula_injection(store):
    store.save('0612345678', '=HYPERLINK("bad")', '@SUM(1)', 0)
    with store.path.open(encoding='utf-8', newline='') as file:
        row = next(csv.DictReader(file))
    assert row['name'].startswith("'=") and row['filiere'].startswith("'@")


@pytest.mark.parametrize('damage', ['bad,header\n1,2', 'phone_number,name,filiere,best_score,attempts,updated_at\n0612345678,A,B,NaN,1,2026-01-01Z', 'phone_number,name,filiere,best_score,attempts,updated_at\n0612345678,A,B,20,1,garbage'])
def test_corruption_never_overwritten(store, damage):
    store.path.write_text(damage, encoding='utf-8')
    with pytest.raises(StorageError):
        store.save('0712345678', 'Test', 'GI', 10)
    assert store.path.read_text(encoding='utf-8') == damage


def test_deterministic_ties(store):
    store.save('0712345678', 'First', 'GI', 100)
    store.save('0612345678', 'Second', 'GI', 100)
    assert [p['name'] for p in store.snapshot()['players']] == ['First', 'Second']


def process_save(path):
    PlayerStore(path).save('0612345678', 'Concurrent Player', 'BDCC', 100)


def test_concurrent_threads_and_processes(store):
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(lambda _: process_save(store.path), range(16)))
    # Independent interpreters exercise the OS file lock without multiprocessing pipes.
    code = 'from backend.storage import PlayerStore; import sys; PlayerStore(sys.argv[1]).save("0612345678", "Concurrent Player", "BDCC", 100)'
    processes = [subprocess.Popen([sys.executable, '-c', code, str(store.path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0) for _ in range(6)]
    assert all(process.wait(timeout=30) == 0 for process in processes)
    assert store.snapshot()['stats']['total_games'] == 22
    assert store.snapshot()['stats']['total_players'] == 1


def test_combo_thresholds_and_penalties():
    events = [event(i, 'royal' if i == 9 else 'happy') for i in range(10)]
    hits = [dict(id=i, at=i * 1000 + 100) for i in range(10)]
    assert calculate_score(events, hits) == 240
    assert [multiplier(n) for n in [0, 2, 3, 4, 5, 9, 10]] == [1, 1, 1.5, 1.5, 2, 2, 3]
    assert calculate_score([event(0, 'storm'), event(1, 'chaos')], [{'id': 0, 'at': 100}, {'id': 1, 'at': 1100}]) == 0


def test_miss_reset():
    hits = [dict(id=i, at=i * 1000 + 100) for i in [0, 1, 3]]
    assert calculate_score([event(i) for i in range(4)], hits) == 30
    assert calculate_score([event(i, 'storm' if i == 2 else 'happy') for i in range(4)], hits) == 35


@pytest.mark.parametrize('hits', [[{'id': 0, 'at': 700}], [{'id': 0, 'at': -1}], [{'id': 99, 'at': 100}], [{'id': 0, 'at': 100}, {'id': 0, 'at': 101}]])
def test_invalid_hits(hits):
    with pytest.raises(ValueError):
        calculate_score([event(0)], hits)


def test_schedule_and_difficulty():
    assert [difficulty(t)[0] for t in [9999, 10000, 19999, 20000, 29999, 30000]] == ['EASY', 'MEDIUM', 'MEDIUM', 'HARD', 'HARD', 'CHAOS']
    for seed in range(20):
        events = generate_events(random.Random(seed))
        assert len(set(e['id'] for e in events)) == len(events)
        for e in events:
            assert 0 <= e['hole'] < 9 and 0 <= e['start'] < e['end'] <= 45000
            overlapping = [other for other in events if other['start'] <= e['start'] < other['end']]
            assert len(overlapping) <= difficulty(e['start'])[3]
            assert len({o['hole'] for o in overlapping}) == len(overlapping)


def test_api_duration_duplicate_and_privacy(api):
    client, app, clock = api
    assert client.get('/api/health').json() == {'status': 'ok'}
    session = client.post('/api/game/start').json()
    payload = body(session['session_id'])
    assert client.post('/api/scores', json=payload).status_code == 409
    clock[0] += 48.5
    response = client.post('/api/scores', json=payload)
    assert response.status_code == 200 and response.json()['attempts'] == 1
    duplicate = client.post('/api/scores', json=payload)
    assert duplicate.status_code == 409 and duplicate.json()['detail']['result']['attempts'] == 1
    assert client.get('/api/stats').json()['total_games'] == 1
    for path in ['/api/stats', '/api/leaderboard']:
        assert '0612345678' not in client.get(path).text


def test_api_server_recalculates_score(api):
    client, app, clock = api
    session = client.post('/api/game/start').json()
    events = session['events']
    hits = [{'id': e['id'], 'at': e['start'] + 50} for e in events if e['kind'] in ('happy', 'royal')]
    score = calculate_score(events, hits)
    payload = body(session['session_id']); payload.update(score=score, hits=hits)
    clock[0] += 49
    wrong = {**payload, 'score': score + 1}
    assert client.post('/api/scores', json=wrong).status_code == 422
    assert client.post('/api/scores', json=payload).json()['best_score'] == score


@pytest.mark.parametrize('field,value', [('score', -1), ('score', 30001), ('score', 1.5), ('score', True), ('score', '10'), ('phone_number', 'invalid'), ('name', ' '), ('filiere', 'X')])
def test_request_validation(api, field, value):
    client, app, clock = api
    payload = body('a' * 30); payload[field] = value
    response = client.post('/api/scores', json=payload)
    assert response.status_code == 422
    assert '0612345678' not in response.text


def test_expired_unknown_and_rate_limit(api):
    client, app, clock = api
    token = client.post('/api/game/start').json()['session_id']
    clock[0] += 7201
    assert client.post('/api/scores', json=body(token)).status_code == 410
    assert client.post('/api/scores', json=body('x' * 30)).status_code == 410
    for _ in range(10):
        assert client.post('/api/game/start').status_code == 200
    assert client.post('/api/game/start').status_code == 429


def test_concurrent_duplicate_submission(api):
    client, app, clock = api
    token = client.post('/api/game/start').json()['session_id']; clock[0] += 49
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(pool.map(lambda _: client.post('/api/scores', json=body(token)), range(4)))
    assert sorted(r.status_code for r in responses) == [200, 409, 409, 409]
    assert client.get('/api/stats').json()['total_games'] == 1


def test_complete_competition_through_api(api):
    client, app, clock = api
    # Four successful happy hits then a miss = 50 points per block.
    events = [event(i, start=250 + i * 450, end=500 + i * 450) for i in range(95)]
    def play(name, phone, score):
        token = client.post('/api/game/start').json()['session_id']
        app.state.games.sessions[token]['events'] = events
        hits = [{'id': e['id'], 'at': e['start'] + 50} for e in events[:score // 50 * 5] if e['id'] % 5 < 4]
        clock[0] += 49
        payload = body(token)
        payload.update(name=name, phone_number=phone, score=score, hits=hits)
        response = client.post('/api/scores', json=payload)
        assert response.status_code == 200, response.text
        return response.json()
    play('Youssef Naji', '+212612345678', 650)
    play('Amine', '0712345678', 800)
    assert client.get('/api/leaderboard').json()[0]['name'] == 'Amine'
    assert play('Youssef Naji', '0612345678', 950)['is_new_record']
    last = play('Changed Name', '00212612345678', 400)
    assert last['best_score'] == 950 and last['attempts'] == 3
    leaders = client.get('/api/leaderboard').json()
    assert len(leaders) == 2 and leaders[0]['name'] == 'Youssef Naji'
    assert client.get('/api/stats').json() == {'total_players': 2, 'total_games': 4, 'highest_score': 950}
