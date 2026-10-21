import { AnimatePresence, motion } from 'motion/react';
import { Crown, Flame, Timer, Zap } from 'lucide-react';
import GameBoard from '../components/GameBoard';
import { useGame } from '../hooks/useGame';
import { difficulty, multiplier } from '../game/engine';

export default function GameScreen({ round, onFinish, highScore }) {
  const game = useGame(round, onFinish);
  const ready = game.elapsed < 0;
  const remaining = Math.max(0, Math.ceil((45000 - Math.max(game.elapsed, 0)) / 1000));
  const mode = difficulty(game.elapsed);
  const countdown = game.elapsed < -3000 ? 'READY?' : Math.ceil(-game.elapsed / 1000);
  return <main className={`play-screen ${mode === 'CHAOS' ? 'chaos-mode' : ''}`}>
    <div className="play-heading"><span className="eyebrow"><span className="status-dot"/> YOUR MOMENT TO SHINE</span><span className="beat-score"><Crown size={16}/> TO BEAT: {highScore ?? '—'}</span></div>
    <div className="game-hud"><div className="hud-score"><span className="tiny-label">YOUR SCORE</span><strong key={game.score}>{game.score.toLocaleString()}</strong></div><div className={`hud-timer ${remaining <= 5 ? 'urgent' : ''}`}><span className="tiny-label"><Timer size={15}/> TIME LEFT</span><strong>{remaining}<small>s</small></strong></div><div className={`hud-combo ${game.combo >= 3 ? 'combo-active' : ''}`}><span className="tiny-label"><Zap size={14}/> COMBO</span><strong>×{multiplier(game.combo)}</strong><small>{game.combo} HIT STREAK</small></div></div>
    <div className="time-track"><div style={{ transform: `scaleX(${remaining / 45})` }}/></div>
    <div className="board-stage"><div className="board-caption"><span className={`mode-tag mode-${mode}`}><Flame size={13}/> {mode}</span><span>{mode === 'CHAOS' ? 'KEEP YOUR COOL. CATCH THE CROWN.' : 'HAPPY +10 · ROYAL +30 · AVOID THE REST'}</span></div>
      <div className={game.feedback?.kind === 'storm' ? 'storm-hit' : ''} key={game.feedback?.kind === 'storm' ? game.feedback.key : 'board'}><GameBoard active={game.active} onHit={game.hit} feedback={game.feedback}/></div>
      <AnimatePresence>{ready && <motion.div className="ready-overlay" exit={{ opacity: 0 }}><span className="eyebrow">READY TO MAKE IT RAIN?</span><motion.strong key={countdown} initial={{ scale: .6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{countdown}</motion.strong><p>Hit the happy clouds. Catch the Royal Cloud.<br/>Avoid the storms!</p></motion.div>}{game.elapsed >= 0 && game.elapsed < 500 && <motion.div className="go-overlay" initial={{ scale: .5 }} animate={{ scale: 1.4, opacity: 0 }}>GO!</motion.div>}</AnimatePresence>
      <AnimatePresence>{game.elapsed >= 30000 && game.elapsed < 31700 && <motion.div className="chaos-banner" initial={{ scale: .7, rotate: -5 }} animate={{ scale: 1, rotate: -3 }} exit={{ opacity: 0 }}><Zap fill="currentColor"/> CHAOS MODE! <Zap fill="currentColor"/></motion.div>}</AnimatePresence>
    </div><p className="play-tip"><Zap size={14}/> Consecutive friendly hits = bigger combos. You’ve got this.</p>
  </main>;
}
