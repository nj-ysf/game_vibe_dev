import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, difficulty, multiplier } from '../game/engine';
import { sound } from '../services/sound';

export function useGame(round, onFinish) {
  const engine = useRef(null);
  const [state, setState] = useState({ score: 0, combo: 0, elapsed: -3500, active: [], done: false });
  const [feedback, setFeedback] = useState(null);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  useEffect(() => {
    const game = new GameEngine(round.events);
    engine.current = game;
    let frame, finished = false, lastSecond = null, lastMode = 'EASY';
    function tick() {
      const elapsed = performance.now() - round.startAt;
      const next = game.advance(elapsed);
      setState(next);
      const second = elapsed < 0 ? Math.ceil(-elapsed / 1000) : Math.ceil((45000 - elapsed) / 1000);
      if (second !== lastSecond) {
        if (elapsed < 0 && second <= 3) sound.play('countdown');
        if (elapsed >= 0 && lastSecond !== null && lastSecond <= 1 && second > 5) sound.play('go');
        if (elapsed >= 40000 && second > 0) sound.play('tick');
        lastSecond = second;
      }
      const mode = difficulty(elapsed);
      if (mode === 'CHAOS' && lastMode !== mode) sound.play('chaosMode');
      lastMode = mode;
      if (next.done) {
        if (!finished) { finished = true; sound.play('end'); finish.current({ score: game.score, hits: [...game.hits] }); }
        return;
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); game.dispose(); engine.current = null; };
  }, [round]);
  const hit = useCallback(id => {
    const game = engine.current;
    if (!game) return;
    const previous = multiplier(game.combo);
    const result = game.hit(id, performance.now() - round.startAt);
    if (!result) return;
    sound.play(multiplier(result.combo) > previous ? 'combo' : result.kind);
    setFeedback({ ...result, key: `${result.id}-${result.start}` });
    setState(game.snapshot());
  }, [round]);
  return { ...state, feedback, hit };
}
