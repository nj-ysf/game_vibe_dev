import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
try:
    from .models import ScoreSubmission
    from .storage import PlayerStore, StorageError
    from .game_sessions import GameSessions
except ImportError:
    from models import ScoreSubmission
    from storage import PlayerStore, StorageError
    from game_sessions import GameSessions


def create_app(data_path=None, clock=None):
    @asynccontextmanager
    async def lifespan(app):
        app.state.store = PlayerStore(data_path or os.getenv('PLAYER_CSV', str(Path(__file__).parent / 'data' / 'players.csv')))
        yield

    app = FastAPI(title='Cloud Whack — Cloud Clubs ENSET', lifespan=lifespan)
    app.state.games = GameSessions(**({'clock': clock} if clock else {}))
    app.add_middleware(CORSMiddleware, allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(','), allow_methods=['GET', 'POST'], allow_headers=['Content-Type'])

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request, exc):
        # Do not echo submitted personal information in validation responses.
        return JSONResponse(status_code=422, content={'detail': [{'field': '.'.join(map(str, e['loc'][1:])), 'message': e['msg']} for e in exc.errors()]})

    @app.exception_handler(StorageError)
    async def damaged_storage(request, exc):
        return JSONResponse(status_code=503, content={'detail': str(exc)})

    @app.exception_handler(OSError)
    async def unavailable_storage(request, exc):
        return JSONResponse(status_code=503, content={'detail': 'Storage is unavailable. Keep this page open and ask the organizer to check disk permissions or space, then retry.'})

    @app.get('/api/health')
    def health():
        app.state.store.snapshot()
        return {'status': 'ok'}

    @app.post('/api/game/start')
    def start(request: Request):
        app.state.games.limit(('start', request.client.host), 10)
        return app.state.games.start()

    @app.post('/api/scores')
    def scores(payload: ScoreSubmission, request: Request):
        app.state.games.limit(('score', request.client.host), 20)
        return app.state.games.submit(payload, app.state.store)

    @app.get('/api/leaderboard')
    def leaderboard():
        return app.state.store.snapshot()['players']

    @app.get('/api/stats')
    def stats():
        return app.state.store.snapshot()['stats']

    dist = Path(__file__).parent.parent / 'frontend' / 'dist'
    if dist.exists():
        app.mount('/', StaticFiles(directory=dist, html=True), name='frontend')
    return app


app = create_app()
