import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export default function Typewriter({ 
  text, 
  speed = 40, 
  delay = 0, 
  className = '', 
  onComplete 
}: TypewriterProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShouldAnimate(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const characters = text.split("");

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: speed / 1000, 
      },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 8,
        stiffness: 150,
        mass: 1,
        restDelta: 0.001
      },
    },
    hidden: {
      opacity: 0,
      y: 80, // Falling UPwards (Anti-Gravity)
      filter: "blur(8px)",
      rotate: 10
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate={shouldAnimate ? "visible" : "hidden"}
      onAnimationComplete={onComplete}
      style={{ display: "inline-block" }}
    >
      {characters.map((char, index) => (
        <motion.span
          variants={child}
          key={index}
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
