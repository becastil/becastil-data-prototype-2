import dayjs from 'dayjs';
import { ensureDefaultMapping, REQUIRED_FIELDS } from './fieldMapping';

export interface RawClaimRow {
  [key: string]: any;
}

export interface NormalizedClaim {
  id: string;
  claimantId: string;
  claimDate: string;
  monthKey: string;
  serviceType: string;
  medicalAmount: number;
  pharmacyAmount: number;
  totalAmount: number;
  icdCode?: string;
  medicalDesc?: string;
  laymanTerm?: string;
  provider?: string;
  location?: string;
  originalRow: RawClaimRow;
}

export interface DataQualityStats {
  rowCount: number;
  missingRequired: Record<string, number>;
  invalidDates: number;
}

const toNumber = (value: any): number => {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const extractColumns = (rows: RawClaimRow[] = []): string[] => {
  if (!rows.length) return [];
  const columnSet = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (key !== null && key !== undefined && key !== '') {
        columnSet.add(key);
      }
    });
  });
  return Array.from(columnSet);
};

export const normalizeClaims = (rows: RawClaimRow[] = [], mapping: Record<string, string> = {}): NormalizedClaim[] => {
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
    .filter((claim): claim is NormalizedClaim => claim !== null);
};

export const computeDataQuality = (rows: RawClaimRow[] = [], mapping: Record<string, string> = {}): DataQualityStats => {
  const mapped = ensureDefaultMapping(extractColumns(rows), mapping);
  const stats: DataQualityStats = {
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

export const getDistinctValues = (claims: NormalizedClaim[] = [], accessor: string | ((claim: NormalizedClaim) => any)): any[] => {
  const values = new Set();
  claims.forEach((claim) => {
    const value = typeof accessor === 'function' ? accessor(claim) : claim[accessor as keyof NormalizedClaim];
    if (value !== undefined && value !== null && value !== '') {
      values.add(value);
    }
  });
  return Array.from(values);
};