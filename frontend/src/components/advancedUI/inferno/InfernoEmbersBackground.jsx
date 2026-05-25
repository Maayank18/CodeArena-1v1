import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from '../../../context/ThemeContext';
import infernoBg from '../../../assets/inferno_bg.png';

let isParticlesInitialized = false;

export default function InfernoEmbersBackground({ forceActive = false, containerId = "inferno-tsparticles", className = "fixed inset-0 z-[-1] pointer-events-none" }) {
  const { advancedTheme } = useTheme();
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (isParticlesInitialized) {
      setInit(true);
      return;
    }
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      isParticlesInitialized = true;
      setInit(true);
    });
  }, []);

  if (!init || (!forceActive && advancedTheme !== 'inferno')) return null;

  return (
    <>
      {/* Cinematic Molten Image Layer */}
      <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden bg-[#050505]">
        {/* Lava background - Reduced blur & increased brightness for visible glowing cracks */}
        <img 
          src={infernoBg} 
          alt="Inferno Lava Base" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{
            filter: 'blur(3px) brightness(0.65) saturate(1.15) contrast(1.15)',
            opacity: 1
          }}
        />
        
        {/* Dark Vignette - Lightened edges to ensure the sidebar sees the lava cracks */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(5,5,5,0.6) 100%)'
          }}
        />
        
        {/* Breathing Lava Glow at the bottom - Warmer orange */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-2/3 opacity-60 mix-blend-screen pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(212, 110, 10, 0.6) 0%, transparent 65%)'
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
              // Added brilliant yellow and hot orange for realistic lava drops
              value: ["#ff4500", "#ff781e", "#ff9d00", "#ffbb00", "#ff0000", "#c45a1a"]
            },
            move: {
              direction: "top",
              enable: true,
              speed: { min: 0.15, max: 0.8 },
              straight: false,
              random: true,
              outModes: {
                default: "out"
              },
              drift: { min: -0.3, max: 0.3 }
            },
            number: {
              density: { enable: true, area: 800 },
              value: 100 // Doubled density for much more active lava drops
            },
            opacity: {
              value: { min: 0.4, max: 1 }, // Brighter particles
              animation: {
                enable: true,
                speed: 0.8,
                minimumValue: 0.2,
                sync: false
              }
            },
            shape: { type: "circle" },
            size: {
              value: { min: 2, max: 8 }, // Larger chunks of lava
              animation: {
                enable: true,
                speed: 0.5,
                minimumValue: 1.5,
                sync: false
              }
            },
            shadow: {
              enable: true,
              color: "#ff4500", // Vibrant fiery glow shadow
              blur: 10
            },
            twinkle: {
              particles: {
                enable: true,
                frequency: 0.1, // High frequency for active white-hot pops
                opacity: 1,
                color: { value: "#ffffff" } // Real lava pops white-hot at the core
              }
            }
          },
          detectRetina: true,
        }}
      />
    </>
  );
}
