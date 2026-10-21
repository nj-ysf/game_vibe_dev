import random

DURATION = 45000
POINTS = {'happy': 10, 'royal': 30, 'storm': -20, 'chaos': -10}


def difficulty(elapsed):
    if elapsed < 10000:
        return 'EASY', 1500, 1650, 1, [78, 10, 8, 4]
    if elapsed < 20000:
        return 'MEDIUM', 1000, 650, 2, [65, 10, 15, 10]
    if elapsed < 30000:
        return 'HARD', 700, 350, 3, [55, 10, 20, 15]
    return 'CHAOS', 600, 200, 4, [45, 10, 22, 23]


def multiplier(combo):
    return 3 if combo >= 10 else 2 if combo >= 5 else 1.5 if combo >= 3 else 1


def generate_events(rng=None):
    rng = rng or random.SystemRandom()
    events, occupied = [], [0] * 9
    at = 250
    while at < DURATION - 300:
        mode, visibility, interval, limit, weights = difficulty(at)
        available = [i for i, until in enumerate(occupied) if until <= at]
        if 9 - len(available) < limit and available:
            hole = rng.choice(available)
            kind = rng.choices(list(POINTS), weights=weights)[0]
            duration = rng.randint(500, 650) if mode == 'CHAOS' else visibility
            if kind == 'royal':
                duration = round(duration * .8)
            end = min(at + duration, DURATION)
            events.append({'id': len(events), 'hole': hole, 'kind': kind, 'start': at, 'end': end})
            occupied[hole] = end
        at += interval
    return events


def calculate_score(events, hits):
    by_id = {event['id']: event for event in events}
    seen, timeline = set(), []
    last_at = -1
    for hit in hits:
        event = by_id.get(hit['id'])
        if not event or hit['id'] in seen or hit['at'] < last_at:
            raise ValueError('Invalid or duplicate appearance hit.')
        if not event['start'] <= hit['at'] < event['end'] or hit['at'] >= DURATION:
            raise ValueError('A hit was outside its appearance window.')
        last_at = hit['at']
        seen.add(hit['id'])
        timeline.append((hit['at'], 1, event['id'], event['kind']))
    for event in events:
        if event['id'] not in seen and POINTS[event['kind']] > 0:
            timeline.append((event['end'], 0, event['id'], 'miss'))
    score, combo = 0, 0
    for _, _, _, kind in sorted(timeline):
        if kind == 'miss':
            combo = 0
        elif POINTS[kind] < 0:
            score = max(0, score + POINTS[kind])
            combo = 0
        else:
            combo += 1
            score += int(POINTS[kind] * multiplier(combo))
    return score
