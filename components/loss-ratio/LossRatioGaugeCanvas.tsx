'use client'

import { useEffect, useRef } from 'react'

interface LossRatioGaugeCanvasProps {
  value: number
  target: number
  autoAnimateKey: number
}

const CANVAS_SIZE = 360
const CENTER = CANVAS_SIZE / 2
const RADIUS = CANVAS_SIZE * 0.38
const START_ANGLE = Math.PI
const END_ANGLE = 2 * Math.PI

const ZONES: Array<{ start: number; end: number; color: string }> = [
  { start: 0, end: 0.7, color: '#DC2626' },
  { start: 0.7, end: 0.8, color: '#F59E0B' },
  { start: 0.8, end: 0.85, color: '#84CC16' },
  { start: 0.85, end: 1, color: '#15803D' },
]

export default function LossRatioGaugeCanvas({ value, target, autoAnimateKey }: LossRatioGaugeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animatedValueRef = useRef<number>(value)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    animatedValueRef.current = value
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let start: number | null = null
    const startValue = animatedValueRef.current
    const endValue = value
    const duration = 600

    const drawFrame = (timestamp: number) => {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      animatedValueRef.current = startValue + (endValue - startValue) * eased
      drawGauge(ctx, animatedValueRef.current, target)
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(drawFrame)
      }
    }

    cancelAnimationFrame(animationFrameRef.current || 0)
    animationFrameRef.current = requestAnimationFrame(drawFrame)

    return () => {
      cancelAnimationFrame(animationFrameRef.current || 0)
    }
  }, [value, target, autoAnimateKey])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE / 2}
      className="w-full"
      aria-hidden="true"
    />
  )
}

function drawGauge(ctx: CanvasRenderingContext2D, currentValue: number, target: number) {
  const ratio = Math.max(0, Math.min(currentValue, 1))
  const angle = START_ANGLE + ratio * Math.PI

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE / 2)
  ctx.save()
  ctx.translate(CENTER, CENTER)
  ctx.rotate(Math.PI)

  ZONES.forEach(zone => {
    const startAngle = zone.start * Math.PI
    const endAngle = zone.end * Math.PI
    ctx.beginPath()
    ctx.strokeStyle = zone.color
    ctx.lineWidth = 28
    ctx.lineCap = 'round'
    ctx.arc(0, 0, RADIUS, startAngle, endAngle)
    ctx.stroke()
  })

  ctx.restore()

  ctx.save()
  ctx.translate(CENTER, CENTER)
  ctx.rotate(angle - Math.PI / 2)
  ctx.beginPath()
  ctx.moveTo(-10, 0)
  ctx.lineTo(RADIUS + 12, 0)
  ctx.lineWidth = 6
  ctx.strokeStyle = '#1F2937'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  ctx.beginPath()
  ctx.fillStyle = '#111827'
  ctx.arc(CENTER, CENTER, 14, 0, Math.PI * 2)
  ctx.fill()

  ctx.font = '600 24px Inter'
  ctx.fillStyle = '#111827'
  ctx.textAlign = 'center'
  ctx.fillText(`${(ratio * 100).toFixed(1)}%`, CENTER, CENTER + 48)

  const targetAngle = START_ANGLE + Math.max(0, Math.min(target, 1)) * Math.PI
  const tx = CENTER + (RADIUS + 28) * Math.cos(targetAngle)
  const ty = CENTER + (RADIUS + 28) * Math.sin(targetAngle)
  ctx.beginPath()
  ctx.strokeStyle = '#2563EB'
  ctx.lineWidth = 2
  ctx.moveTo(CENTER, CENTER)
  ctx.lineTo(tx, ty)
  ctx.stroke()
  ctx.closePath()

  ctx.font = '500 12px Inter'
  ctx.fillStyle = '#2563EB'
  ctx.fillText('Threshold', tx, ty - 12)
}
