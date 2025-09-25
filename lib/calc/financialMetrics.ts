import { ExperienceRow } from '../schemas/experience'

const CATEGORY = {
  DOMESTIC_HOSPITAL: 'Domestic Medical Facility Claims (IP/OP)',
  NON_DOMESTIC_HOSPITAL: 'Non-Domestic Medical Claims (IP/OP)',
  TOTAL_HOSPITAL: 'Total Hospital Medical Claims',
  NON_HOSPITAL: 'Non-Hospital Medical Claims',
  UC_ADJUSTMENT: 'UC Claims Settlement Adjustment',
  RUNOUT: 'Run Out Claims',
  EBA_PAID: 'Medical Claims Paid via EBA',
  HMNH_HIGH_COST: 'High Cost Claims paid via HMNH',
  RX_GROSS_ESI: 'ESI Pharmacy Claims',
  RX_REBATES: 'Rx Rebates',
  STOP_LOSS_FEES: 'Total Stop Loss Fees',
  STOP_LOSS_REIMB: 'Stop Loss Reimbursement',
  CONSULTING: 'Consulting',
  TPA_ADMIN: 'TPA Claims/COBRA Administration Fee (PEPM)',
  ANTHEM_JAA: 'Anthem JAA',
  KPPC_FEES: 'KPPC Fees',
  KPCM_FEES: 'KPCM Fees',
  ESI_PROGRAMS: 'Optional ESI Programs',
  EE_COUNT: 'EE COUNT (Active & COBRA)',
  MEMBER_COUNT: 'MEMBER COUNT',
  INCURRED_TARGET_PEPM: 'INCURRED TARGET PEPM',
  BUDGET_PEPM: '2025–2026 PEPM BUDGET (with 0% Margin)',
} as const

const DERIVED = {
  TOTAL_HOSPITAL: 'Total Hospital Medical Claims',
  TOTAL_ALL_MEDICAL: 'Total All Medical Claims',
  TOTAL_ADJUSTED_MEDICAL: 'Total Adjusted Medical Claims',
  TOTAL_MEDICAL: 'Total Medical Claims',
  TOTAL_RX: 'Total Rx Claims',
  TOTAL_ADMIN: 'Total Admin Fees',
  MONTHLY_TOTAL: 'Monthly Claims and Expenses',
  CUMULATIVE_TOTAL: 'Cumulative Claims and Expenses',
  PEPM_ACTUAL: 'PEPM Non-Lagged Actual',
  PEPM_CUMULATIVE: 'PEPM Non-Lagged Cumulative',
  MONTHLY_BUDGET: 'Monthly Budget',
  CUMULATIVE_BUDGET: 'Cumulative Budget',
  MONTHLY_VARIANCE: 'Actual Monthly Difference',
  MONTHLY_VARIANCE_PCT: '% Difference (Monthly)',
  CUMULATIVE_VARIANCE: 'Cumulative Difference',
  CUMULATIVE_VARIANCE_PCT: '% Difference (Cumulative)',
  CUMULATIVE_EE_MONTHS: 'Cumulative EE-Months',
} as const

type MonthCategoryMap = Record<string, Record<string, number>>

export interface FinancialMetrics {
  month: string
  totalHospitalMedicalClaims: number
  totalAllMedicalClaims: number
  totalAdjustedMedicalClaims: number
  totalMedicalClaims: number
  totalRxClaims: number
  totalAdminFees: number
  monthlyClaimsAndExpenses: number
  cumulativeClaimsAndExpenses: number
  pepmActual: number | null
  pepmCumulative: number | null
  monthlyBudget: number
  cumulativeBudget: number
  monthlyDifference: number
  monthlyDifferencePct: number | null
  cumulativeDifference: number
  cumulativeDifferencePct: number | null
  eeCount: number
  memberCount: number
  rxRebates: number
  stopLossReimbursement: number
}

