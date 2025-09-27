export interface FocusStep {
  id: string
  title: string
  path: string
  subStep?: number
  parentStep?: string
  description?: string
}

export const focusSteps: FocusStep[] = [
  // Upload Steps
  {
    id: 'upload-experience',
    title: 'Experience Data',
    path: '/dashboard/upload',
    subStep: 0,
    parentStep: 'upload',
    description: 'Upload your healthcare experience data CSV file'
  },
  {
    id: 'upload-highcost',
    title: 'High Cost Claimants',
    path: '/dashboard/upload',
    subStep: 1,
    parentStep: 'upload',
    description: 'Upload your high cost claimants data CSV file'
  },
  
  // Fees Steps
  {
    id: 'fees-schedule',
    title: 'Fee Schedule',
    path: '/dashboard/fees',
    subStep: 0,
    parentStep: 'fees',
    description: 'Configure monthly fee definitions and rates'
  },
  {
    id: 'fees-budget',
    title: 'Budget Schedule',
    path: '/dashboard/fees',
    subStep: 1,
    parentStep: 'fees',
    description: 'Set up budget amounts and PEPM rates'
  },
  {
    id: 'fees-adjustments',
    title: 'Monthly Adjustments',
    path: '/dashboard/fees',
    subStep: 2,
    parentStep: 'fees',
    description: 'Apply one-time adjustments and overrides'
  },
  
  // Table Step
  {
    id: 'table-summary',
    title: 'Summary Table',
    path: '/dashboard/table',
    subStep: 0,
    parentStep: 'table',
    description: 'Review comprehensive financial summary'
  },
  
  // Charts Steps
  {
    id: 'charts-overview',
    title: 'Overview Charts',
    path: '/dashboard/charts',
    subStep: 0,
    parentStep: 'charts',
    description: 'View main financial charts and metrics'
  },
  {
    id: 'charts-trends',
    title: 'Trend Analysis',
    path: '/dashboard/charts',
    subStep: 1,
    parentStep: 'charts',
    description: 'Analyze trends and patterns over time'
  },
  {
    id: 'charts-breakdown',
    title: 'Cost Breakdown',
    path: '/dashboard/charts',
    subStep: 2,
    parentStep: 'charts',
    description: 'Detailed cost category breakdown'
  },
  {
    id: 'charts-insights',
    title: 'Key Insights',
    path: '/dashboard/charts',
    subStep: 3,
    parentStep: 'charts',
    description: 'Important insights and recommendations'
  }
]

export function getStepByPathAndSubStep(path: string, subStep: number): FocusStep | undefined {
  return focusSteps.find(step => step.path === path && step.subStep === subStep)
}

export function getStepsByPath(path: string): FocusStep[] {
  return focusSteps.filter(step => step.path === path)
}

export function getStepIndex(stepId: string): number {
  return focusSteps.findIndex(step => step.id === stepId)
}

export function getNextStep(currentStepId: string): FocusStep | undefined {
  const currentIndex = getStepIndex(currentStepId)
  if (currentIndex >= 0 && currentIndex < focusSteps.length - 1) {
    return focusSteps[currentIndex + 1]
  }
  return undefined
}

export function getPrevStep(currentStepId: string): FocusStep | undefined {
  const currentIndex = getStepIndex(currentStepId)
  if (currentIndex > 0) {
    return focusSteps[currentIndex - 1]
  }
  return undefined
}