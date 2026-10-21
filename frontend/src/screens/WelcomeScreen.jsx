import { ArrowUpRight, Crown, MousePointer2, Play, Trophy, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import CloudCharacter from '../components/CloudCharacter';
import GameBoard from '../components/GameBoard';

const characters = [ ['happy', 'Happy cloud', '+10', 'Catch the good vibes.'], ['royal', 'Royal cloud', '+30', 'A little crown. A big reward.'], ['storm', 'Storm cloud', '−20', 'Let this one pass.'], ['chaos', 'Chaos cloud', '−10', 'Cute. But definitely trouble.'] ];
export default function WelcomeScreen({ start, standings, stats, busy }) {
  return <motion.main className="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="status-dot"/> THE CLOUD CLUBS ARCADE</div>
        <h1>CLOUD<br/><span>WHACK</span><span className="title-star">✧</span></h1>
        <div className="edition"><Zap size={14} fill="currentColor"/> CHAOS EDITION <span>VOL. 01</span></div>
        <p className="tagline">45 seconds. 9 holes.<br/><strong>One champion.</strong></p>
        <p className="hero-description">Quick hands. Happy clouds. A little chaos.<br/>Think you can claim the crown?</p>
        <div className="hero-actions"><button className="btn primary" onClick={start} disabled={busy}><Play size={20} fill="currentColor"/>{busy ? 'GETTING READY…' : 'PLAY NOW'}<ArrowUpRight size={21}/></button><button className="btn secondary" onClick={standings}><Trophy size={18}/> VIEW LEADERBOARD</button></div>
        <div className="quick-facts"><span><MousePointer2 size={15}/> Click or tap to play</span><span><Zap size={15}/> 45-second rounds</span></div>
      </div>
      <div className="hero-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="art-spark s1">✦</span><span className="art-spark s2">✧</span><span className="art-spark s3">+</span>
        <div className="mascot-label"><Crown size={16}/> CATCH ME IF YOU CAN <span>+30</span></div>
        <div className="hero-mascot"><CloudCharacter kind="royal"/></div>
        <GameBoard preview/>
        <div className="floating-chip"><span className="status-dot"/> A LITTLE CHAOS. A LOT OF FUN.</div>
      </div>
    </section>
    <section className="record-strip"><div className="record-icon"><Trophy size={23}/></div><div><span className="tiny-label">THE SCORE TO BEAT</span><strong>{stats ? stats.highest_score.toLocaleString() : '—'} <small>PTS</small></strong></div><div className="record-message">{stats?.total_players ? 'There’s a crown with your name on it.' : 'A fresh leaderboard. Your crown is waiting.'}<span>{stats ? `${stats.total_players} challengers · ${stats.total_games} rounds played` : 'Connecting to the arcade…'}</span></div><button className="text-button" onClick={standings}>MEET THE CHAMPIONS <ArrowUpRight size={17}/></button></section>
    <section className="how-to"><div className="section-heading"><div><span className="eyebrow">MEET YOUR CLOUDS</span><h2>Tap the smiles. Dodge the trouble.</h2></div><span className="combo-note"><Zap size={16}/> Chain hits for up to <b>3× points</b></span></div><div className="character-cards">{characters.map(([kind, title, points, description]) => <div className={`character-card card-${kind}`} key={kind}><CloudCharacter kind={kind}/><div><h3>{title}</h3><p>{description}</p></div><span className="points-badge">{points}</span></div>)}</div><p className="rules-footnote">Miss a friendly cloud or hit trouble and your combo resets. The final 15 seconds? Pure chaos.</p></section>
  </motion.main>;
}
