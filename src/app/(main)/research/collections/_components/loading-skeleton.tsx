import React from "react";

import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const skeletonVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const pulseVariants = {
  pulse: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function LoadingSkeleton() {
  return (
    <motion.div className="@container/main" variants={containerVariants} initial="hidden" animate="visible">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        <motion.div
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          variants={skeletonVariants}
        >
          <div className="space-y-2">
            <motion.div variants={pulseVariants} animate="pulse">
              <Skeleton className="h-8 w-48" />
            </motion.div>
            <motion.div variants={pulseVariants} animate="pulse">
              <Skeleton className="h-4 w-64" />
            </motion.div>
          </div>
          <motion.div variants={pulseVariants} animate="pulse">
            <Skeleton className="h-10 w-24" />
          </motion.div>
        </motion.div>

        <motion.div className="flex flex-wrap gap-2" variants={skeletonVariants}>
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div key={i} variants={pulseVariants} animate="pulse" style={{ animationDelay: `${i * 0.1}s` }}>
              <Skeleton className={`h-6 ${i === 0 ? "w-24" : i === 1 ? "w-32" : "w-28"}`} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          variants={containerVariants}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="relative mx-auto w-full max-w-sm"
              variants={skeletonVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900/50 to-black/50 shadow-lg">
                <CardContent className="p-0">
                  <motion.div variants={pulseVariants} animate="pulse" style={{ animationDelay: `${i * 0.05}s` }}>
                    <Skeleton className="aspect-[9/16] w-full" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function VideosLoadingSkeleton() {
  return (
    <motion.div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={i}
          className="relative mx-auto w-full max-w-sm"
          variants={skeletonVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900/50 to-black/50 shadow-lg">
            <CardContent className="p-0">
              <motion.div variants={pulseVariants} animate="pulse" style={{ animationDelay: `${i * 0.05}s` }}>
                <Skeleton className="aspect-[9/16] w-full" />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
