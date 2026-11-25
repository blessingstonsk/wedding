import { motion } from 'framer-motion';
import { weddingConfig } from '../../config/weddingConfig';
import { Monogram } from '../ui/Florals';

export function LoadingScreen() {
  const { groom, bride } = weddingConfig.couple.initials;
  return (
    <motion.div
      className="fixed inset-0 z-[100] grid place-items-center bg-wine-950"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      role="status"
      aria-label="Loading invitation"
    >
      <div className="flex flex-col items-center gap-6">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
          <Monogram a={groom} b={bride} className="h-36 w-36 text-5xl" />
        </motion.div>
        <div className="h-px w-40 overflow-hidden bg-gold/20">
          <motion.div
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="eyebrow text-gold/70">Preparing your invitation</p>
      </div>
    </motion.div>
  );
}
