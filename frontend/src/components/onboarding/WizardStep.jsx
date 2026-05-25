import React from 'react';
import { motion } from 'framer-motion';

const WizardStep = ({ children, stepKey }) => {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="w-full h-full flex flex-col items-center justify-center p-4"
    >
      {children}
    </motion.div>
  );
};

export default WizardStep;
