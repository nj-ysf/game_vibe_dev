import { AnimatePresence, motion } from 'motion/react';
import CloudCharacter from './CloudCharacter';

export default function GameBoard({ active = [], onHit, feedback, preview = false }) {
  const demo = [{ id: -1, hole: 1, kind: 'happy' }, { id: -2, hole: 3, kind: 'storm' }, { id: -3, hole: 4, kind: 'royal' }, { id: -4, hole: 8, kind: 'chaos' }];
  return <div className={`game-board ${preview ? 'preview-board' : ''}`} aria-label="Nine-hole cloud game board">
    {Array.from({ length: 9 }, (_, hole) => {
      const event = (preview ? demo : active).find(item => item.hole === hole);
      return <div className="hole" key={hole}>
        <div className="hole-shadow"/><div className="hole-opening"/>
        <div className="cloud-window"><AnimatePresence>
          {event && <motion.button key={event.id} className={`cloud-target target-${event.kind}`} type="button" disabled={preview}
            aria-label={`Hit ${event.kind} cloud in hole ${hole + 1}`} initial={{ y: 100, scale: .8 }} animate={{ y: 0, scale: 1 }} exit={{ y: 75, scaleY: .35, opacity: 0 }} transition={{ duration: .12 }}
            onPointerDown={e => { e.preventDefault(); onHit?.(event.id); }} onClick={e => { if (e.detail === 0) onHit?.(event.id); }}>
            <CloudCharacter kind={event.kind}/>
          </motion.button>}
        </AnimatePresence></div>
        <div className="hole-rim"/>
        <span className="hole-number">{String(hole + 1).padStart(2, '0')}</span>
        <AnimatePresence>{feedback?.hole === hole && <motion.div className={`hit-feedback ${feedback.points < 0 ? 'negative' : feedback.kind === 'royal' ? 'gold' : ''}`} key={feedback.key} initial={{ y: 0, opacity: 1, scale: .7 }} animate={{ y: -55, opacity: 0, scale: 1.2 }} exit={{ opacity: 0 }} transition={{ duration: .75 }}>{feedback.kind === 'royal' && '✦ '}{feedback.points > 0 ? '+' : '−'}{Math.abs(feedback.points)}</motion.div>}</AnimatePresence>
      </div>;
    })}
  </div>;
}
