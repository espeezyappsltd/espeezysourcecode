'use client'

import { motion, type MotionProps } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

export function AssetsMotionRoot({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduceMotion = usePrefersReducedMotion()
  const motionProps: MotionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 } }

  return (
    <motion.div className={className} {...motionProps}>
      {children}
    </motion.div>
  )
}
