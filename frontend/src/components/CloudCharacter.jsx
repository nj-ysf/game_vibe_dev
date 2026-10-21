import { useId } from 'react';

export default function CloudCharacter({ kind = 'happy', className = '' }) {
  const id = useId().replaceAll(':', '');
  const dark = kind === 'storm';
  const trick = kind === 'chaos';
  const royal = kind === 'royal';
  return <svg className={`cloud-character ${kind} ${className}`} viewBox="0 0 200 160" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}body`} x1="100" y1="55" x2="100" y2="145" gradientUnits="userSpaceOnUse"><stop stopColor={dark ? '#796591' : trick ? '#C6A6FF' : '#FFFFFF'}/><stop offset="1" stopColor={dark ? '#423050' : trick ? '#9170CE' : '#E3D8FF'}/></linearGradient>
      <linearGradient id={`${id}crown`} x1="100" y1="14" x2="100" y2="63" gradientUnits="userSpaceOnUse"><stop stopColor="#FFF1A8"/><stop offset="1" stopColor="#F6B843"/></linearGradient>
    </defs>
    {royal && <g className="royal-stars" fill="#FFD166"><path d="m30 42 3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="m173 65 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><circle cx="156" cy="31" r="3"/></g>}
    <path d="M43 134C21 134 13 119 17 103C20 90 31 84 44 84C43 64 59 51 78 55C89 32 124 34 137 56C156 52 173 66 170 85C192 88 196 108 187 122C181 132 170 136 155 136H43Z" fill={`url(#${id}body)`} stroke={dark ? '#9D7CB7' : '#F4EDFF'} strokeWidth="3"/>
    <path d="M28 103C30 94 38 91 48 92M59 74C65 65 74 64 81 67" stroke="white" strokeOpacity=".45" strokeWidth="5" strokeLinecap="round"/>
    {royal && <g transform="rotate(-9 105 41)"><path d="m76 50-7-31 22 12 13-21 13 21 23-13-7 32Z" fill={`url(#${id}crown)`} stroke="#DBA03A" strokeWidth="2.5"/><rect x="76" y="46" width="58" height="12" rx="4" fill="#FFD166" stroke="#DBA03A" strokeWidth="2"/><path d="m105 33 5 6-5 6-5-6Z" fill="#A16CE4"/><circle cx="69" cy="18" r="4" fill="#FFE99A"/><circle cx="104" cy="9" r="4" fill="#FFE99A"/><circle cx="140" cy="17" r="4" fill="#FFE99A"/></g>}
    {dark ? <g stroke="#291A45" strokeWidth="5" strokeLinecap="round"><path d="m69 83 17 6m29 0 17-6"/><path d="M78 98v5m46-5v5M91 119q10-10 20 0"/></g> : trick ? <g stroke="#432563" strokeWidth="4" strokeLinecap="round"><path d="m70 90 15 4m31 0 15-4"/><path d="M79 99v4m44-4v4M89 114q10 13 24-2"/><path d="M58 112q-8-10-14 0t14 6" strokeWidth="2"/></g> : <g><ellipse cx="77" cy="96" rx="5" ry="7" fill="#442461"/><ellipse cx="124" cy="96" rx="5" ry="7" fill="#442461"/><circle cx="78" cy="94" r="1.6" fill="white"/><circle cx="125" cy="94" r="1.6" fill="white"/><ellipse cx="64" cy="109" rx="9" ry="5" fill="#F2A3C9" opacity=".65"/><ellipse cx="138" cy="109" rx="9" ry="5" fill="#F2A3C9" opacity=".65"/><path d="M89 109q11 19 23 0Z" fill="#663D77"/><path d="M94 117q6-5 13 0" fill="#F59CBE"/></g>}
    {dark && <path d="m106 127-14 20h11l-6 12 23-23h-13l7-9Z" fill="#FFD166" stroke="#DBA03A" strokeWidth="1.5"/>}
    {trick && <g stroke="#E6D3FF" strokeWidth="3" strokeLinecap="round"><path d="M71 139q20 10 53 0m-43 8q15 6 33 0m-23 7h13"/><path d="M145 68q17-17 24-4t-13 6"/></g>}
  </svg>;
}
