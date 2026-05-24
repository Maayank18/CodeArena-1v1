import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from '../../../context/ThemeContext';

let isParticlesInitialized = false;

export default function SamuraiLeavesBackground({ forceActive = false, containerId = "samurai-tsparticles", className = "fixed inset-0 z-[-1] pointer-events-none" }) {
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

  if (!init || (!forceActive && advancedTheme !== 'samurai')) return null;

  return (
    <Particles
      id={containerId}
      className={className}
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 30,
        particles: {
          color: {
            value: ["#8b1a1a", "#6a1515", "#a02020", "#c03030", "#4a0e0e", "#d0ccc4"]
          },
          move: {
            direction: "bottom-left",
            enable: true,
            speed: { min: 0.5, max: 1.5 },
            straight: false,
            random: true,
            outModes: {
              default: "out"
            },
            drift: { min: -1, max: 1 },
            angle: {
              value: 45,
              offset: 20
            }
          },
          number: {
            density: { enable: true, area: 1200 },
            value: 18
          },
          opacity: {
            value: { min: 0.2, max: 0.6 },
            animation: {
              enable: true,
              speed: 0.3,
              minimumValue: 0.1,
              sync: false
            }
          },
          shape: { type: "circle" },
          size: {
            value: { min: 3, max: 8 },
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 2,
              sync: false
            }
          },
          rotate: {
            value: { min: 0, max: 360 },
            direction: "random",
            animation: {
              enable: true,
              speed: 3,
              sync: false
            }
          },
          wobble: {
            enable: true,
            distance: 8,
            speed: { min: 1, max: 3 }
          },
          shadow: {
            enable: true,
            color: "#8b1a1a",
            blur: 3
          },
          twinkle: {
            particles: {
              enable: true,
              frequency: 0.015,
              opacity: 0.35,
              color: { value: "#d0ccc4" }
            }
          }
        },
        detectRetina: true,
      }}
    />
  );
}
