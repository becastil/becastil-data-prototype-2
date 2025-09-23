export interface HealthcareDataItem {
  current: number
  prior: number
  variance: number
  change: number
}

export interface FixedCost {
  id: string
  name: string
  amount: number
  category?: string
}

export interface HealthcareReportData {
  medicalClaims: {
    inpatient: HealthcareDataItem
    outpatient: HealthcareDataItem
    emergency: HealthcareDataItem
    specialty: HealthcareDataItem
    preventive: HealthcareDataItem
  }
  pharmacyClaims: {
    brand: HealthcareDataItem
    generic: HealthcareDataItem
    specialty: HealthcareDataItem
  }
  stopLoss: {
    specific: HealthcareDataItem
    aggregate: HealthcareDataItem
  }
  enrollment: {
    totalMembers: HealthcareDataItem
    memberMonths: HealthcareDataItem
  }
  budget: {
    planned: number
    actual: number
    variance: number
    variancePercent: number
  }
}

export interface ChartDataPoint {
  month: string
  claims?: number
  amount?: number
  budget?: number
  actual?: number
}

export interface TopDriver {
  id: string
  name: string
  amount: number
  visits: number
  percentage: number
}

export class HealthcareDataService {
  // Generate mock healthcare data
  static generateHealthcareData(): HealthcareReportData {
    return {
      medicalClaims: {
        inpatient: { current: 425600, prior: 398200, variance: 27400, change: 6.9 },
        outpatient: { current: 318900, prior: 305100, variance: 13800, change: 4.5 },
        emergency: { current: 142300, prior: 148500, variance: -6200, change: -4.2 },
        specialty: { current: 89400, prior: 82100, variance: 7300, change: 8.9 },
        preventive: { current: 56200, prior: 52800, variance: 3400, change: 6.4 }
      },
      pharmacyClaims: {
        brand: { current: 186500, prior: 172300, variance: 14200, change: 8.2 },
        generic: { current: 94200, prior: 89100, variance: 5100, change: 5.7 },
        specialty: { current: 156800, prior: 142600, variance: 14200, change: 10.0 }
      },
      stopLoss: {
        specific: { current: 45000, prior: 38000, variance: 7000, change: 18.4 },
        aggregate: { current: 22000, prior: 20000, variance: 2000, change: 10.0 }
      },
      enrollment: {
        totalMembers: { current: 12450, prior: 11890, variance: 560, change: 4.7 },
        memberMonths: { current: 149400, prior: 142680, variance: 6720, change: 4.7 }
      },
      budget: {
        planned: 1650000,
        actual: 1842000,
        variance: 192000,
        variancePercent: 11.6
      }
    }
  }

