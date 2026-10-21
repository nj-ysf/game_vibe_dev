import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { ArrowUpRight, Volume2, VolumeX } from 'lucide-react';
import Brand from './components/Brand';
import WelcomeScreen from './screens/WelcomeScreen';
import GameScreen from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import { api } from './services/api';
import { sound } from './services/sound';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [round, setRound] = useState(null);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');
  const starting = useRef(false);
  const refreshId = useRef(0);
  const locked = screen === 'game' || (screen === 'result' && !saved);
  const refresh = useCallback(async () => {
    const id = ++refreshId.current;
    setLoading(true);
    try {
      const [ranks, totals] = await Promise.all([api('/leaderboard'), api('/stats')]);
      if (id !== refreshId.current) return;
      setPlayers(ranks); setStats(totals); setError('');
    } catch (err) { if (id === refreshId.current) setError(err.message); }
    finally { if (id === refreshId.current) setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (screen !== 'leaderboard') return;
    refresh(); const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [screen, refresh]);
  useEffect(() => {
    if (!locked) return;
    const prevent = event => { event.preventDefault(); event.returnValue = ''; };
    const back = () => { history.pushState({ cloudWhack: true }, '', location.href); };
    history.pushState({ cloudWhack: true }, '', location.href);
    window.addEventListener('beforeunload', prevent);
    window.addEventListener('popstate', back);
    return () => { window.removeEventListener('beforeunload', prevent); window.removeEventListener('popstate', back); };
  }, [locked]);
  async function start() {
    if (starting.current || locked) return;
    starting.current = true; setBusy(true); setError(''); sound.unlock();
    try {
      const data = await api('/game/start', {});
      setRound({ ...data, startAt: performance.now() + data.countdown_ms });
      setResult(null); setSaved(false); setScreen('game'); window.scrollTo(0, 0);
    } catch (err) { setError(err.message); }
    finally { starting.current = false; setBusy(false); }
  }
  function navigate(next) { if (!locked) { setScreen(next); window.scrollTo(0, 0); } }
  return <MotionConfig reducedMotion="user"><div className={`app-shell screen-${screen}`}><div className="background-stars" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <span key={i} style={{ left: `${(i * 37 + 7) % 100}%`, top: `${(i * 19 + 3) % 100}%`, animationDelay: `${i * -.7}s` }}>{i % 4 === 0 ? '✧' : '·'}</span>)}</div>
    <header className="site-header"><Brand/><div className="header-actions">{!locked && <button className="header-link" onClick={() => navigate(screen === 'leaderboard' ? 'welcome' : 'leaderboard')}>{screen === 'leaderboard' ? 'THE ARCADE' : 'THE LEADERBOARD'}<ArrowUpRight size={16}/></button>}<span className="header-divider"/><button className="icon-button" aria-label={muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={muted} onClick={() => { sound.unlock(); sound.muted = !muted; setMuted(!muted); }}>{muted ? <VolumeX size={19}/> : <Volume2 size={19}/>}</button></div></header>
    {error && <div role="alert" className="global-error"><span>{error}</span><button onClick={refresh}>RETRY</button></div>}
    {screen === 'welcome' && <WelcomeScreen start={start} standings={() => navigate('leaderboard')} stats={stats} busy={busy}/>}
    {screen === 'game' && <GameScreen round={round} highScore={stats?.highest_score} onFinish={value => { setResult(value); setScreen('result'); }}/>}
    {screen === 'result' && <GameOverScreen round={round} result={result} onSaved={() => { setSaved(true); refresh(); }} onStandings={() => navigate('leaderboard')}/>}
    {screen === 'leaderboard' && <LeaderboardScreen players={players} stats={stats} start={start} home={() => navigate('welcome')} refresh={refresh} busy={busy} loading={loading}/>}
    <footer className="site-footer"><span>BUILT FOR THE CLOUD. PLAYED FOR THE CROWN.</span><span>Organized by <b>Cloud Clubs</b> — ENSET Mohammedia <span className="footer-star">✦</span></span></footer>
  </div></MotionConfig>;
}
