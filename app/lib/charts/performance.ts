// Performance optimization utilities for healthcare chart rendering

import { ChartConfig, ChartRenderOptions } from '@/types/charts'

// Cache interface for chart configurations and rendered images
interface ChartCache {
  config: Map<string, { data: any; timestamp: number; ttl: number }>
  images: Map<string, { buffer: Buffer; timestamp: number; ttl: number }>
  stats: {
    hits: number
    misses: number
    evictions: number
  }
}

// In-memory cache instance (in production, use Redis or similar)
const chartCache: ChartCache = {
  config: new Map(),
  images: new Map(),
  stats: { hits: 0, misses: 0, evictions: 0 }
}

// Cache configuration
const CACHE_CONFIG = {
  CONFIG_TTL: 5 * 60 * 1000,      // 5 minutes for chart configs
  IMAGE_TTL: 30 * 60 * 1000,      // 30 minutes for rendered images
  MAX_CONFIG_ENTRIES: 100,         // Maximum config cache entries
  MAX_IMAGE_ENTRIES: 50,           // Maximum image cache entries
  CLEANUP_INTERVAL: 10 * 60 * 1000 // 10 minutes cleanup interval
}

// Performance monitoring
interface PerformanceMetrics {
  renderTime: number
  dataProcessingTime: number
  cacheHitRate: number
  memoryUsage: number
  chartComplexity: number
}

// Chart complexity calculator for performance optimization
export function calculateChartComplexity(data: any, config: ChartConfig): number {
  let complexity = 0

  // Data point complexity
  if (data?.datasets) {
    for (const dataset of data.datasets) {
      complexity += (dataset.data?.length || 0) * 0.1
    }
  }

  // Configuration complexity
  if (config.plugins?.legend?.display) complexity += 10
  if (config.plugins?.tooltip?.enabled) complexity += 5
  if (config.scales?.x?.grid?.display) complexity += 3
  if (config.scales?.y?.grid?.display) complexity += 3

  // Chart type complexity
  const typeComplexity = {
    line: 1,
    bar: 1.2,
    doughnut: 1.5,
    pie: 1.5,
    area: 2
  }
  complexity *= typeComplexity[config.type as keyof typeof typeComplexity] || 1

  return Math.round(complexity)
}

// Optimized chart configuration based on performance requirements
export function optimizeChartConfig(
  config: ChartConfig,
  data: any,
  performanceMode: 'high' | 'medium' | 'low' = 'medium'
): ChartConfig {
  const optimizedConfig = JSON.parse(JSON.stringify(config)) // Deep clone

  const complexity = calculateChartComplexity(data, config)

  // Apply optimizations based on performance mode and complexity
  if (performanceMode === 'high' || complexity > 100) {
    // High performance mode - aggressive optimizations
    optimizedConfig.animation = { duration: 0 }
    optimizedConfig.responsive = false
    optimizedConfig.plugins.tooltip = { enabled: false }
    
    if (optimizedConfig.scales?.x?.grid) {
      optimizedConfig.scales.x.grid.display = false
    }
    if (optimizedConfig.scales?.y?.grid) {
      optimizedConfig.scales.y.grid.display = false
    }

    // Reduce point radius for line charts
    if (optimizedConfig.elements?.point) {
      optimizedConfig.elements.point.radius = 0
      optimizedConfig.elements.point.hoverRadius = 0
    }

  } else if (performanceMode === 'medium' || complexity > 50) {
    // Medium performance mode - balanced optimizations
    optimizedConfig.animation = { duration: 300 }
    
    if (optimizedConfig.elements?.point) {
      optimizedConfig.elements.point.radius = 2
      optimizedConfig.elements.point.hoverRadius = 4
    }

  } else {
    // Low performance mode - full features
    optimizedConfig.animation = { duration: 750 }
    
    if (optimizedConfig.elements?.point) {
      optimizedConfig.elements.point.radius = 4
      optimizedConfig.elements.point.hoverRadius = 6
    }
  }

  return optimizedConfig
}

