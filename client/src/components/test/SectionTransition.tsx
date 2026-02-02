import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SectionTransitionProps {
  currentSection: number;
  totalSections: number;
  onComplete?: () => void;
}

export function SectionTransition({ currentSection, totalSections, onComplete }: SectionTransitionProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostrar a transição
    setShow(true);

    // Esconder após 2.5 segundos
    const timer = setTimeout(() => {
      setShow(false);
      // Chamar callback após animação de saída (400ms)
      setTimeout(() => {
        onComplete?.();
      }, 400);
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentSection, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl px-12 py-8 shadow-2xl"
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-white/80 text-lg font-medium mb-2"
              >
                Seção
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.3,
                  type: "spring",
                  stiffness: 200
                }}
                className="text-white text-7xl font-bold mb-2"
              >
                {currentSection + 1}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="text-white/80 text-lg font-medium"
              >
                de {totalSections}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
