import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * FeatureCard Component
 * 
 * A premium feature card that displays a static image by default and
 * crossfades into an autoplaying video on hover.
 */
const FeatureCard = ({ title, description, imageSrc, videoSrc, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  // Play/Pause video based on hover state to optimize performance
  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Handle cases where autoplay might be blocked
            console.warn("Video playback failed:", error);
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isHovered]);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative bg-[#1a1a1a] rounded-2xl md:rounded-3xl overflow-hidden border border-gray-800 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10 hover:border-accent/20"
    >
      {/* Media Section */}
      <div className="relative h-48 md:h-52 w-full overflow-hidden">
        {/* Fallback Static Image */}
        <img
          src={imageSrc}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
        />

        {/* Hover Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        />

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent opacity-60" />
      </div>

      {/* Text Content */}
      <div className="p-6 md:p-8">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">
          {description}
        </p>
      </div>

      {/* Interactive Border Glow */}
      <div 
        className={`absolute inset-0 pointer-events-none border-2 border-accent transition-opacity duration-500 rounded-2xl md:rounded-3xl ${
          isHovered ? 'opacity-10' : 'opacity-0'
        }`}
      />
    </motion.div>
  );
};

export default FeatureCard;
