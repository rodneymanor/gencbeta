import React, { useState, useEffect } from "react";

import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";

const gradientSpinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

const floatingCardVariants = {
  animate: {
    y: [-8, 8, -8],
    rotate: [-1, 1, -1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const particleVariants = {
  animate: {
    y: [-20, 20, -20],
    x: [-10, 10, -10],
    opacity: [0.3, 0.8, 0.3],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const shimmerVariants = {
  animate: {
    x: ["-100%", "100%"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }
    }, 100 + delay);

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay]);

  return (
    <span className="inline-block">
      {displayText}
      <motion.span
        className="bg-primary ml-1 inline-block h-6 w-0.5"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </span>
  );
};

const LoadingCard = ({ index }: { index: number }) => (
  <motion.div
    className="relative mx-auto w-full max-w-sm"
    variants={cardVariants}
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <motion.div variants={floatingCardVariants} animate="animate" style={{ animationDelay: `${index * 0.2}s` }}>
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-gray-900/80 to-black/60 shadow-2xl backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="relative aspect-[9/16] w-full overflow-hidden">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))",
                  "linear-gradient(225deg, rgba(236, 72, 153, 0.2), rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2))",
                  "linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Shimmer effect */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                variants={shimmerVariants}
                animate="animate"
                style={{ animationDelay: `${index * 0.3}s` }}
              />
            </div>

            {/* Content placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="border-primary/30 border-t-primary h-12 w-12 rounded-full border-2"
                variants={gradientSpinnerVariants}
                animate="animate"
              />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0">
              {Array.from({ length: 3 }).map((_, particleIndex) => (
                <motion.div
                  key={particleIndex}
                  className="bg-primary/40 absolute h-1 w-1 rounded-full"
                  style={{
                    left: `${20 + particleIndex * 30}%`,
                    top: `${10 + particleIndex * 20}%`,
                  }}
                  variants={particleVariants}
                  animate="animate"
                  transition={{
                    delay: particleIndex * 0.5,
                    duration: 3,
                    repeat: Infinity,
                  }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);

export function LoadingSkeleton() {
  return (
    <div className="@container/main min-h-screen">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        {/* Enhanced Header Section */}
        <motion.div
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-3">
            <motion.div
              className="h-8 w-48 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-700/50 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex h-full items-center px-4 text-lg font-semibold text-gray-300">
                <TypewriterText text="Loading Collections..." delay={500} />
              </div>
            </motion.div>
            <motion.div
              className="h-4 w-64 rounded-md bg-gradient-to-r from-gray-700/40 to-gray-600/40"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex h-full items-center px-3 text-sm text-gray-400">
                <TypewriterText text="Preparing your video library..." delay={1500} />
              </div>
            </motion.div>
          </div>

          {/* Animated action button placeholder */}
          <motion.div
            className="from-primary/20 to-primary/30 relative h-10 w-24 overflow-hidden rounded-lg bg-gradient-to-r shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              variants={shimmerVariants}
              animate="animate"
            />
          </motion.div>
        </motion.div>

        {/* Enhanced Filter Tags Section */}
        <motion.div
          className="flex flex-wrap gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className={`relative h-6 overflow-hidden rounded-full bg-gradient-to-r from-gray-700/40 to-gray-600/40 shadow-md ${
                i === 0 ? "w-24" : i === 1 ? "w-32" : "w-28"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                variants={shimmerVariants}
                animate="animate"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Video Grid with Floating Cards */}
        <motion.div
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <LoadingCard key={i} index={i} />
          ))}
        </motion.div>

        {/* Loading Progress Indicator */}
        <motion.div
          className="flex items-center justify-center space-x-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="bg-primary h-3 w-3 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function VideosLoadingSkeleton() {
  return (
    <motion.div
      className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <LoadingCard key={i} index={i} />
      ))}
    </motion.div>
  );
}
