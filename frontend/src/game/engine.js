export const DURATION = 45000;
export const POINTS = { happy: 10, royal: 30, storm: -20, chaos: -10 };
export const multiplier = combo => combo >= 10 ? 3 : combo >= 5 ? 2 : combo >= 3 ? 1.5 : 1;
export const difficulty = elapsed => elapsed < 10000 ? 'EASY' : elapsed < 20000 ? 'MEDIUM' : elapsed < 30000 ? 'HARD' : 'CHAOS';

// A deterministic engine, independent of React and rendering frequency.
export class GameEngine {
  constructor(events) {
    this.events = events;
    this.byId = new Map(events.map(event => [event.id, event]));
    this.hits = [];
    this.hitIds = new Set();
    this.expired = new Set();
    this.score = 0;
    this.combo = 0;
    this.elapsed = -1;
    this.done = false;
  }
  advance(elapsed) {
    this.elapsed = Math.max(this.elapsed, Math.floor(elapsed));
    for (const event of this.events) {
      if (event.end <= this.elapsed && !this.expired.has(event.id)) {
        this.expired.add(event.id);
        if (!this.hitIds.has(event.id) && POINTS[event.kind] > 0) this.combo = 0;
      }
    }
    this.done = this.elapsed >= DURATION;
    return this.snapshot();
  }
  hit(id, elapsed) {
    this.advance(elapsed);
    const event = this.byId.get(id);
    if (this.done || !event || this.hitIds.has(id) || this.elapsed < event.start || this.elapsed >= event.end) return null;
    this.hitIds.add(id);
    this.hits.push({ id, at: this.elapsed });
    const base = POINTS[event.kind];
    this.combo = base > 0 ? this.combo + 1 : 0;
    const points = base > 0 ? Math.round(base * multiplier(this.combo)) : base;
    this.score = Math.max(0, this.score + points);
    return { ...event, points, combo: this.combo };
  }
  snapshot() {
    return { score: this.score, combo: this.combo, elapsed: this.elapsed, done: this.done,
      active: this.done ? [] : this.events.filter(event => event.start <= this.elapsed && event.end > this.elapsed && !this.hitIds.has(event.id)) };
  }
  dispose() { this.done = true; this.events = []; this.byId.clear(); }
}
