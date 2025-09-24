'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

export default function OutlierClaimsChart() {
  const data = useMemo(() => {
    // Generate sample data for scatter plot
    const departments = ['Cardiology', 'Oncology', 'Emergency', 'Surgery', 'Pediatrics', 'Mental Health', 'Orthopedics']
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4']
    
    const scatterData = departments.map((dept, deptIndex) => {
      const departmentPoints = []
      const baseColor = colors[deptIndex]
      
      // Generate 20-30 points per department
      const numPoints = 20 + Math.floor(Math.random() * 10)
      
      for (let i = 0; i < numPoints; i++) {
        // Most claims should be normal (low cost, moderate frequency)
        let cost, frequency
        const outlierChance = Math.random()
        
        if (outlierChance < 0.05) {
          // 5% chance of high-cost outliers
          cost = 80000 + Math.random() * 120000
          frequency = 1 + Math.random() * 3
        } else if (outlierChance < 0.1) {
          // 5% chance of high-frequency outliers  
          cost = 5000 + Math.random() * 15000
          frequency = 15 + Math.random() * 25
        } else {
          // Normal distribution
          cost = 1000 + Math.random() * 25000
          frequency = 1 + Math.random() * 12
        }
        
        departmentPoints.push([
          Math.round(cost),
          Math.round(frequency),
          dept,
          deptIndex
        ])
      }
      
      return {
        name: dept,
        type: 'scatter',
        data: departmentPoints,
        itemStyle: {
          color: baseColor,
          opacity: 0.7
        },
        symbolSize: function(data: number[]) {
          // Size based on cost (larger = more expensive)
          return Math.max(6, Math.min(20, data[0] / 8000))
        }
      }
    })
    
    return scatterData
  }, [])

  const option = useMemo(() => ({
    grid: {
      left: '8%',
      right: '8%',
      top: '15%',
      bottom: '15%'
    },
    xAxis: {
      type: 'value',
      name: 'Claim Cost ($)',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        fontSize: 12
      },
      axisLabel: {
        fontSize: 10,
        formatter: function(value: number) {
          if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K'
          }
          return '$' + value.toFixed(0)
        }
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Frequency',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        fontSize: 12
      },
      axisLabel: {
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: function(params: any) {
        const [cost, frequency, department] = params.data
        return `
          <strong>${department}</strong><br/>
          Cost: $${cost.toLocaleString()}<br/>
          Frequency: ${frequency} claims
        `
      }
    },
    legend: {
      data: data.map(series => series.name),
      top: '2%',
      textStyle: {
        fontSize: 10
      },
      itemWidth: 12,
      itemHeight: 8
    },
    series: data,
    // Add zoom functionality
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none'
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        filterMode: 'none'
      }
    ]
  }), [data])

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  )
}