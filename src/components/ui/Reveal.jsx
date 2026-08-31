import { motion } from 'framer-motion'
import { REVEAL_TRANSITION } from '../../lib/motion'

export default function Reveal({ children, delay = 0, y = 18, className, ...rest }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={REVEAL_TRANSITION(delay)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}