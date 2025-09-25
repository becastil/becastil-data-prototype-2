import { ExperienceRow } from '../schemas/experience'

const CATEGORY_ALIASES = {
  DOMESTIC_HOSPITAL: ['Domestic Hospital Claims', 'Domestic Medical Facility Claims (IP/OP)'],
  NON_DOMESTIC_HOSPITAL: ['Non Domestic Hospital Claims', 'Non-Domestic Medical Claims (IP/OP)'],
  TOTAL_HOSPITAL: ['Total Hospital Medical Claims'],
  NON_HOSPITAL: ['Non-Hospital Medical Claims'],
  UC_ADJUSTMENT: ['UC Claims Settlement Adjustment'],
  RUNOUT: ['Run Out Claims'],
  EBA_PAID: ['Medical Claims Paid via EBA'],
  HMNH_HIGH_COST: ['High Cost Claims paid via HMNH'],
  RX_GROSS: ['ESI Pharmacy Claims', 'Pharmacy Claims'],
  RX_REBATES: ['Rx Rebates', 'Pharmacy Rebates'],
  STOP_LOSS_FEES: ['Total Stop Loss Fees'],
  STOP_LOSS_REIMB: ['Stop Loss Reimbursement'],
  CONSULTING: ['Consulting'],
  TPA_ADMIN: ['TPA Claims/COBRA Administration Fee (PEPM)', 'TPA Administration Fee'],
  ANTHEM_JAA: ['Anthem JAA'],
  KPPC_FEES: ['KPPC Fees'],
  KPCM_FEES: ['KPCM Fees'],
  ESI_PROGRAMS: ['Optional ESI Programs'],
  EE_COUNT: ['EE COUNT (Active & COBRA)', 'Employee Count'],
  MEMBER_COUNT: ['MEMBER COUNT', 'Member Count'],
  INCURRED_TARGET_PEPM: ['INCURRED TARGET PEPM'],
  BUDGET_PEPM: ['2025–2026 PEPM BUDGET (with 0% Margin)', 'Budget PEPM'],
} as const

const CATEGORY_LABELS = {
  DOMESTIC_HOSPITAL: 'Domestic Hospital Claims',
  NON_DOMESTIC_HOSPITAL: 'Non Domestic Hospital Claims',
  TOTAL_HOSPITAL: 'Total Hospital Medical Claims',
  NON_HOSPITAL: 'Non-Hospital Medical Claims',
  UC_ADJUSTMENT: 'UC Claims Settlement Adjustment',
  RUNOUT: 'Run Out Claims',
  EBA_PAID: 'Medical Claims Paid via EBA',
  HMNH_HIGH_COST: 'High Cost Claims paid via HMNH',
  RX_GROSS: 'Rx Claims',
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

    const domesticHospital = getByAliases(values, CATEGORY_ALIASES.DOMESTIC_HOSPITAL) ?? 0
    let nonDomesticHospital = getByAliases(values, CATEGORY_ALIASES.NON_DOMESTIC_HOSPITAL)
    const totalHospitalInput = getByAliases(values, CATEGORY_ALIASES.TOTAL_HOSPITAL)

    if (nonDomesticHospital === undefined && totalHospitalInput !== undefined) {
      nonDomesticHospital = totalHospitalInput - domesticHospital
      values[CATEGORY_LABELS.NON_DOMESTIC_HOSPITAL] = nonDomesticHospital
    }

    const totalHospital =
      totalHospitalInput !== undefined
        ? totalHospitalInput
        : domesticHospital + (nonDomesticHospital ?? 0)
    values[DERIVED.TOTAL_HOSPITAL] = totalHospital

    const nonHospitalClaims = getByAliases(values, CATEGORY_ALIASES.NON_HOSPITAL) ?? 0
    const totalAllMedical = totalHospital + nonHospitalClaims
    values[DERIVED.TOTAL_ALL_MEDICAL] = totalAllMedical

    const ucAdjustment = getByAliases(values, CATEGORY_ALIASES.UC_ADJUSTMENT) ?? 0
    const totalAdjustedMedical = totalAllMedical + ucAdjustment
    values[DERIVED.TOTAL_ADJUSTED_MEDICAL] = totalAdjustedMedical

    let totalMedical = totalAdjustedMedical
    const runout = getByAliases(values, CATEGORY_ALIASES.RUNOUT)
    if (typeof runout === 'number') {
      totalMedical += runout
    }
    const ebaPaid = getByAliases(values, CATEGORY_ALIASES.EBA_PAID)
    if (typeof ebaPaid === 'number') {
      totalMedical += ebaPaid
    }
    values[DERIVED.TOTAL_MEDICAL] = totalMedical

    const totalRx = sumAliases(values, CATEGORY_ALIASES.RX_GROSS)
    values[DERIVED.TOTAL_RX] = totalRx

    const totalAdmin = sumAliasGroups(values, [
      CATEGORY_ALIASES.CONSULTING,
      CATEGORY_ALIASES.TPA_ADMIN,
      CATEGORY_ALIASES.ANTHEM_JAA,
      CATEGORY_ALIASES.KPPC_FEES,
      CATEGORY_ALIASES.KPCM_FEES,
      CATEGORY_ALIASES.ESI_PROGRAMS,
      CATEGORY_ALIASES.STOP_LOSS_FEES,
    ])
    values[DERIVED.TOTAL_ADMIN] = totalAdmin

    const rxRebates = getByAliases(values, CATEGORY_ALIASES.RX_REBATES) ?? 0
    const stopLossReimb = getByAliases(values, CATEGORY_ALIASES.STOP_LOSS_REIMB) ?? 0

    const monthlyTotal = totalMedical + totalRx + totalAdmin + rxRebates + stopLossReimb
    values[DERIVED.MONTHLY_TOTAL] = monthlyTotal

    const eeCount = getByAliases(values, CATEGORY_ALIASES.EE_COUNT) ?? 0
    const memberCount = getByAliases(values, CATEGORY_ALIASES.MEMBER_COUNT) ?? 0
    const budgetPepm = getByAliases(values, CATEGORY_ALIASES.BUDGET_PEPM) ?? 0

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

export { CATEGORY_LABELS as FINANCIAL_CATEGORY_LABELS, DERIVED as FINANCIAL_DERIVED_LABELS }

function getByAliases(map: Record<string, number>, aliases: readonly string[]): number | undefined {
  for (const alias of aliases) {
    if (alias in map) {
      return map[alias]
    }
  }
  return undefined
}

function sumAliases(map: Record<string, number>, aliases: readonly string[]): number {
  return aliases.reduce((sum, alias) => sum + (map[alias] ?? 0), 0)
}

function sumAliasGroups(map: Record<string, number>, aliasGroups: readonly (readonly string[])[]): number {
  return aliasGroups.reduce((sum, aliases) => sum + (getByAliases(map, aliases) ?? 0), 0)
}
