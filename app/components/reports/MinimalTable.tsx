'use client'

import { useState } from 'react'

interface FixedCost {
  id: string
  name: string
  amount: number
}

interface MinimalTableProps {
  className?: string
}

export default function MinimalTable({ className = '' }: MinimalTableProps) {
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([
    { id: '1', name: 'Office Rent', amount: 12500 },
    { id: '2', name: 'IT Infrastructure', amount: 8200 }
  ])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCostName, setNewCostName] = useState('')
  const [newCostAmount, setNewCostAmount] = useState('')

  // Healthcare cost data
  const healthcareData = {
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
    }
  }

  // Calculate totals
  const medicalTotal = Object.values(healthcareData.medicalClaims).reduce((sum, item) => sum + item.current, 0)
  const pharmacyTotal = Object.values(healthcareData.pharmacyClaims).reduce((sum, item) => sum + item.current, 0)
  const stopLossTotal = Object.values(healthcareData.stopLoss).reduce((sum, item) => sum + item.current, 0)
  const fixedCostsTotal = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0)
  const grandTotal = medicalTotal + pharmacyTotal + stopLossTotal + fixedCostsTotal

  // Calculate PEPM
  const totalPEPM = grandTotal / healthcareData.enrollment.memberMonths.current

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const addFixedCost = () => {
    if (newCostName && newCostAmount) {
      const newCost: FixedCost = {
        id: Date.now().toString(),
        name: newCostName,
        amount: parseFloat(newCostAmount)
      }
      setFixedCosts([...fixedCosts, newCost])
      setNewCostName('')
      setNewCostAmount('')
      setShowAddForm(false)
    }
  }

  const removeFixedCost = (id: string) => {
    setFixedCosts(fixedCosts.filter(cost => cost.id !== id))
  }

  return (
    <div className={`space-y-12 ${className}`}>
      {/* Medical Claims */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-6">Medical Claims</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Inpatient</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.medicalClaims.inpatient.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.medicalClaims.inpatient.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.medicalClaims.inpatient.change)}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Outpatient</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.medicalClaims.outpatient.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.medicalClaims.outpatient.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.medicalClaims.outpatient.change)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Emergency</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.medicalClaims.emergency.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.medicalClaims.emergency.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.medicalClaims.emergency.change)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Specialty</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.medicalClaims.specialty.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.medicalClaims.specialty.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.medicalClaims.specialty.change)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Preventive</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.medicalClaims.preventive.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.medicalClaims.preventive.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.medicalClaims.preventive.change)}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(medicalTotal)}</span>
          </div>
        </div>
      </div>

      {/* Pharmacy Claims */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-6">Pharmacy Claims</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Brand Drugs</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.pharmacyClaims.brand.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.pharmacyClaims.brand.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.pharmacyClaims.brand.change)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Generic Drugs</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.pharmacyClaims.generic.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.pharmacyClaims.generic.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.pharmacyClaims.generic.change)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Specialty Drugs</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.pharmacyClaims.specialty.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.pharmacyClaims.specialty.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.pharmacyClaims.specialty.change)}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(pharmacyTotal)}</span>
          </div>
        </div>
      </div>

      {/* Stop Loss */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-6">Stop Loss</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Specific</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.stopLoss.specific.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.stopLoss.specific.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.stopLoss.specific.change)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors">
            <span className="text-gray-900">Aggregate</span>
            <div className="flex items-center gap-6">
              <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                {formatCurrency(healthcareData.stopLoss.aggregate.current)}
              </span>
              <span className={`text-sm min-w-[50px] text-right ${
                healthcareData.stopLoss.aggregate.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatChange(healthcareData.stopLoss.aggregate.change)}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(stopLossTotal)}</span>
          </div>
        </div>
      </div>

      {/* Administrative Costs */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 mb-6">Administrative Costs</h2>
        <div className="space-y-3">
          {fixedCosts.map((cost) => (
            <div key={cost.id} className="flex justify-between items-center py-2 hover:bg-gray-50 transition-colors group">
              <span className="text-gray-900">{cost.name}</span>
              <div className="flex items-center gap-4">
                <span className="tabular-nums text-gray-900 min-w-[100px] text-right">
                  {formatCurrency(cost.amount)}
                </span>
                <button
                  onClick={() => removeFixedCost(cost.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm transition-opacity"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          
          {showAddForm ? (
            <div className="flex gap-3 py-2">
              <input
                type="text"
                value={newCostName}
                onChange={(e) => setNewCostName(e.target.value)}
                placeholder="Cost category name"
                className="flex-1 px-3 py-1 text-sm border border-gray-200 rounded"
              />
              <input
                type="number"
                value={newCostAmount}
                onChange={(e) => setNewCostAmount(e.target.value)}
                placeholder="Amount"
                className="w-24 px-3 py-1 text-sm border border-gray-200 rounded"
              />
              <button
                onClick={addFixedCost}
                className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm text-gray-600 hover:text-gray-900 py-2 transition-colors"
            >
              + Add category
            </button>
          )}
        </div>
        <div className="border-t border-gray-100 mt-4 pt-3">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(fixedCostsTotal)}</span>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center text-xl font-light mb-8">
          <span>Total Costs</span>
          <span className="tabular-nums">{formatCurrency(grandTotal)}</span>
        </div>

        {/* Enrollment & PEPM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">Enrollment</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Members</span>
                <span className="tabular-nums">{healthcareData.enrollment.totalMembers.current.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Member Months</span>
                <span className="tabular-nums">{healthcareData.enrollment.memberMonths.current.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-4">PEPM Metrics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total PEPM</span>
                <span className="tabular-nums">{formatCurrency(totalPEPM)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Medical PEPM</span>
                <span className="tabular-nums">{formatCurrency(medicalTotal / healthcareData.enrollment.memberMonths.current)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pharmacy PEPM</span>
                <span className="tabular-nums">{formatCurrency(pharmacyTotal / healthcareData.enrollment.memberMonths.current)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}