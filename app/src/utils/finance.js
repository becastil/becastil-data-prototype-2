import dayjs from 'dayjs';
import { formatMonthKey } from './format';

const monthSorter = (a, b) => {
  const dateA = dayjs(`${a}-01`);
  const dateB = dayjs(`${b}-01`);
  if (dateA.isSame(dateB)) return 0;
  return dateA.isBefore(dateB) ? -1 : 1;
};

export const deriveMonthKeys = (claims = []) => {
  const set = new Set();
  claims.forEach((claim) => {
    if (claim.monthKey) {
      set.add(claim.monthKey);
    }
  });
  return Array.from(set).sort(monthSorter);
};

export const applyConfiguration = (claims = [], config) => {
  if (!claims.length) return [];
  const {
    stopLossThreshold = 100000,
    stopLossReimbursementRate = 0.9,
  } = config || {};

  return claims.map((claim) => {
    const excess = Math.max(0, claim.totalAmount - stopLossThreshold);
    const reimbursement = excess * stopLossReimbursementRate;
    const netPaid = claim.totalAmount - reimbursement;

    return {
      ...claim,
      stopLossTriggered: excess > 0,
      stopLossExcess: excess,
      stopLossReimbursement: reimbursement,
      netPaid,
    };
  });
};

export const aggregateMetrics = (processedClaims = []) => {
  const accumulator = {
    totalClaims: 0,
    totalMedical: 0,
    totalPharmacy: 0,
    stopLossExcess: 0,
    stopLossReimbursement: 0,
    netPaid: 0,
    stopLossCount: 0,
    claimants: new Set(),
    monthMap: new Map(),
    serviceMap: new Map(),
  };

  processedClaims.forEach((claim) => {
    accumulator.totalClaims += claim.totalAmount;
    accumulator.totalMedical += claim.medicalAmount;
    accumulator.totalPharmacy += claim.pharmacyAmount;
    accumulator.stopLossExcess += claim.stopLossExcess;
    accumulator.stopLossReimbursement += claim.stopLossReimbursement;
    accumulator.netPaid += claim.netPaid;
    if (claim.stopLossTriggered) accumulator.stopLossCount += 1;
    accumulator.claimants.add(claim.claimantId);

    if (!accumulator.monthMap.has(claim.monthKey)) {
      accumulator.monthMap.set(claim.monthKey, {
        medical: 0,
        pharmacy: 0,
        total: 0,
        stopLoss: 0,
        reimbursement: 0,
        netPaid: 0,
      });
    }
    const monthBucket = accumulator.monthMap.get(claim.monthKey);
    monthBucket.medical += claim.medicalAmount;
    monthBucket.pharmacy += claim.pharmacyAmount;
    monthBucket.total += claim.totalAmount;
    monthBucket.stopLoss += claim.stopLossExcess;
    monthBucket.reimbursement += claim.stopLossReimbursement;
    monthBucket.netPaid += claim.netPaid;

    const serviceKey = claim.serviceType || 'Unknown';
    if (!accumulator.serviceMap.has(serviceKey)) {
      accumulator.serviceMap.set(serviceKey, {
        medical: 0,
        pharmacy: 0,
        total: 0,
      });
    }
    const serviceBucket = accumulator.serviceMap.get(serviceKey);
    serviceBucket.medical += claim.medicalAmount;
    serviceBucket.pharmacy += claim.pharmacyAmount;
    serviceBucket.total += claim.totalAmount;
  });

  const monthSequence = Array.from(accumulator.monthMap.entries())
    .map(([monthKey, values]) => ({
      monthKey,
      label: formatMonthKey(monthKey),
      ...values,
    }))
    .sort((a, b) => monthSorter(a.monthKey, b.monthKey));

  const serviceDistribution = Array.from(accumulator.serviceMap.entries())
    .map(([serviceType, values]) => ({
      serviceType,
      ...values,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    ...accumulator,
    uniqueClaimants: accumulator.claimants.size,
    monthSequence,
    serviceDistribution,
  };
};

export const evaluateLineItems = (processedClaims = [], config = {}, months = []) => {
  const {
    memberCount = 1000,
    lineItems = [],
  } = config;

  const monthCount = months.length || 12;

  const baseDataByMonth = months.reduce((acc, month) => {
    acc[month] = {
      medicalAmount: 0,
      pharmacyAmount: 0,
      totalAmount: 0,
      stopLossExcess: 0,
      stopLossReimbursement: 0,
      netPaid: 0,
    };
    return acc;
  }, {});

  processedClaims.forEach((claim) => {
    if (!baseDataByMonth[claim.monthKey]) {
      baseDataByMonth[claim.monthKey] = {
        medicalAmount: 0,
        pharmacyAmount: 0,
        totalAmount: 0,
        stopLossExcess: 0,
        stopLossReimbursement: 0,
        netPaid: 0,
      };
    }
    const bucket = baseDataByMonth[claim.monthKey];
    bucket.medicalAmount += claim.medicalAmount;
    bucket.pharmacyAmount += claim.pharmacyAmount;
    bucket.totalAmount += claim.totalAmount;
    bucket.stopLossExcess += claim.stopLossExcess;
    bucket.stopLossReimbursement += claim.stopLossReimbursement;
    bucket.netPaid += claim.netPaid;
  });

  const results = lineItems.map((item) => {
    const monthsTotals = {};
    if (item.source === 'claims') {
      const dataKey = item.field || 'totalAmount';
      const filteredClaims = item.serviceType
        ? processedClaims.filter((claim) => claim.serviceType === item.serviceType)
        : processedClaims;

      months.forEach((month) => {
        const monthlyTotal = filteredClaims
          .filter((claim) => claim.monthKey === month)
          .reduce((sum, claim) => sum + (claim[dataKey] || 0), 0);
        monthsTotals[month] = monthlyTotal;
      });
    } else {
      const basis = item.basis || 'monthly';
      let monthlyAmount = Number(item.amount) || 0;
      if (basis === 'annual') {
        monthlyAmount = monthlyAmount / monthCount;
      }
      if (basis === 'pepm') {
        monthlyAmount = monthlyAmount * memberCount;
      }
      months.forEach((month) => {
        monthsTotals[month] = monthlyAmount;
      });
    }

    const annualTotal = Object.values(monthsTotals).reduce((sum, value) => sum + value, 0);

    return {
      ...item,
      monthsTotals,
      annualTotal,
    };
  });

  return results;
};

export const getHighCostClaims = (processedClaims = [], limit = 5) =>
  processedClaims
    .slice()
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);

export const filterClaims = (processedClaims = [], filters = {}) => {
  const {
    serviceType,
    minAmount,
    maxAmount,
    stopLossOnly = false,
    searchTerm,
  } = filters;

  return processedClaims.filter((claim) => {
    if (serviceType && claim.serviceType !== serviceType) return false;
    if (stopLossOnly && !claim.stopLossTriggered) return false;
    if (minAmount !== undefined && claim.totalAmount < minAmount) return false;
    if (maxAmount !== undefined && claim.totalAmount > maxAmount) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const haystack = [
        claim.claimantId,
        claim.icdCode,
        claim.medicalDesc,
        claim.laymanTerm,
        claim.provider,
      ]
        .filter(Boolean)
        .map((value) => value.toString().toLowerCase());
      if (!haystack.some((value) => value.includes(term))) {
        return false;
      }
    }
    return true;
  });
};

