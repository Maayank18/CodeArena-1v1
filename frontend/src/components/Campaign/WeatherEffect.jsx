// src/components/Campaign/WeatherEffect.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Renders ambient weather/particle effects clipped to a zone tile.
// All animations are CSS-keyframe based (no canvas) for performance.
// Each zone's particles are 100% GPU-composited (transform + opacity only).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo } from 'react';

// ── Seeded pseudo-random (stable across renders) ──────────────────────────────
const seededRand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// ── Particle factories ────────────────────────────────────────────────────────

const makeSnow = (count, rand, color = '#ffffff') =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left:  rand() * 100,
    size:  rand() * 4 + 2,
    dur:   rand() * 4 + 5,
    delay: rand() * 6,
    drift: (rand() - 0.5) * 40,
    opacity: rand() * 0.5 + 0.3,
    color,
  }));

const makeRain = (count, rand) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left:  rand() * 110,
    dur:   rand() * 0.4 + 0.5,
    delay: rand() * 1.5,
    opacity: rand() * 0.4 + 0.2,
    height: rand() * 14 + 10,
  }));

const makeSand = (count, rand) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    top:   rand() * 80 + 10,
    size:  rand() * 3 + 1,
    dur:   rand() * 3 + 2,
    delay: rand() * 4,
    opacity: rand() * 0.5 + 0.2,
  }));

const makeSparks = (count, rand, color = '#fbbf24') =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left:  rand() * 90 + 5,
    size:  rand() * 4 + 2,
    dur:   rand() * 2 + 1.5,
    delay: rand() * 3,
    drift: (rand() - 0.5) * 60,
    color,
  }));

const makeFireflies = (count, rand, color = '#4ade80') =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left:  rand() * 90 + 5,
    top:   rand() * 80 + 10,
    size:  rand() * 4 + 3,
    dur:   rand() * 4 + 3,
    delay: rand() * 5,
    color,
  }));

const makeMist = (count, rand) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    top:   rand() * 70 + 15,
    size:  rand() * 120 + 80,
    dur:   rand() * 10 + 12,
    delay: rand() * 8,
    opacity: rand() * 0.08 + 0.03,
  }));

const makeDust = (count, rand) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    top:   rand() * 80 + 10,
    size:  rand() * 3 + 1,
    dur:   rand() * 6 + 4,
    delay: rand() * 5,
    opacity: rand() * 0.35 + 0.1,
  }));

