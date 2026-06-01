import React from 'react';
import { motion } from 'framer-motion';
import FeatureCard from './FeatureCard';

// Importing assets from the assets folder
import visualizerImg from '../../assets/Visualizer.png';
import leaderboardImg from '../../assets/Leaderboard.png';
import campaignImg from '../../assets/Campaign.png';
import battleArenaImg from '../../assets/Battle-Arena.png';

const features = [
  {
    title: "Algorithm Visualizer",
    description: "Watch your code come to life with real-time data structure animations and step-by-step execution tracking.",
    imageSrc: visualizerImg,
    videoSrc: "/visualizer-demo.mp4" // Expected in public folder
  },
  {
    title: "Global Leaderboards",
    description: "Scale the ranks, earn ELO points, and cement your status as the top coder in the global CodeArena community.",
    imageSrc: leaderboardImg,
    videoSrc: "/leaderboard-demo.mp4"
  },
  {
    title: "Campaign Mode",
    description: "Embark on an epic journey through 50+ hand-crafted challenges, unlocking exclusive achievements and lore.",
    imageSrc: campaignImg,
    videoSrc: "/campaign-demo.mp4"
  },
  {
    title: "Battle Arena",
    description: "Go head-to-head in real-time 1v1 coding duels. Speed, accuracy, and strategy are your only weapons.",
    imageSrc: battleArenaImg,
    videoSrc: "/battle-arena-demo.mp4"
  }
];

const FeatureShowcase = () => {
  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-white mb-6"
          >
            Built for the <span className="text-accent">Elite</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto"
          >
            Experience a suite of professional-grade tools designed to elevate your coding skills and competitive edge.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              index={index}
              {...feature}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase;

// Version-2.0