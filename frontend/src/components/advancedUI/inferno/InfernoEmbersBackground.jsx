import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from '../../../context/ThemeContext';

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
    <Particles
      id={containerId}
      className={className}
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 30,
        particles: {
          color: {
            value: ["#b04818", "#c45a1a", "#d4870a", "#a04010", "#8a3010"]
          },
          move: {
            direction: "top",
            enable: true,
            speed: { min: 0.2, max: 0.8 },
            straight: false,
            random: true,
            outModes: {
              default: "out"
            },
            drift: { min: -0.4, max: 0.4 }
          },
          number: {
            density: { enable: true, area: 800 },
            value: 65
          },
          opacity: {
            value: { min: 0.15, max: 0.55 },
            animation: {
              enable: true,
              speed: 0.6,
              minimumValue: 0.08,
              sync: false
            }
          },
          shape: { type: "circle" },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 0.6,
              minimumValue: 0.5,
              sync: false
            }
          },
          shadow: {
            enable: true,
            color: "#b04818",
            blur: 3
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.02,
              opacity: 0.5,
              color: { value: "#d4870a" }
            }
          }
        },
        detectRetina: true,
      }}
    />
  );
}