// ── Style injector (singleton) ─────────────────────────────────────────────────
let stylesInjected = false;
const injectStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wx-snow {
      0%   { transform: translateY(-20px) translateX(0); opacity: 0; }
      10%  { opacity: var(--op, 0.6); }
      90%  { opacity: var(--op, 0.6); }
      100% { transform: translateY(calc(var(--wx-h, 500px) + 20px)) translateX(var(--drift, 0px)); opacity: 0; }
    }
    @keyframes wx-rain {
      0%   { transform: translateY(-30px) translateX(0); opacity: 0; }
      5%   { opacity: var(--op, 0.4); }
      95%  { opacity: var(--op, 0.4); }
      100% { transform: translateY(calc(var(--wx-h, 500px) + 30px)) translateX(-50px); opacity: 0; }
    }
    @keyframes wx-sand {
      0%   { transform: translateX(-20px); opacity: 0; }
      10%  { opacity: var(--op, 0.4); }
      90%  { opacity: var(--op, 0.4); }
      100% { transform: translateX(calc(var(--wx-w, 760px) + 40px)); opacity: 0; }
    }
    @keyframes wx-spark {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.9; }
      100% { transform: translateY(-200px) translateX(var(--drift,0px)) scale(0); opacity: 0; }
    }
    @keyframes wx-firefly {
      0%,100% { transform: translate(0,0) scale(1); opacity: 0.2; }
      25%     { transform: translate(18px,-22px) scale(1.3); opacity: 0.9; }
      50%     { transform: translate(-12px,-8px) scale(0.8); opacity: 0.5; }
      75%     { transform: translate(8px,15px) scale(1.1); opacity: 0.7; }
    }
    @keyframes wx-mist {
      0%   { transform: translateX(-15%); opacity: 0; }
      20%  { opacity: var(--op,0.06); }
      80%  { opacity: var(--op,0.06); }
      100% { transform: translateX(30%); opacity: 0; }
    }
    @keyframes wx-dust {
      0%   { transform: translateX(-10px) translateY(0) rotate(0deg); opacity: 0; }
      15%  { opacity: var(--op,0.25); }
      85%  { opacity: var(--op,0.25); }
      100% { transform: translateX(calc(var(--wx-w, 760px) + 60px)) translateY(-30px) rotate(360deg); opacity: 0; }
    }
    @keyframes wx-ember {
      0%   { transform: translateY(0) translateX(0) scale(1); opacity: 1; }
      40%  { opacity: 0.8; }
      100% { transform: translateY(-180px) translateX(var(--drift,0px)) scale(0.3); opacity: 0; }
    }
    @keyframes wx-wave {
      0%,100% { transform: scaleX(1) translateY(0); }
      50%     { transform: scaleX(1.05) translateY(-6px); }
    }
    @keyframes wx-fog {
      0%   { transform: translateX(-8%); opacity: 0; }
      25%  { opacity: 0.06; }
      75%  { opacity: 0.06; }
      100% { transform: translateX(15%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
};

// ── WeatherEffect component ────────────────────────────────────────────────────
const WeatherEffect = ({ type, zoneId, primary, w = 760, h = 500 }) => {
  useEffect(() => {
    injectStyles();
  }, []);

  // Generate particles once (stable per zone)
  const particles = useMemo(() => {
    const key = String(zoneId ?? 'zone');
    const seed = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const r = seededRand(seed);
    switch (type) {
      case 'snow':      return { snow:      makeSnow(18, r) };
      case 'blizzard':  return { snow:      makeSnow(32, r), sand: makeSand(6, r) };
      case 'rain':      return { rain:      makeRain(28, r) };
      case 'sand':      return { sand:      makeSand(20, r) };
      case 'sparks':    return { sparks:    makeSparks(14, r, primary) };
      case 'ember':     return { sparks:    makeSparks(14, r, primary) };
      case 'fireflies': return { fireflies: makeFireflies(12, r, primary) };
      case 'mist':      return { mist:      makeMist(5, r) };
      case 'fog':       return { mist:      makeMist(7, r) };
      case 'dust':      return { dust:      makeDust(16, r) };
      case 'waves':     return { waves:     true };
      default:          return {};
    }
  }, [type, zoneId, primary]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ borderRadius: '16px', '--wx-w': `${w}px`, '--wx-h': `${h}px` }}
    >
      {/* ── Snow particles ─────────────────────────────────────────── */}
      {particles.snow?.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            background: p.color || '#e0f2fe',
            animation: `wx-snow ${p.dur}s ${p.delay}s linear infinite`,
            '--drift': `${p.drift}px`,
            '--op': p.opacity,
            boxShadow: `0 0 ${p.size}px ${p.color || '#e0f2fe'}80`,
          }}
        />
      ))}

      {/* ── Rain lines ────────────────────────────────────────────── */}
      {particles.rain?.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: 1.5,
            height: p.height,
            background: 'linear-gradient(180deg, transparent, #7dd3fa, transparent)',
            animation: `wx-rain ${p.dur}s ${p.delay}s linear infinite`,
            '--op': p.opacity,
            transform: 'skewX(-12deg)',
          }}
        />
      ))}

      {/* ── Sand drifts ───────────────────────────────────────────── */}
      {particles.sand?.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            top: `${p.top}%`,
            left: 0,
            width: p.size * 4,
            height: p.size,
            background: type === 'blizzard' ? '#e0f2fe50' : '#fbbf2450',
            borderRadius: '50%',
            animation: `wx-sand ${p.dur}s ${p.delay}s linear infinite`,
            '--op': p.opacity,
          }}
        />
      ))}

      {/* ── Sparks / Embers ───────────────────────────────────────── */}
      {particles.sparks?.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '10%',
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animation: `${type === 'ember' ? 'wx-ember' : 'wx-spark'} ${p.dur}s ${p.delay}s ease-out infinite`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}

      {/* ── Fireflies ─────────────────────────────────────────────── */}
      {particles.fireflies?.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}50`,
            animation: `wx-firefly ${p.dur}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* ── Mist / Fog clouds ─────────────────────────────────────── */}
      {particles.mist?.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${p.top}%`,
            left: '-15%',
            width: p.size,
            height: p.size * 0.4,
            background: '#ffffff',
            filter: 'blur(30px)',
            animation: `${type === 'fog' ? 'wx-fog' : 'wx-mist'} ${p.dur}s ${p.delay}s ease-in-out infinite`,
            '--op': p.opacity,
          }}
        />
      ))}

      {/* ── Dust particles ────────────────────────────────────────── */}
      {particles.dust?.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            top: `${p.top}%`,
            left: 0,
            width: p.size,
            height: p.size,
            background: '#d97706',
            animation: `wx-dust ${p.dur}s ${p.delay}s linear infinite`,
            '--op': p.opacity,
          }}
        />
      ))}

      {/* ── Wave effect (decorative bottom gradient) ──────────────── */}
      {particles.waves && (
        <>
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: 60,
              background: `linear-gradient(0deg, ${primary}18, transparent)`,
              animation: 'wx-wave 4s ease-in-out infinite',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: 30,
              background: `linear-gradient(0deg, ${primary}30, transparent)`,
              animation: 'wx-wave 3s 0.5s ease-in-out infinite',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          />
        </>
      )}
    </div>
  );
};

export default React.memo(WeatherEffect);
