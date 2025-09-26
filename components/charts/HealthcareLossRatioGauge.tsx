'use client'

import { useState, useMemo } from 'react'
import { useFinancialStore } from '@/lib/store/useFinancialStore'

interface HealthcareLossRatioGaugeProps {
  className?: string
}

export function HealthcareLossRatioGauge({ className = '' }: HealthcareLossRatioGaugeProps) {
  const { financialMetrics } = useFinancialStore()

  // Calculate loss ratio from financial metrics
  const lossRatio = useMemo(() => {
    if (!financialMetrics || !financialMetrics.totalBudget || financialMetrics.totalBudget === 0) {
      return 0
    }

    const totalSpend = financialMetrics.totalClaims + (financialMetrics.totalExpenses || 0)
    return Math.min(Math.max((totalSpend / financialMetrics.totalBudget) * 100, 0), 100)
  }, [financialMetrics])

  // Calculate needle rotation angle
  const needleAngle = useMemo(() => {
    // Map 0-100% to -90 to +90 degrees (180-degree arc)
    return -90 + (lossRatio * 1.8)
  }, [lossRatio])

  // Define the six color zones
  const zones = [
    { color: '#C2362C', start: 0, end: 60 },     // Deep red - Bad
    { color: '#E3532C', start: 60, end: 70 },    // Orange-red
    { color: '#F39C12', start: 70, end: 75 },    // Orange
    { color: '#F3E34F', start: 75, end: 80 },    // Lemon yellow
    { color: '#9AC13B', start: 80, end: 85 },    // Yellow-green
    { color: '#63B61B', start: 85, end: 100 }    // Bright green - Good
  ]

  // Calculate zone paths for the semicircular arc
  const createZonePath = (startPercent: number, endPercent: number) => {
    const startAngle = (startPercent / 100) * Math.PI
    const endAngle = (endPercent / 100) * Math.PI
    const radius = 80
    const centerX = 150
    const centerY = 150

    const startX = centerX - radius * Math.cos(startAngle)
    const startY = centerY - radius * Math.sin(startAngle)
    const endX = centerX - radius * Math.cos(endAngle)
    const endY = centerY - radius * Math.sin(endAngle)

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 0 ${endX} ${endY}`
  }

  return (
    <div className={`bg-black rounded-xl p-6 ${className}`}>
      <div className="aspect-video relative">
        {/* Decorative hexagon badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-white rounded-md bg-transparent flex items-center justify-center">
            <div className="w-4 h-4 bg-gradient-to-r from-pink-400 via-yellow-300 to-blue-400 rounded-sm opacity-80"></div>
          </div>
          <span className="text-white text-2xl font-bold">4</span>
        </div>

        {/* Part 5 label */}
        <div className="absolute bottom-4 left-4">
          <div className="bg-gray-300 px-3 py-1 rounded text-black text-sm font-bold">
            PART 5
          </div>
        </div>

        {/* Main gauge container */}
        <div className="flex items-center justify-center h-full">
          <div className="relative w-80 h-40">
            {/* SVG Gauge */}
            <svg
              viewBox="0 0 300 150"
              className="w-full h-full"
              role="img"
              aria-labelledby="gauge-title"
            >
              <title id="gauge-title">Healthcare Loss Ratio Gauge</title>
              
              {/* Zone arcs */}
              {zones.map((zone, index) => (
                <path
                  key={index}
                  d={createZonePath(zone.start, zone.end)}
                  fill="none"
                  stroke={zone.color}
                  strokeWidth="20"
                  strokeLinecap="butt"
                />
              ))}

              {/* Zone separators */}
              {[60, 70, 75, 80, 85].map((percent, index) => {
                const angle = (percent / 100) * Math.PI
                const innerRadius = 70
                const outerRadius = 90
                const centerX = 150
                const centerY = 150
                
                const x1 = centerX - innerRadius * Math.cos(angle)
                const y1 = centerY - innerRadius * Math.sin(angle)
                const x2 = centerX - outerRadius * Math.cos(angle)
                const y2 = centerY - outerRadius * Math.sin(angle)

                return (
                  <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#000000"
                    strokeWidth="2"
                  />
                )
              })}

              {/* Needle */}
              <g transform={`rotate(${needleAngle} 150 150)`}>
                <line
                  x1="150"
                  y1="150"
                  x2="150"
                  y2="75"
                  stroke="#2B2B2B"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle
                  cx="150"
                  cy="150"
                  r="6"
                  fill="white"
                  stroke="#2B2B2B"
                  strokeWidth="2"
                />
              </g>
            </svg>

            {/* Labels */}
            <div className="absolute bottom-0 left-0 text-white font-bold text-sm">
              Bad
            </div>
            <div className="absolute bottom-0 right-0 text-white font-bold text-sm">
              Good
            </div>
          </div>
        </div>

        {/* Percentage display */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color: '#FF007A' }}>
              {lossRatio.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-4 text-center">
        <div className="text-white text-sm opacity-75">
          Loss Ratio
          {lossRatio === 0 ? ' - Enter Data' : lossRatio < 75 ? ' - Below Target' : lossRatio <= 85 ? ' - Optimal Range' : ' - Above Target'}
        </div>
      </div>
    </div>
  )
}