  // Generate chart data for trends
  static generateTrendData(): ChartDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month, index) => ({
      month,
      claims: 750 + Math.floor(Math.random() * 300),
      amount: 200000 + Math.floor(Math.random() * 80000),
      budget: 220000 + (index * 5000),
      actual: 215000 + Math.floor(Math.random() * 40000)
    }))
  }

  // Generate cost breakdown data
  static generateCostBreakdown(): Array<{ name: string; value: number; percentage: number }> {
    const data = this.generateHealthcareData()
    const total = this.calculateTotalCosts(data)
    
    const medicalTotal = Object.values(data.medicalClaims).reduce((sum, item) => sum + item.current, 0)
    const pharmacyTotal = Object.values(data.pharmacyClaims).reduce((sum, item) => sum + item.current, 0)
    const stopLossTotal = Object.values(data.stopLoss).reduce((sum, item) => sum + item.current, 0)

    return [
      { name: 'Medical Claims', value: medicalTotal, percentage: (medicalTotal / total) * 100 },
      { name: 'Pharmacy Claims', value: pharmacyTotal, percentage: (pharmacyTotal / total) * 100 },
      { name: 'Stop Loss', value: stopLossTotal, percentage: (stopLossTotal / total) * 100 }
    ]
  }

  // Generate top cost drivers
  static generateTopDrivers(): TopDriver[] {
    const drivers = [
      { id: 'member-001', name: 'Member A-4821', amount: 38500, visits: 9 },
      { id: 'member-002', name: 'Member B-3492', amount: 32450, visits: 7 },
      { id: 'member-003', name: 'Member C-2847', amount: 28740, visits: 5 },
      { id: 'member-004', name: 'Member D-1956', amount: 25890, visits: 8 },
      { id: 'member-005', name: 'Member E-1423', amount: 23450, visits: 6 }
    ]

    const totalAmount = drivers.reduce((sum, driver) => sum + driver.amount, 0)
    
    return drivers.map(driver => ({
      ...driver,
      percentage: (driver.amount / totalAmount) * 100
    }))
  }

  // Calculate totals
  static calculateTotalCosts(data: HealthcareReportData, fixedCosts: FixedCost[] = []): number {
    const medicalTotal = Object.values(data.medicalClaims).reduce((sum, item) => sum + item.current, 0)
    const pharmacyTotal = Object.values(data.pharmacyClaims).reduce((sum, item) => sum + item.current, 0)
    const stopLossTotal = Object.values(data.stopLoss).reduce((sum, item) => sum + item.current, 0)
    const fixedCostsTotal = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0)
    
    return medicalTotal + pharmacyTotal + stopLossTotal + fixedCostsTotal
  }

  // Calculate PEPM metrics
  static calculatePEPM(data: HealthcareReportData, fixedCosts: FixedCost[] = []) {
    const totalCosts = this.calculateTotalCosts(data, fixedCosts)
    const memberMonths = data.enrollment.memberMonths.current
    
    const medicalTotal = Object.values(data.medicalClaims).reduce((sum, item) => sum + item.current, 0)
    const pharmacyTotal = Object.values(data.pharmacyClaims).reduce((sum, item) => sum + item.current, 0)
    
    return {
      total: totalCosts / memberMonths,
      medical: medicalTotal / memberMonths,
      pharmacy: pharmacyTotal / memberMonths,
      administrative: fixedCosts.reduce((sum, cost) => sum + cost.amount, 0) / memberMonths
    }
  }

  // Default fixed costs templates
  static getDefaultFixedCosts(template: 'small' | 'medium' | 'large' = 'medium'): FixedCost[] {
    const templates = {
      small: [
        { id: '1', name: 'Office Rent', amount: 8500, category: 'Facilities' },
        { id: '2', name: 'IT Infrastructure', amount: 5200, category: 'Technology' },
        { id: '3', name: 'Insurance', amount: 3800, category: 'Risk Management' }
      ],
      medium: [
        { id: '1', name: 'Office Rent', amount: 12500, category: 'Facilities' },
        { id: '2', name: 'IT Infrastructure', amount: 8200, category: 'Technology' },
        { id: '3', name: 'Insurance', amount: 6400, category: 'Risk Management' },
        { id: '4', name: 'Professional Services', amount: 4800, category: 'Consulting' },
        { id: '5', name: 'Staff Training', amount: 2200, category: 'Human Resources' }
      ],
      large: [
        { id: '1', name: 'Office Rent', amount: 18900, category: 'Facilities' },
        { id: '2', name: 'IT Infrastructure', amount: 15600, category: 'Technology' },
        { id: '3', name: 'Insurance', amount: 9800, category: 'Risk Management' },
        { id: '4', name: 'Professional Services', amount: 8200, category: 'Consulting' },
        { id: '5', name: 'Staff Training', amount: 4500, category: 'Human Resources' },
        { id: '6', name: 'Compliance & Audit', amount: 6200, category: 'Regulatory' },
        { id: '7', name: 'Marketing', amount: 3800, category: 'Business Development' }
      ]
    }
    
    return templates[template]
  }

  // Export configuration
  static exportConfiguration(fixedCosts: FixedCost[]) {
    const config = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      fixedCosts,
      metadata: {
        totalCategories: fixedCosts.length,
        totalAmount: fixedCosts.reduce((sum, cost) => sum + cost.amount, 0)
      }
    }
    
    return JSON.stringify(config, null, 2)
  }

  // Import configuration
  static importConfiguration(configJson: string): FixedCost[] {
    try {
      const config = JSON.parse(configJson)
      return config.fixedCosts || []
    } catch (error) {
      console.error('Failed to import configuration:', error)
      return []
    }
  }

  // Format currency
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Format percentage change
  static formatChange(change: number): string {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // Format large numbers
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}k`
    }
    return num.toString()
  }
}