export const buildFinancialSummaryRows = (metrics, config, lineItemsSummary, months) => {
  const { medicalBudget = 0, rxBudget = 0, adminFeeMonthly = 0, rxRebatesMonthly = 0 } = config;
  const monthCount = months.length || 12;

  const monthlyAdminFees = adminFeeMonthly;
  const monthlyRxRebates = rxRebatesMonthly;

  const annualAdminFees = monthlyAdminFees * monthCount;
  const annualRxRebates = monthlyRxRebates * monthCount;

  const lines = [
    {
      key: 'medicalClaims',
      label: 'Total Medical Claims',
      monthsTotals: Object.fromEntries(metrics.monthSequence.map((month) => [month.monthKey, month.medical])),
      annualTotal: metrics.totalMedical,
      budget: medicalBudget,
    },
    {
      key: 'pharmacyClaims',
      label: 'Total Pharmacy Claims',
      monthsTotals: Object.fromEntries(metrics.monthSequence.map((month) => [month.monthKey, month.pharmacy])),
      annualTotal: metrics.totalPharmacy,
      budget: rxBudget,
    },
    {
      key: 'stopLoss',
      label: 'Stop Loss Reimbursements',
      monthsTotals: Object.fromEntries(metrics.monthSequence.map((month) => [month.monthKey, month.reimbursement])),
      annualTotal: metrics.stopLossReimbursement,
    },
    {
      key: 'netPaid',
      label: 'Net Paid Claims',
      monthsTotals: Object.fromEntries(metrics.monthSequence.map((month) => [month.monthKey, month.netPaid])),
      annualTotal: metrics.netPaid,
    },
    {
      key: 'adminFees',
      label: 'Administrative Fees',
      monthsTotals: Object.fromEntries(months.map((month) => [month, monthlyAdminFees])),
      annualTotal: annualAdminFees,
    },
    {
      key: 'rxRebates',
      label: 'Rx Rebates',
      monthsTotals: Object.fromEntries(months.map((month) => [month, monthlyRxRebates * -1])),
      annualTotal: -annualRxRebates,
    },
  ];

  lineItemsSummary.forEach((item) => {
    lines.push({
      key: item.id,
      label: item.label,
      monthsTotals: item.monthsTotals,
      annualTotal: item.annualTotal,
      type: item.type,
    });
  });

  return lines;
};
