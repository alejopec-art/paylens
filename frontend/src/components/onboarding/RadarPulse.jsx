import React from 'react';
import { motion } from 'framer-motion';

const RadarPulse = ({ size = "12rem", color = "var(--cyan-precision)" }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-cyan-500/30"
          initial={{ scale: 0.8, opacity: 1 }}
          animate={{
            scale: 2.2,
            opacity: 0,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut",
          }}
          style={{ width: "100%", height: "100%" }}
        />
      ))}
      <div className="relative z-10 w-16 h-16 bg-cyan-500/10 rounded-full border border-cyan-500/20 backdrop-blur-md flex items-center justify-center">
         <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_15px_#0ea5e9]" />
      </div>
    </div>
  );
};

export default RadarPulse;
