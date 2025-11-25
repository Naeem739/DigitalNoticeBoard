'use client'

import { useAnimatedSentences } from '@/hooks/useAnimatedSentences';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedSentencesProps {
  sentences: string[];
  interval?: number;
}

export function AnimatedSentences({ sentences, interval = 3000 }: AnimatedSentencesProps) {
  const { currentSentence, isAnimating } = useAnimatedSentences(sentences, interval);

  return (
    <div className="h-20 flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {!isAnimating && (
          <motion.div
            key={currentSentence}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-base font-bold text-center"
          >
            {currentSentence}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

