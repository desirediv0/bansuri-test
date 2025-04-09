"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedTextProps2 } from '@/type'

const AnimatedText2: React.FC<AnimatedTextProps2> = ({
  text,
  className = '',
  letterSpacing = '0.05em'
}) => {
  return (
    <div className={`inline-block ${className}`} style={{ letterSpacing }}>
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          className="inline-block"
          initial={{ display: 'inline-block' }}
          whileHover={{
            y: -5,
            filter: 'blur(2px)',
            scale: 1.2,
            transition: { duration: 0.2 }
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  )
}

export default AnimatedText2