export function computeFinancialMetrics(rows: ExperienceRow[]): FinancialMetrics[] {
  const monthMap: MonthCategoryMap = {}

  rows.forEach(row => {
    const monthValues = (monthMap[row.month] ??= {})
    monthValues[row.category] = (monthValues[row.category] ?? 0) + row.amount
  })

  const months = Object.keys(monthMap).sort()
  const metrics: FinancialMetrics[] = []

  let cumulativeTotal = 0
  let cumulativeBudget = 0
  let cumulativeEeMonths = 0

  months.forEach(month => {
    const values = monthMap[month]

    const domesticHospital = getOptional(values, CATEGORY.DOMESTIC_HOSPITAL) ?? 0
    let nonDomesticHospital = getOptional(values, CATEGORY.NON_DOMESTIC_HOSPITAL)
    const totalHospitalInput = getOptional(values, CATEGORY.TOTAL_HOSPITAL)

    if (nonDomesticHospital === undefined && totalHospitalInput !== undefined) {
      nonDomesticHospital = totalHospitalInput - domesticHospital
      values[CATEGORY.NON_DOMESTIC_HOSPITAL] = nonDomesticHospital
    }

    const totalHospital =
      totalHospitalInput !== undefined
        ? totalHospitalInput
        : domesticHospital + (nonDomesticHospital ?? 0)
    values[DERIVED.TOTAL_HOSPITAL] = totalHospital

    const nonHospitalClaims = getOptional(values, CATEGORY.NON_HOSPITAL) ?? 0
    const totalAllMedical = totalHospital + nonHospitalClaims
    values[DERIVED.TOTAL_ALL_MEDICAL] = totalAllMedical

    const ucAdjustment = getOptional(values, CATEGORY.UC_ADJUSTMENT) ?? 0
    const totalAdjustedMedical = totalAllMedical + ucAdjustment
    values[DERIVED.TOTAL_ADJUSTED_MEDICAL] = totalAdjustedMedical

    let totalMedical = totalAdjustedMedical
    if (CATEGORY.RUNOUT in values) {
      totalMedical += values[CATEGORY.RUNOUT]
    }
    if (CATEGORY.EBA_PAID in values) {
      totalMedical += values[CATEGORY.EBA_PAID]
    }
    values[DERIVED.TOTAL_MEDICAL] = totalMedical

    const totalRx = Object.entries(values)
      .filter(([key]) => /pharmacy claims/i.test(key) || (/rx/i.test(key) && /claims/i.test(key)))
      .reduce((sum, [, value]) => sum + value, 0)
    values[DERIVED.TOTAL_RX] = totalRx

    const totalAdmin = sumValues(values, [
      CATEGORY.CONSULTING,
      CATEGORY.TPA_ADMIN,
      CATEGORY.ANTHEM_JAA,
      CATEGORY.KPPC_FEES,
      CATEGORY.KPCM_FEES,
      CATEGORY.ESI_PROGRAMS,
      CATEGORY.STOP_LOSS_FEES,
    ])
    values[DERIVED.TOTAL_ADMIN] = totalAdmin

    const rxRebates = getOptional(values, CATEGORY.RX_REBATES) ?? 0
    const stopLossReimb = getOptional(values, CATEGORY.STOP_LOSS_REIMB) ?? 0

    const monthlyTotal = totalMedical + totalRx + totalAdmin + rxRebates + stopLossReimb
    values[DERIVED.MONTHLY_TOTAL] = monthlyTotal

    const eeCount = getOptional(values, CATEGORY.EE_COUNT) ?? 0
    const memberCount = getOptional(values, CATEGORY.MEMBER_COUNT) ?? 0
    const budgetPepm = getOptional(values, CATEGORY.BUDGET_PEPM) ?? 0

    const monthlyBudget = budgetPepm * eeCount
    values[DERIVED.MONTHLY_BUDGET] = monthlyBudget

    const monthlyDifference = monthlyTotal - monthlyBudget
    values[DERIVED.MONTHLY_VARIANCE] = monthlyDifference
    const monthlyDifferencePct = monthlyBudget !== 0 ? monthlyDifference / monthlyBudget : null
    if (monthlyDifferencePct !== null) {
      values[DERIVED.MONTHLY_VARIANCE_PCT] = monthlyDifferencePct
    }

    cumulativeTotal += monthlyTotal
    values[DERIVED.CUMULATIVE_TOTAL] = cumulativeTotal

    cumulativeBudget += monthlyBudget
    values[DERIVED.CUMULATIVE_BUDGET] = cumulativeBudget

    cumulativeEeMonths += eeCount
    values[DERIVED.CUMULATIVE_EE_MONTHS] = cumulativeEeMonths

    const cumulativeDifference = cumulativeTotal - cumulativeBudget
    values[DERIVED.CUMULATIVE_VARIANCE] = cumulativeDifference
    const cumulativeDifferencePct = cumulativeBudget !== 0 ? cumulativeDifference / cumulativeBudget : null
    if (cumulativeDifferencePct !== null) {
      values[DERIVED.CUMULATIVE_VARIANCE_PCT] = cumulativeDifferencePct
    }

    const pepmActual = eeCount > 0 ? monthlyTotal / eeCount : null
    if (pepmActual !== null) {
      values[DERIVED.PEPM_ACTUAL] = pepmActual
    }

    const pepmCumulative = cumulativeEeMonths > 0 ? cumulativeTotal / cumulativeEeMonths : null
    if (pepmCumulative !== null) {
      values[DERIVED.PEPM_CUMULATIVE] = pepmCumulative
    }

    metrics.push({
      month,
      totalHospitalMedicalClaims: totalHospital,
      totalAllMedicalClaims: totalAllMedical,
      totalAdjustedMedicalClaims: totalAdjustedMedical,
      totalMedicalClaims: totalMedical,
      totalRxClaims: totalRx,
      totalAdminFees: totalAdmin,
      monthlyClaimsAndExpenses: monthlyTotal,
      cumulativeClaimsAndExpenses: cumulativeTotal,
      pepmActual,
      pepmCumulative,
      monthlyBudget,
      cumulativeBudget,
      monthlyDifference,
      monthlyDifferencePct,
      cumulativeDifference,
      cumulativeDifferencePct,
      eeCount,
      memberCount,
      rxRebates,
      stopLossReimbursement: stopLossReimb,
    })
  })

  return metrics
}

export { CATEGORY as FINANCIAL_CATEGORY_LABELS, DERIVED as FINANCIAL_DERIVED_LABELS }

function getOptional(map: Record<string, number>, key: string): number | undefined {
  return key in map ? map[key] : undefined
}

function sumValues(map: Record<string, number>, keys: string[]): number {
  return keys.reduce((sum, key) => sum + (map[key] ?? 0), 0)
}
