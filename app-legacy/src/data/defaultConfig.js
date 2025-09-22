export const defaultConfig = {
  planYear: 2024,
  memberCount: 1250,
  medicalBudget: 1200000,
  rxBudget: 450000,
  adminFeeMonthly: 87500,
  rxRebatesMonthly: 5000,
  stopLossThreshold: 100000,
  stopLossReimbursementRate: 0.9,
  notes: '',
  lineItems: [
    {
      id: 'adminStopLossPremium',
      label: 'Stop Loss Premium',
      type: 'fixedCost',
      source: 'manual',
      basis: 'monthly',
      amount: 12500,
    },
    {
      id: 'wellnessProgram',
      label: 'Wellness Program Investment',
      type: 'budget',
      source: 'manual',
      basis: 'pepm',
      amount: 12,
    },
  ],
};
