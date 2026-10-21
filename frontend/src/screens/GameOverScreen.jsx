import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Crown, LockKeyhole, Save, Trophy } from 'lucide-react';
import CloudCharacter from '../components/CloudCharacter';
import { api } from '../services/api';
import { sound } from '../services/sound';

export default function GameOverScreen({ round, result, onSaved, onStandings }) {
  const [form, setForm] = useState({ name: '', filiere: '', phone_number: '' });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const submitting = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current || receipt) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const data = await api('/scores', { ...form, session_id: round.session_id, ...result });
      setReceipt(data); setForm({ name: '', filiere: '', phone_number: '' });
      if (data.is_new_record || data.is_champion) sound.play('record');
      onSaved();
    } catch (error) { setError(error.message); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <motion.main className={`results-screen ${receipt?.is_champion || receipt?.is_new_record ? 'celebrate' : ''}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
    <div className="result-mascot"><CloudCharacter kind="royal"/></div>
    <span className="eyebrow">{receipt ? 'YOUR PLACE IN THE CLOUDS' : 'TIME’S UP. NICELY PLAYED.'}</span>
    <h1>{receipt?.is_champion ? 'New Cloud Champion!' : receipt?.is_new_record ? 'New personal best!' : result.score >= 900 ? 'Lightning Reflexes!' : result.score >= 400 ? 'Storm Survivor!' : 'Nice Try, Cloud Warrior!'}</h1>
    <div className="final-score">{result.score.toLocaleString()}<span>POINTS</span></div>
    {receipt ? <div className="saved-card"><div className="success-label"><Check size={17}/> SCORE SAVED</div><div className="rank-reveal"><Trophy size={29}/><strong>#{receipt.rank}</strong><span>ON THE LEADERBOARD</span></div><p>{receipt.is_new_record ? `NEW PERSONAL BEST! ${receipt.previous_best} → ${receipt.best_score} points` : receipt.previous_best !== null ? `Your best score is still ${receipt.best_score}!` : `Your first score is on the board: ${receipt.best_score} points.`}</p><p className="muted">{receipt.attempts} {receipt.attempts === 1 ? 'round' : 'rounds'} played. Ready for the next challenger?</p><button className="btn primary" onClick={onStandings}>VIEW LEADERBOARD <ArrowRight size={19}/></button></div>
      : <form className="player-form" onSubmit={submit}><div className="form-heading"><Crown size={20}/><div><h2>Make your score official.</h2><p>Your next attempt could be legendary.</p></div></div>
        <label>Full Name<input name="name" autoComplete="off" required minLength={2} maxLength={80} placeholder="e.g. Youssef Naji" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <div className="form-row"><label>Filière<input name="filiere" autoComplete="off" required minLength={2} maxLength={40} placeholder="e.g. BDCC" value={form.filiere} onChange={e => setForm({ ...form, filiere: e.target.value })}/></label><label>Phone Number<input name="phone_number" autoComplete="off" type="tel" inputMode="tel" required maxLength={30} placeholder="0612345678" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })}/></label></div>
        <div className="privacy-note"><LockKeyhole size={17}/><span>Your phone number identifies repeat players and stays private. Your name, filière and best score appear on the leaderboard. Ask the organizers to delete your data after the event.</span></div>
        <label className="consent"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}/><span>I agree to save my details for this competition.</span></label>
        {error && <div role="alert" className="error-message">{error}</div>}
        <button className="btn primary" disabled={busy} type="submit"><Save size={18}/>{busy ? 'SAVING YOUR SCORE…' : 'SAVE MY SCORE'}<ArrowRight size={18}/></button><p className="form-footnote">Keep this page open until your score is saved.</p>
      </form>}
  </motion.main>;
}
