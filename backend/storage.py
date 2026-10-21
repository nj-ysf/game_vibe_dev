"""Atomic UTF-8 CSV storage. Never repair corrupt participant data implicitly."""
import csv
import os
import re
import tempfile
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

FIELDS = ['phone_number', 'name', 'filiere', 'best_score', 'attempts', 'updated_at']


class StorageError(Exception):
    pass


def safe_cell(value):
    return "'" + value if value.lstrip().startswith(('=', '+', '-', '@')) else value


class PlayerStore:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        with self._locked():
            if not self.path.exists():
                self._atomic(self.path, [])
            self._read()

    @contextmanager
    def _locked(self):
        with self.lock, open(str(self.path) + '.lock', 'a+b') as handle:
            handle.seek(0, 2)
            if handle.tell() == 0:
                handle.write(b'0')
                handle.flush()
            handle.seek(0)
            if os.name == 'nt':
                import msvcrt
                msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                handle.seek(0)
                if os.name == 'nt':
                    msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
                else:
                    fcntl.flock(handle.fileno(), fcntl.LOCK_UN)

    def _read(self):
        try:
            with self.path.open(encoding='utf-8', newline='') as handle:
                reader = csv.DictReader(handle, strict=True)
                if reader.fieldnames != FIELDS:
                    raise ValueError('Invalid headers')
                rows = list(reader)
            seen = set()
            for row in rows:
                if set(row) != set(FIELDS) or any(v is None for v in row.values()):
                    raise ValueError('Invalid row')
                phone = row['phone_number']
                if not re.fullmatch(r'0[67][0-9]{8}', phone) or phone in seen:
                    raise ValueError('Invalid or duplicate identifier')
                seen.add(phone)
                row['best_score'], row['attempts'] = int(row['best_score']), int(row['attempts'])
                if not 0 <= row['best_score'] <= 30000 or row['attempts'] < 1 or not row['name'] or not row['filiere']:
                    raise ValueError('Invalid record')
                datetime.fromisoformat(row['updated_at'].replace('Z', '+00:00'))
            return rows
        except (ValueError, csv.Error, UnicodeError) as exc:
            raise StorageError('Player CSV is damaged. Ask the organizer to restore a verified backup; no data was overwritten.') from exc

    def _atomic(self, destination, rows):
        fd, temporary = tempfile.mkstemp(dir=self.path.parent, prefix='.players-', suffix='.tmp')
        try:
            with os.fdopen(fd, 'w', encoding='utf-8', newline='') as handle:
                writer = csv.DictWriter(handle, fieldnames=FIELDS)
                writer.writeheader()
                writer.writerows(rows)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, destination)
            if os.name != 'nt':
                os.chmod(destination, 0o600)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    @staticmethod
    def _ranked(rows):
        return sorted(rows, key=lambda r: (-r['best_score'], r['updated_at'], r['phone_number']))

    def snapshot(self):
        with self._locked():
            rows = self._ranked(self._read())
        players = [{'rank': i + 1, 'name': r['name'], 'filiere': r['filiere'], 'best_score': r['best_score']} for i, r in enumerate(rows)]
        return {'players': players, 'stats': {'total_players': len(rows), 'total_games': sum(r['attempts'] for r in rows), 'highest_score': rows[0]['best_score'] if rows else 0}}

    def save(self, phone, name, filiere, score):
        with self._locked():
            rows = self._read()
            # The backup always contains the last validated committed snapshot.
            self._atomic(self.path.with_suffix('.csv.bak'), rows)
            previous_high = max((r['best_score'] for r in rows), default=0)
            row = next((r for r in rows if r['phone_number'] == phone), None)
            previous = row['best_score'] if row else None
            now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            if row:
                row.update(best_score=max(previous, score), attempts=row['attempts'] + 1, updated_at=now)
            else:
                row = dict(zip(FIELDS, [phone, safe_cell(name), safe_cell(filiere), score, 1, now]))
                rows.append(row)
            self._atomic(self.path, rows)
            rank = next(i + 1 for i, r in enumerate(self._ranked(rows)) if r['phone_number'] == phone)
            return {'success': True, 'best_score': row['best_score'], 'previous_best': previous, 'attempts': row['attempts'], 'is_new_record': previous is not None and score > previous, 'is_champion': score > previous_high, 'rank': rank}
