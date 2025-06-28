"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function PageLoading() {
  const [visibleBars, setVisibleBars] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleBars((prev) => {
        if (prev >= 3) {
          return 1
        }
        return prev + 1
      })
    }, 600) // Change every 600ms

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col space-y-2 w-48">
        {[1, 2, 3].map((barIndex) => (
          <motion.div
            key={barIndex}
            className="h-2 bg-primary rounded-full"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: visibleBars >= barIndex ? 1 : 0,
              scaleX: visibleBars >= barIndex ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            style={{ originX: 0 }}
          />
        ))}
      </div>
    </div>
  )
}

export function VideoLoadingOverlay({ disableCard = false }: { disableCard?: boolean }) {
  const [visibleBars, setVisibleBars] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleBars((prev) => {
        if (prev >= 3) {
          return 1
        }
        return prev + 1
      })
    }, 600) // Change every 600ms

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-900/95 via-black/90 to-gray-900/95 backdrop-blur-sm ${disableCard ? "" : "rounded-xl"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col space-y-3 w-32">
        {[1, 2, 3].map((barIndex) => (
          <motion.div
            key={barIndex}
            className="h-1.5 bg-primary rounded-full shadow-sm"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: visibleBars >= barIndex ? 1 : 0,
              scaleX: visibleBars >= barIndex ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            style={{ originX: 0 }}
          />
        ))}
        <motion.p
          className="text-xs text-white/80 text-center mt-2"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading video...
        </motion.p>
      </div>
    </motion.div>
  )
}
