import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from '../../../context/ThemeContext';
import samuraiBg from '../../../assets/samurai_bg.png';

let isParticlesInitialized = false;

export default function SamuraiLeavesBackground({ forceActive = false, containerId = "samurai-tsparticles", className = "fixed inset-0 z-[-1] pointer-events-none" }) {
  const { advancedTheme } = useTheme();
  const [init, setInit] = useState(() => isParticlesInitialized);

  useEffect(() => {
    if (init) {
      return;
    }

    let isMounted = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      isParticlesInitialized = true;
      if (isMounted) {
        setInit(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [init]);

  if (!init || (!forceActive && advancedTheme !== 'samurai')) return null;

  return (
    <>
      {/* Cinematic Samurai Image Layer */}
      <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#050506]">
        {/* The samurai background — sharply visible with high contrast */}
        <img 
          src={samuraiBg} 
          alt="Samurai Arena Base" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{
            filter: 'blur(1px) brightness(0.85) saturate(1.1) contrast(1.25)',
            opacity: 1
          }}
        />
        
        {/* Dark Vignette - Extremely lightened so the background shines through the sidebar */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(5,5,6,0.0) 0%, rgba(5,5,6,0.4) 100%)'
          }}
        />
        
        {/* Soft Moon Glow Pulse at top center */}
        <div 
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 mix-blend-screen pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(230, 235, 245, 0.45) 0%, transparent 70%)',
            animation: 'shadow-breathe 8s ease-in-out infinite alternate'
          }}
        />
        
        {/* Crimson Mist at the bottom */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/2 opacity-50 mix-blend-screen pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(139, 26, 26, 0.4) 0%, transparent 100%)'
          }}
        />
      </div>

      <Particles
        id={containerId}
        className={className}
        options={{
          background: { color: { value: "transparent" } },
          fpsLimit: 30,
          particles: {
            color: {
              // Mix of deep blood petals and bright glowing fireflies
              value: ["#8b1a1a", "#6a1515", "#a02020", "#ff3333", "#ffcc00", "#ffffff"]
            },
            move: {
              direction: "bottom-left",
              enable: true,
              speed: { min: 0.5, max: 1.8 }, // Slower, elegant drift
              straight: false,
              random: true,
              outModes: {
                default: "out"
              },
              drift: { min: -0.8, max: 0.8 }, // Subtle swaying
              angle: {
                value: 45,
                offset: 20
              }
            },
            number: {
              density: { enable: true, area: 1200 },
              value: 30 // Reduced density for subtlety
            },
            opacity: {
              value: { min: 0.3, max: 0.9 },
              animation: {
                enable: true,
                speed: 0.4, // Slower pulsing
                minimumValue: 0.1,
                sync: false
              }
            },
            shape: { type: "circle" },
            size: {
              value: { min: 1.5, max: 8 }, // Huge petals mixed with tiny sparks
              animation: {
                enable: true,
                speed: 0.3,
                minimumValue: 1.5,
                sync: false
              }
            },
            rotate: {
              value: { min: 0, max: 360 },
              direction: "random",
              animation: {
                enable: true,
                speed: 1.5, // Slow, graceful spinning
                sync: false
              }
            },
            wobble: {
              enable: true,
              distance: 6, // Gentle swaying rather than erratic wind
              speed: { min: 0.5, max: 2 }
            },
            shadow: {
              enable: true,
              color: "#8b1a1a",
              blur: 5
            },
            twinkle: {
              particles: {
                enable: true,
                frequency: 0.02, // Less frequent glints
                opacity: 0.6,
                color: { value: "#ffffff" }
              }
            }
          },
          detectRetina: true,
        }}
      />
    </>
  );
}
