"""Keep test participant data inside the ignored workspace test-results directory."""
import uuid
from pathlib import Path
import pytest


@pytest.fixture
def tmp_path():
    path = Path(__file__).resolve().parents[2] / 'test-results' / str(uuid.uuid4())
    path.mkdir(parents=True)
    return path