// Data sampling for large datasets
export function sampleLargeDataset(
  data: any,
  maxPoints: number = 100
): { data: any; samplingApplied: boolean } {
  if (!data?.datasets?.[0]?.data || data.datasets[0].data.length <= maxPoints) {
    return { data, samplingApplied: false }
  }

  const originalLength = data.datasets[0].data.length
  const sampleRate = Math.ceil(originalLength / maxPoints)

  const sampledData = {
    ...data,
    labels: data.labels?.filter((_: any, index: number) => index % sampleRate === 0) || [],
    datasets: data.datasets.map((dataset: any) => ({
      ...dataset,
      data: dataset.data.filter((_: any, index: number) => index % sampleRate === 0)
    }))
  }

  return { data: sampledData, samplingApplied: true }
}

// Cache key generation
function generateCacheKey(
  chartType: string,
  theme: string,
  dataHash: string,
  options?: any
): string {
  const optionsStr = options ? JSON.stringify(options) : ''
  return `${chartType}-${theme}-${dataHash}-${btoa(optionsStr).substring(0, 10)}`
}

// Simple hash function for data
function hashData(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

// Chart configuration caching
export class ChartConfigCache {
  static get(
    chartType: string,
    theme: string,
    data: any,
    options?: any
  ): { config: ChartConfig; data: any } | null {
    const dataHash = hashData(data)
    const key = generateCacheKey(chartType, theme, dataHash, options)
    const cached = chartCache.config.get(key)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      chartCache.stats.hits++
      return cached.data
    }

    chartCache.stats.misses++
    return null
  }

  static set(
    chartType: string,
    theme: string,
    data: any,
    configData: { config: ChartConfig; data: any },
    options?: any,
    ttl: number = CACHE_CONFIG.CONFIG_TTL
  ): void {
    const dataHash = hashData(data)
    const key = generateCacheKey(chartType, theme, dataHash, options)

    // Evict oldest entries if cache is full
    if (chartCache.config.size >= CACHE_CONFIG.MAX_CONFIG_ENTRIES) {
      const oldestKey = Array.from(chartCache.config.keys())[0]
      chartCache.config.delete(oldestKey)
      chartCache.stats.evictions++
    }

    chartCache.config.set(key, {
      data: configData,
      timestamp: Date.now(),
      ttl
    })
  }

  static clear(): void {
    chartCache.config.clear()
  }

  static getStats(): typeof chartCache.stats {
    return { ...chartCache.stats }
  }
}

// Chart image caching (for rendered charts)
export class ChartImageCache {
  static get(
    chartType: string,
    theme: string,
    data: any,
    renderOptions: ChartRenderOptions
  ): Buffer | null {
    const dataHash = hashData(data)
    const key = generateCacheKey(chartType, theme, dataHash, renderOptions)
    const cached = chartCache.images.get(key)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      chartCache.stats.hits++
      return cached.buffer
    }

    chartCache.stats.misses++
    return null
  }

  static set(
    chartType: string,
    theme: string,
    data: any,
    buffer: Buffer,
    renderOptions: ChartRenderOptions,
    ttl: number = CACHE_CONFIG.IMAGE_TTL
  ): void {
    const dataHash = hashData(data)
    const key = generateCacheKey(chartType, theme, dataHash, renderOptions)

    // Evict oldest entries if cache is full
    if (chartCache.images.size >= CACHE_CONFIG.MAX_IMAGE_ENTRIES) {
      const oldestKey = Array.from(chartCache.images.keys())[0]
      chartCache.images.delete(oldestKey)
      chartCache.stats.evictions++
    }

    chartCache.images.set(key, {
      buffer,
      timestamp: Date.now(),
      ttl
    })
  }

  static clear(): void {
    chartCache.images.clear()
  }
}

