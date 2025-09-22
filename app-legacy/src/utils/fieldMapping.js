const FIELD_ALIASES = {
  claimantId: ['claimantnumber', 'claimantid', 'memberid', 'employeeid', 'subscriberid'],
  claimDate: ['claimdate', 'servicedate', 'dateofservice', 'date'],
  serviceType: ['servicetype', 'category', 'claimcategory', 'type'],
  medicalAmount: ['medical', 'medicalamount', 'medicalpaid', 'paidmedical'],
  pharmacyAmount: ['rx', 'pharmacy', 'rxamount', 'pharmacypaid'],
  totalAmount: ['total', 'totalpaid', 'amountpaid', 'claimtotal'],
  icdCode: ['icdcode', 'diagnosiscode', 'icd10', 'dxcode'],
  medicalDesc: ['medicaldesc', 'description', 'medicaldescription', 'lineitem'],
  laymanTerm: ['laymanterm', 'simplifieddescription', 'memberfriendlyterm'],
  provider: ['provider', 'facility', 'providername'],
  location: ['location', 'state', 'region'],
};

export const REQUIRED_FIELDS = ['claimantId', 'claimDate', 'serviceType', 'medicalAmount', 'pharmacyAmount'];

export const OPTIONAL_FIELDS = ['totalAmount', 'icdCode', 'medicalDesc', 'laymanTerm', 'provider', 'location'];

const normalizeHeading = (value) =>
  value ? value.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

export const autoMapColumns = (columns = []) => {
  const mapping = {};
  const normalized = columns.map((c) => ({
    original: c,
    normalized: normalizeHeading(c),
  }));

  Object.entries(FIELD_ALIASES).forEach(([key, aliases]) => {
    const hit = normalized.find((column) => aliases.includes(column.normalized));
    if (hit) {
      mapping[key] = hit.original;
    }
  });

  return mapping;
};

export const ensureDefaultMapping = (columns = [], currentMapping = {}) => {
  const base = { ...autoMapColumns(columns), ...currentMapping };

  REQUIRED_FIELDS.forEach((field) => {
    if (!base[field]) {
      const directMatch = columns.find((col) => normalizeHeading(col).includes(field));
      if (directMatch) {
        base[field] = directMatch;
      }
    }
  });

  if (!base.totalAmount) {
    const totalLike = columns.find((col) => normalizeHeading(col).includes('total'));
    if (totalLike) {
      base.totalAmount = totalLike;
    }
  }

  return base;
};

export const validateMapping = (mapping = {}) => {
  const missing = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  return {
    isValid: missing.length === 0,
    missing,
  };
};

export const DISPLAY_NAMES = {
  claimantId: 'Claimant ID',
  claimDate: 'Claim Date',
  serviceType: 'Service Type',
  medicalAmount: 'Medical Amount',
  pharmacyAmount: 'Pharmacy Amount',
  totalAmount: 'Total Amount',
  icdCode: 'ICD Code',
  medicalDesc: 'Medical Description',
  laymanTerm: 'Plain Language Description',
  provider: 'Provider',
  location: 'Location',
};

export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
