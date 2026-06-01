import React, { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useTheme } from '../../../context/ThemeContext';

let isParticlesInitialized = false;

export default function FrostbyteParticles({ forceActive = false, containerId = "tsparticles", className = "fixed inset-0 pointer-events-none z-[0]" }) {
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

  if (!init || (!forceActive && advancedTheme !== 'frostbyte')) return null;

  return (
    <Particles
      id={containerId}
      className={className}
      options={{
        background: { color: { value: "transparent" } },
        fpsLimit: 60,
        particles: {
          color: { value: ["#ffffff", "#a5f3fc", "#22d3ee"] },
          move: {
            direction: "bottom-left",
            enable: true,
            speed: 1.5,
            straight: false,
          },
          number: { density: { enable: true, area: 800 }, value: 80 },
          opacity: { value: { min: 0.2, max: 0.7 } },
          shape: { type: ["circle", "polygon"], polygon: { sides: 6 } }, // Ice flakes
          size: { value: { min: 1, max: 4 } },
          shadow: { enable: true, color: "#22d3ee", blur: 10 }
        },
        detectRetina: true,
      }}
    />
  );
}

// Version-2.0