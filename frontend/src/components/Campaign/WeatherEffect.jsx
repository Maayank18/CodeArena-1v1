// src/components/Campaign/WeatherEffect.jsx
// Each effect is GPU-composited (transform/opacity only), clipped to zone bounds.
// Particles generated once per zone via seeded RNG for stable renders.

import React, { useMemo } from 'react';

// ── Stable seeded PRNG ────────────────────────────────────────────────────────
const mkRng = (seed) => {
  let s = (seed * 2654435761) >>> 0;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xFFFFFFFF; };
};

// ── CSS keyframe injection (singleton) ────────────────────────────────────────
let _injected = false;
const injectCSS = () => {
  if (_injected || typeof document === 'undefined') return;
  _injected = true;
  document.head.insertAdjacentHTML('beforeend', `<style id="wx-styles">
    @keyframes wx-fall    { 0%{transform:translateY(-20px) translateX(0);opacity:0} 5%{opacity:1} 90%{opacity:1} 100%{transform:translateY(710px) translateX(var(--dx,0px));opacity:0} }
    @keyframes wx-rise    { 0%{transform:translateY(0) translateX(0) scale(1);opacity:1} 100%{transform:translateY(-220px) translateX(var(--dx,0px)) scale(0.2);opacity:0} }
    @keyframes wx-drift   { 0%{transform:translateX(-30px);opacity:0} 8%{opacity:1} 90%{opacity:1} 100%{transform:translateX(760px);opacity:0} }
    @keyframes wx-mist    { 0%{transform:translateX(-20%);opacity:0} 20%{opacity:var(--op,.06)} 80%{opacity:var(--op,.06)} 100%{transform:translateX(25%);opacity:0} }
    @keyframes wx-glow    { 0%,100%{opacity:.2;transform:translate(0,0) scale(1)} 40%{opacity:.9;transform:translate(var(--fx,10px),var(--fy,-15px)) scale(1.4)} 70%{opacity:.5;transform:translate(var(--fx2,-8px),var(--fy2,8px)) scale(.8)} }
    @keyframes wx-wave    { 0%,100%{transform:translateX(0) scaleY(1)} 50%{transform:translateX(-12px) scaleY(1.08)} }
    @keyframes wx-rain    { 0%{transform:translateY(-20px) skewX(-8deg);opacity:0} 5%{opacity:.7} 95%{opacity:.7} 100%{transform:translateY(710px) skewX(-8deg);opacity:0} }
    @keyframes wx-shake   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
  </style>`);
};

// ── Particle sets ─────────────────────────────────────────────────────────────
const mkSnow  = (n, rng, big) => Array.from({length:n},(_,i)=>({id:i, left:rng()*100, sz:rng()*(big?5:3)+1.5, dur:rng()*4+4, del:rng()*6, dx:(rng()-.5)*50}));
const mkRain  = (n, rng)      => Array.from({length:n},(_,i)=>({id:i, left:rng()*110, h:rng()*16+12, dur:rng()*.45+.5, del:rng()*2}));
const mkSand  = (n, rng, col) => Array.from({length:n},(_,i)=>({id:i, top:rng()*70+15, h:rng()*2.5+1, w:rng()*40+15, dur:rng()*3+2, del:rng()*4, col}));
const mkEmber = (n, rng, col) => Array.from({length:n},(_,i)=>({id:i, left:rng()*80+10, sz:rng()*5+2, dur:rng()*2+1.5, del:rng()*3, dx:(rng()-.5)*70, col}));
const mkFF    = (n, rng, col) => Array.from({length:n},(_,i)=>({id:i, left:rng()*80+10, top:rng()*70+15, sz:rng()*5+3, dur:rng()*4+3, del:rng()*5, fx:(rng()-.5)*30, fy:-(rng()*25+5), fx2:(rng()-.5)*20, fy2:rng()*20-10, col}));
const mkMist  = (n, rng)      => Array.from({length:n},(_,i)=>({id:i, top:rng()*60+20, sz:rng()*180+100, dur:rng()*14+10, del:rng()*8, op:rng()*.07+.03}));

