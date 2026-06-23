"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  life: number
  maxLife: number
}

const COLORS = ["#5b56e0", "#4f46e5", "#10b981", "#f59e0b", "#ffffff"]
const GRAVITY = 0.18

export default function SavingsConfetti({
  fireKey,
  className,
}: {
  fireKey: number | string
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const prevKeyRef = useRef<number | string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const setupSize = () => {
      const c = canvasRef.current
      if (!c) return
      const dpr = window.devicePixelRatio || 1
      const rect = c.getBoundingClientRect()
      c.width = Math.max(1, Math.floor(rect.width * dpr))
      c.height = Math.max(1, Math.floor(rect.height * dpr))
      const ctx = c.getContext("2d")
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
    }

    setupSize()
    window.addEventListener("resize", setupSize)
    return () => window.removeEventListener("resize", setupSize)
  }, [])

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) return

    if (!fireKey) return
    if (prevKeyRef.current === fireKey) return
    prevKeyRef.current = fireKey

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    const count = 80 + Math.floor(Math.random() * 60)
    const originX = width / 2
    const originY = height * 0.45
    const burst: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2
      const speed = 4 + Math.random() * 8
      const maxLife = 70 + Math.random() * 50
      burst.push({
        x: originX + (Math.random() - 0.5) * 40,
        y: originY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        life: 0,
        maxLife,
      })
    }
    particlesRef.current = particlesRef.current.concat(burst)

    if (rafRef.current !== null) return

    const tick = () => {
      const c = canvasRef.current
      const context = c?.getContext("2d")
      if (!c || !context) {
        rafRef.current = null
        return
      }
      const w = c.width / (window.devicePixelRatio || 1)
      const h = c.height / (window.devicePixelRatio || 1)
      context.clearRect(0, 0, w, h)

      const particles = particlesRef.current
      for (const p of particles) {
        p.life += 1
        p.vy += GRAVITY
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotationSpeed
      }
      particlesRef.current = particles.filter((p) => p.life < p.maxLife)

      for (const p of particlesRef.current) {
        const alpha = 1 - p.life / p.maxLife
        context.save()
        context.globalAlpha = Math.max(0, alpha)
        context.translate(p.x, p.y)
        context.rotate(p.rotation)
        context.fillStyle = p.color
        context.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        context.restore()
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        context.clearRect(0, 0, w, h)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [fireKey])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    />
  )
}
