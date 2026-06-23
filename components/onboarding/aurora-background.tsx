"use client"

import { motion, useReducedMotion, type Easing } from "motion/react"

import { cn } from "@/lib/utils"

type Blob = {
  background: string
  className: string
  animate: {
    x: number[]
    y: number[]
    scale: number[]
  }
  transition: {
    duration: number
    ease: Easing
  }
}

const BLOBS: Blob[] = [
  {
    background:
      "radial-gradient(circle at center, rgba(91, 86, 224, 0.9), rgba(91, 86, 224, 0) 70%)",
    className: "left-[-10%] top-[-15%] h-[55vw] w-[55vw]",
    animate: {
      x: [0, 60, -20, 0],
      y: [0, 40, -30, 0],
      scale: [1, 1.15, 0.95, 1],
    },
    transition: { duration: 22, ease: "easeInOut" },
  },
  {
    background:
      "radial-gradient(circle at center, rgba(79, 70, 229, 0.85), rgba(79, 70, 229, 0) 70%)",
    className: "right-[-12%] top-[5%] h-[50vw] w-[50vw]",
    animate: { x: [0, -50, 30, 0], y: [0, 50, 20, 0], scale: [1, 0.9, 1.2, 1] },
    transition: { duration: 26, ease: "easeInOut" },
  },
  {
    background:
      "radial-gradient(circle at center, rgba(16, 185, 129, 0.8), rgba(16, 185, 129, 0) 70%)",
    className: "bottom-[-15%] left-[10%] h-[48vw] w-[48vw]",
    animate: {
      x: [0, 40, -40, 0],
      y: [0, -30, 30, 0],
      scale: [1, 1.1, 0.92, 1],
    },
    transition: { duration: 30, ease: "linear" },
  },
  {
    background:
      "radial-gradient(circle at center, rgba(245, 158, 11, 0.7), rgba(245, 158, 11, 0) 70%)",
    className: "bottom-[-10%] right-[5%] h-[42vw] w-[42vw]",
    animate: {
      x: [0, -30, 50, 0],
      y: [0, 30, -20, 0],
      scale: [1, 1.18, 0.95, 1],
    },
    transition: { duration: 18, ease: "easeInOut" },
  },
]

export default function AuroraBackground({
  className,
}: {
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full opacity-30 mix-blend-normal blur-3xl",
            blob.className
          )}
          style={{ backgroundImage: blob.background }}
          animate={reduceMotion ? undefined : blob.animate}
          transition={
            reduceMotion
              ? undefined
              : {
                  ...blob.transition,
                  repeat: Infinity,
                  repeatType: "mirror",
                }
          }
        />
      ))}
    </div>
  )
}
