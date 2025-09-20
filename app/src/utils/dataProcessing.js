import dayjs from 'dayjs';
import { ensureDefaultMapping, REQUIRED_FIELDS } from './fieldMapping';

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const extractColumns = (rows = []) => {
  if (!rows.length) return [];
  const columnSet = new Set();
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (key !== null && key !== undefined && key !== '') {
        columnSet.add(key);
      }
    });
  });
  return Array.from(columnSet);
};

export const normalizeClaims = (rows = [], mapping = {}) => {
  if (!rows.length) return [];
  const mapped = ensureDefaultMapping(extractColumns(rows), mapping);

  return rows
    .map((row, index) => {
      const claimDateRaw = row[mapped.claimDate];
      const claimDate = claimDateRaw ? dayjs(claimDateRaw) : null;
      if (!claimDate || !claimDate.isValid()) return null;

      const medicalAmount = toNumber(row[mapped.medicalAmount]);
      const pharmacyAmount = toNumber(row[mapped.pharmacyAmount]);
      const totalAmount = mapped.totalAmount
        ? toNumber(row[mapped.totalAmount])
        : medicalAmount + pharmacyAmount;

      return {
        id: `${row[mapped.claimantId] || 'claim'}-${index}`,
        claimantId: row[mapped.claimantId] || `Claim-${index + 1}`,
        claimDate: claimDate.toISOString(),
        monthKey: claimDate.format('YYYY-MM'),
        serviceType: (row[mapped.serviceType] || 'Unknown').toString(),
        medicalAmount,
        pharmacyAmount,
        totalAmount,
        icdCode: mapped.icdCode ? row[mapped.icdCode] : undefined,
        medicalDesc: mapped.medicalDesc ? row[mapped.medicalDesc] : undefined,
        laymanTerm: mapped.laymanTerm ? row[mapped.laymanTerm] : undefined,
        provider: mapped.provider ? row[mapped.provider] : undefined,
        location: mapped.location ? row[mapped.location] : undefined,
        originalRow: row,
      };
    })
    .filter(Boolean);
};

export const computeDataQuality = (rows = [], mapping = {}) => {
  const mapped = ensureDefaultMapping(extractColumns(rows), mapping);
  const stats = {
    rowCount: rows.length,
    missingRequired: {},
    invalidDates: 0,
  };

  REQUIRED_FIELDS.forEach((field) => {
    const column = mapped[field];
    if (!column) {
      stats.missingRequired[field] = rows.length;
      return;
    }
    const missingCount = rows.reduce(
      (acc, row) => (row[column] === undefined || row[column] === null || row[column] === '' ? acc + 1 : acc),
      0,
    );
    if (missingCount) {
      stats.missingRequired[field] = missingCount;
    }
  });

  rows.forEach((row) => {
    const claimDateRaw = row[mapped.claimDate];
    const claimDate = claimDateRaw ? dayjs(claimDateRaw) : null;
    if (!claimDate || !claimDate.isValid()) {
      stats.invalidDates += 1;
    }
  });

  return stats;
};

export const getDistinctValues = (claims = [], accessor) => {
  const values = new Set();
  claims.forEach((claim) => {
    const value = typeof accessor === 'function' ? accessor(claim) : claim[accessor];
    if (value !== undefined && value !== null && value !== '') {
      values.add(value);
    }
  });
  return Array.from(values);
};