const WeatherEffect = ({ type, zoneId, accent }) => {
  injectCSS();
  const safeZoneId = useMemo(() => String(zoneId ?? 'zone'), [zoneId]);
  const seed = useMemo(
    () => safeZoneId.split('').reduce((a, c) => a + c.charCodeAt(0), 0),
    [safeZoneId]
  );
  const p    = useMemo(() => {
    const rng = mkRng(seed);
    switch(type) {
      case 'snow':     return { snow:  mkSnow(18, rng, false) };
      case 'blizzard': return { snow:  mkSnow(30, rng, false), sand: mkSand(8, rng, '#e0f2fe') };
      case 'rain':     return { rain:  mkRain(32, rng) };
      case 'sand':     return { sand:  mkSand(20, rng, '#f97316') };
      case 'sparks':   return { ember: mkEmber(14, rng, '#fbbf24') };
      case 'ember':    return { ember: mkEmber(14, rng, accent || '#f87171') };
      case 'fireflies':return { ff:    mkFF(12, rng, accent || '#4ade80') };
      case 'mist':     return { mist:  mkMist(5, rng) };
      case 'fog':      return { mist:  mkMist(7, rng) };
      case 'dust':     return { sand:  mkSand(18, rng, '#ca8a04'), mist: mkMist(3, rng) };
      case 'waves':    return { waves: true };
      default:         return {};
    }
  }, [type, seed, accent]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      {/* Snow / blizzard */}
      {p.snow?.map(s=>(
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ left:`${s.left}%`, top:-10, width:s.sz, height:s.sz,
            boxShadow:`0 0 ${s.sz*2}px #bae6fd`, opacity:.8,
            animation:`wx-fall ${s.dur}s ${s.del}s linear infinite`,
            '--dx':`${s.dx}px` }} />
      ))}
      {/* Rain */}
      {p.rain?.map(s=>(
        <div key={s.id} className="absolute"
          style={{ left:`${s.left}%`, top:-20, width:1.5, height:s.h,
            background:'linear-gradient(180deg,transparent,#7dd3fc,transparent)', opacity:.7,
            animation:`wx-rain ${s.dur}s ${s.del}s linear infinite` }} />
      ))}
      {/* Sand / dust streaks */}
      {p.sand?.map(s=>(
        <div key={s.id} className="absolute rounded-full"
          style={{ top:`${s.top}%`, left:-40, height:s.h, width:s.w,
            background:s.col, opacity:.5, borderRadius:99,
            animation:`wx-drift ${s.dur}s ${s.del}s linear infinite` }} />
      ))}
      {/* Embers / sparks */}
      {p.ember?.map(s=>(
        <div key={s.id} className="absolute rounded-full"
          style={{ left:`${s.left}%`, bottom:'8%', width:s.sz, height:s.sz,
            background:s.col, boxShadow:`0 0 ${s.sz*2}px ${s.col}`,
            animation:`wx-rise ${s.dur}s ${s.del}s ease-out infinite`,
            '--dx':`${s.dx}px` }} />
      ))}
      {/* Fireflies */}
      {p.ff?.map(s=>(
        <div key={s.id} className="absolute rounded-full"
          style={{ left:`${s.left}%`, top:`${s.top}%`, width:s.sz, height:s.sz,
            background:s.col, boxShadow:`0 0 ${s.sz*3}px ${s.col}`,
            animation:`wx-glow ${s.dur}s ${s.del}s ease-in-out infinite`,
            '--fx':`${s.fx}px`,'--fy':`${s.fy}px`,'--fx2':`${s.fx2}px`,'--fy2':`${s.fy2}px` }} />
      ))}
      {/* Mist / fog */}
      {p.mist?.map((s,i)=>(
        <div key={i} className="absolute rounded-full"
          style={{ top:`${s.top}%`, left:'-15%', width:s.sz, height:s.sz*.35,
            background:'#fff', filter:'blur(28px)',
            animation:`wx-mist ${s.dur}s ${s.del}s ease-in-out infinite`,
            '--op':s.op }} />
      ))}
      {/* Wave shimmer (ocean) */}
      {p.waves && (
        <>
          {[0,1,2].map(i=>(
            <div key={i} className="absolute left-0 right-0"
              style={{ bottom: i*18, height:24-i*4,
                background:`linear-gradient(90deg,transparent,${accent}30,transparent)`,
                animation:`wx-wave ${3+i*.7}s ${i*.4}s ease-in-out infinite`,
                borderRadius:999 }} />
          ))}
        </>
      )}
    </div>
  );
};

export default React.memo(WeatherEffect);
// V 1.5
