import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, multiplier, difficulty } from './engine.js';

const event = (id, kind = 'happy', start = id * 1000, end = start + 700) => ({ id, kind, start, end, hole: id % 9 });
test('combo thresholds apply to the hit reaching the threshold', () => {
  const events = Array.from({ length: 10 }, (_, i) => event(i, i === 9 ? 'royal' : 'happy'));
  const engine = new GameEngine(events);
  const points = events.map(e => engine.hit(e.id, e.start + 100).points);
  assert.deepEqual(points, [10, 10, 15, 15, 20, 20, 20, 20, 20, 90]);
  assert.equal(engine.score, 240);
  assert.deepEqual([0, 2, 3, 4, 5, 9, 10].map(multiplier), [1, 1, 1.5, 1.5, 2, 2, 3]);
});
test('danger penalties reset combo and cannot make score negative', () => {
  const engine = new GameEngine([event(0), event(1, 'storm'), event(2, 'chaos')]);
  engine.hit(0, 100); engine.hit(1, 1100);
  assert.equal(engine.score, 0); assert.equal(engine.combo, 0);
  assert.equal(engine.hit(2, 2100).points, -10); assert.equal(engine.score, 0);
});
test('one hit per appearance, expiration, empty and pre-start hits', () => {
  const engine = new GameEngine([event(0), event(1)]);
  assert.equal(engine.hit(0, -1), null);
  assert.ok(engine.hit(0, 100)); assert.equal(engine.hit(0, 101), null);
  assert.equal(engine.hit(99, 200), null); assert.equal(engine.hit(1, 1700), null);
  assert.equal(engine.score, 10); assert.equal(engine.combo, 0);
});
test('missed friendly clouds reset combo; missed dangerous clouds do not', () => {
  const engine = new GameEngine([event(0), event(1, 'storm'), event(2)]);
  engine.hit(0, 100); engine.advance(1700); assert.equal(engine.combo, 1);
  engine.advance(2700); assert.equal(engine.combo, 0);
});
test('timer ends at precisely 45000 ms, including after a background-tab jump', () => {
  const engine = new GameEngine([event(0, 'happy', 44000, 45000)]);
  assert.equal(engine.advance(44999).active.length, 1);
  assert.equal(engine.hit(0, 45000), null); assert.equal(engine.done, true);
  assert.deepEqual(engine.snapshot().active, []);
  assert.equal(new GameEngine([]).advance(90000).done, true);
});
test('difficulty changes exactly at the specified boundaries', () => {
  assert.deepEqual([0, 9999, 10000, 19999, 20000, 29999, 30000, 44999].map(difficulty), ['EASY', 'EASY', 'MEDIUM', 'MEDIUM', 'HARD', 'HARD', 'CHAOS', 'CHAOS']);
});
test('dispose clears appearances and disables hits', () => {
  const engine = new GameEngine([event(0)]); engine.advance(100); engine.dispose();
  assert.deepEqual(engine.snapshot().active, []); assert.equal(engine.hit(0, 200), null);
});
test('expiration at the same millisecond as another hit resets combo first', () => {
  const engine = new GameEngine([event(0), event(1, 'happy', 0, 300), event(2, 'happy', 0, 600)]);
  engine.hit(0, 100); engine.hit(2, 300);
  assert.equal(engine.combo, 1); assert.equal(engine.score, 20);
});