// Performance monitoring
export class ChartPerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map()

  recordMetrics(chartType: string, metrics: Partial<PerformanceMetrics>): void {
    const fullMetrics: PerformanceMetrics = {
      renderTime: metrics.renderTime || 0,
      dataProcessingTime: metrics.dataProcessingTime || 0,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: this.getMemoryUsage(),
      chartComplexity: metrics.chartComplexity || 0
    }

    if (!this.metrics.has(chartType)) {
      this.metrics.set(chartType, [])
    }

    const chartMetrics = this.metrics.get(chartType)!
    chartMetrics.push(fullMetrics)

    // Keep only the last 100 entries per chart type
    if (chartMetrics.length > 100) {
      chartMetrics.shift()
    }
  }

  getAverageMetrics(chartType: string): PerformanceMetrics | null {
    const metrics = this.metrics.get(chartType)
    if (!metrics || metrics.length === 0) return null

    return {
      renderTime: this.average(metrics.map(m => m.renderTime)),
      dataProcessingTime: this.average(metrics.map(m => m.dataProcessingTime)),
      cacheHitRate: this.average(metrics.map(m => m.cacheHitRate)),
      memoryUsage: this.average(metrics.map(m => m.memoryUsage)),
      chartComplexity: this.average(metrics.map(m => m.chartComplexity))
    }
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  private calculateCacheHitRate(): number {
    const { hits, misses } = chartCache.stats
    const total = hits + misses
    return total > 0 ? (hits / total) * 100 : 0
  }

  private getMemoryUsage(): number {
    // Estimate memory usage of cache
    const configSize = chartCache.config.size * 1024 // Rough estimate
    const imageSize = chartCache.images.size * 50 * 1024 // Rough estimate (50KB per image)
    return configSize + imageSize
  }

  getAllMetrics(): Record<string, PerformanceMetrics | null> {
    const result: Record<string, PerformanceMetrics | null> = {}
    for (const chartType of this.metrics.keys()) {
      result[chartType] = this.getAverageMetrics(chartType)
    }
    return result
  }

  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Global performance monitor instance
export const performanceMonitor = new ChartPerformanceMonitor()

// Lazy loading utilities
export class ChartLazyLoader {
  private intersectionObserver?: IntersectionObserver

  constructor(private onIntersect: (element: Element) => void) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.onIntersect(entry.target)
              this.intersectionObserver?.unobserve(entry.target)
            }
          })
        },
        {
          rootMargin: '50px', // Start loading 50px before the element is visible
          threshold: 0.1
        }
      )
    }
  }

  observe(element: Element): void {
    this.intersectionObserver?.observe(element)
  }

  disconnect(): void {
    this.intersectionObserver?.disconnect()
  }
}

// Cleanup utility for expired cache entries
export function cleanupExpiredCacheEntries(): void {
  const now = Date.now()
  
  // Clean config cache
  for (const [key, entry] of chartCache.config.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      chartCache.config.delete(key)
      chartCache.stats.evictions++
    }
  }

  // Clean image cache
  for (const [key, entry] of chartCache.images.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      chartCache.images.delete(key)
      chartCache.stats.evictions++
    }
  }
}

// Start periodic cache cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCacheEntries, CACHE_CONFIG.CLEANUP_INTERVAL)
}

// Performance timing utility
export function withPerformanceTiming<T>(
  operation: () => T | Promise<T>,
  label: string
): Promise<{ result: T; timing: number }> {
  const start = performance.now()
  
  const result = operation()
  
  if (result instanceof Promise) {
    return result.then(res => ({
      result: res,
      timing: performance.now() - start
    }))
  }
  
  return Promise.resolve({
    result,
    timing: performance.now() - start
  })
}

// Export cache stats for monitoring
export function getCacheStats(): {
  config: { size: number; maxSize: number }
  images: { size: number; maxSize: number }
  stats: typeof chartCache.stats
  hitRate: number
} {
  const { hits, misses } = chartCache.stats
  const total = hits + misses
  const hitRate = total > 0 ? (hits / total) * 100 : 0

  return {
    config: {
      size: chartCache.config.size,
      maxSize: CACHE_CONFIG.MAX_CONFIG_ENTRIES
    },
    images: {
      size: chartCache.images.size,
      maxSize: CACHE_CONFIG.MAX_IMAGE_ENTRIES
    },
    stats: { ...chartCache.stats },
    hitRate
  }
}