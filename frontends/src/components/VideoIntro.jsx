import { motion } from 'framer-motion';

export default function VideoIntro() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full h-[70vh] overflow-hidden bg-black">
      {/* 🎥 Vidéo de fond */}
      <video
        src="/videos/video1.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover opacity-60 blur-[1px] scale-105"
      />

      {/* 🔳 Overlay sombre + dégradé */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent z-5 pointer-events-none" />

      {/* 🪄 Contenu superposé animé */}
      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ duration: 1, ease: 'easeOut' }}
        variants={fadeUp}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
      >
        <motion.a
          href="#produits"
          variants={fadeUp}
          transition={{ delay: 0.5, duration: 1 }}
          className="px-6 py-3 bg-white text-cyan-700 text-lg sm:text-xl font-semibold rounded-full shadow-lg hover:bg-cyan-100 transition dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
        >
          🛍️ Visiter nos boutiques
        </motion.a>

        <motion.p
          variants={fadeUp}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-4 max-w-xl text-sm text-gray-100 dark:text-gray-300 backdrop-blur-sm px-4 py-2"
        >
          Nos produits africains sont le reflet d'une culture riche, d'un artisanat authentique et de valeurs durables. 🌍  
          Choisir O'Sakha, c’est valoriser les talents du continent.
        </motion.p>
      </motion.div>
    </section>
  );
}
