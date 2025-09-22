import { useCallback, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  ALL_FIELDS,
  DISPLAY_NAMES,
  REQUIRED_FIELDS,
  ensureDefaultMapping,
  validateMapping,
} from '../../utils/fieldMapping';
import { computeDataQuality, extractColumns } from '../../utils/dataProcessing';
import { formatCurrency, formatNumber } from '../../utils/format';
import { StatCard } from '../common/StatCard';
import { Alert } from '../common/Alert';

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 16V4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 3.5v9" strokeLinecap="round" />
    <path d="M6.5 9.5L10 13l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15.5h12" strokeLinecap="round" />
  </svg>
);

const formatQualityMessage = (quality) => {
  const messages = [];
  const missingFields = Object.entries(quality.missingRequired || {})
    .filter(([, count]) => count > 0)
    .map(([field, count]) => `${DISPLAY_NAMES[field]} (${count} missing)`);
  if (missingFields.length) {
    messages.push(`Data has missing values for: ${missingFields.join(', ')}`);
  }
  if (quality.invalidDates) {
    messages.push(`${quality.invalidDates} rows have invalid dates`);
  }
  return messages.join(' • ');
};

export const DataUpload = ({
  rawRows,
  onRawRowsChange,
  mapping,
  onMappingChange,
  normalizedClaims,
  onContinue,
  loadSampleData,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const columns = useMemo(() => extractColumns(rawRows), [rawRows]);
  const appliedMapping = useMemo(() => ensureDefaultMapping(columns, mapping), [columns, mapping]);
  const mappingValidation = useMemo(() => validateMapping(appliedMapping), [appliedMapping]);
  const quality = useMemo(() => computeDataQuality(rawRows, appliedMapping), [rawRows, appliedMapping]);

  const totals = useMemo(() => {
    if (!normalizedClaims.length) {
      return {
        totalClaims: 0,
        medical: 0,
        pharmacy: 0,
        stopLossCandidates: 0,
      };
    }
    return normalizedClaims.reduce(
      (
        acc,
        claim,
      ) => ({
        totalClaims: acc.totalClaims + claim.totalAmount,
        medical: acc.medical + claim.medicalAmount,
        pharmacy: acc.pharmacy + claim.pharmacyAmount,
        stopLossCandidates: acc.stopLossCandidates + (claim.totalAmount >= 100000 ? 1 : 0),
      }),
      { totalClaims: 0, medical: 0, pharmacy: 0, stopLossCandidates: 0 },
    );
  }, [normalizedClaims]);

  const handleFile = useCallback(
    (file) => {
      setError('');
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors?.length) {
            setError(results.errors[0].message || 'Unable to parse CSV');
          }
          const rows = results.data.filter((row) => Object.values(row).some((value) => value !== null && value !== undefined && value !== ''));
          onRawRowsChange(rows);
          if (rows.length) {
            const inferredMapping = ensureDefaultMapping(extractColumns(rows), mapping);
            onMappingChange(inferredMapping);
          }
        },
        error: (err) => setError(err.message || 'Unable to read file'),
      });
    },
    [mapping, onMappingChange, onRawRowsChange],
  );

  const onFileInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const updateMapping = (field, value) => {
    onMappingChange({
      ...appliedMapping,
      [field]: value || undefined,
    });
  };

  const previewRows = normalizedClaims.slice(0, 8);
  const hasData = normalizedClaims.length > 0;

  return (
    <div className="tab-content">
      <div className="section-title">
        <h2>Step 1 · Data Input Layer</h2>
        <small>Upload, validate, and normalize healthcare claims data</small>
      </div>

      <div
        className="surface-panel"
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: isDragging ? 'rgba(37, 99, 235, 0.6)' : 'rgba(148, 163, 184, 0.5)',
          background: isDragging ? 'rgba(37, 99, 235, 0.08)' : '#f8fbff',
          cursor: 'pointer',
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="presentation"
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
          <span className="badge neutral" style={{ minWidth: 40, height: 40, borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UploadIcon />
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Drag & drop your HIPAA-compliant CSV</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Required columns: Claim Date, Claimant ID, Service Type, Medical, Pharmacy</p>
          </div>
          <label className="button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <DownloadIcon /> Import CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={onFileInputChange} />
          </label>
          <button type="button" className="button-secondary" onClick={loadSampleData}>
            Use Sample Data
          </button>
        </div>
      </div>

      {error ? <Alert tone="danger" title="Upload Error" message={error} /> : null}

      <div className="card-grid cols-3" style={{ marginTop: 24 }}>
        <StatCard label="Rows Ingested" value={formatNumber(rawRows.length)} trend={quality.invalidDates ? `${quality.invalidDates} invalid date(s)` : ''} />
        <StatCard label="Total Claims" value={formatCurrency(totals.totalClaims)} trend={`Medical ${formatCurrency(totals.medical)} • Rx ${formatCurrency(totals.pharmacy)}`} />
        <StatCard label="Potential Stop Loss" value={formatNumber(totals.stopLossCandidates)} trend="Claims ≥ $100k" />
      </div>

      {!mappingValidation.isValid ? (
        <div style={{ marginTop: 20 }}>
          <Alert
            tone="danger"
            title="Column mapping required"
            message={`Missing mappings: ${mappingValidation.missing.map((item) => DISPLAY_NAMES[item]).join(', ')}`}
          />
        </div>
      ) : null}

      {columns.length ? (
        <div style={{ marginTop: 24 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 20 }}>Column Mapping</h2>
            <small>Confirm intelligent column detection for downstream processing</small>
          </div>
          <div className="card-grid cols-3">
            {ALL_FIELDS.map((field) => {
              const isRequired = REQUIRED_FIELDS.includes(field);
              return (
                <div className="input-group" key={field}>
                  <label>
                    {DISPLAY_NAMES[field]}
                    {isRequired ? <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span> : null}
                  </label>
                  <select
                    className="input-control"
                    value={appliedMapping[field] || ''}
                    onChange={(event) => updateMapping(field, event.target.value)}
                  >
                    <option value="">Not mapped</option>
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          {formatQualityMessage(quality) ? (
            <p style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>{formatQualityMessage(quality)}</p>
          ) : null}
        </div>
      ) : null}

      {hasData ? (
        <div style={{ marginTop: 32 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 20 }}>Data Preview</h2>
            <small>First {previewRows.length} records</small>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Claimant</th>
                  <th>Date</th>
                  <th>Service Type</th>
                  <th>Medical</th>
                  <th>Rx</th>
                  <th>Total</th>
                  <th>ICD Code</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.claimantId}</td>
                    <td>{new Date(claim.claimDate).toLocaleDateString()}</td>
                    <td>{claim.serviceType}</td>
                    <td>{formatCurrency(claim.medicalAmount)}</td>
                    <td>{formatCurrency(claim.pharmacyAmount)}</td>
                    <td>{formatCurrency(claim.totalAmount)}</td>
                    <td>{claim.icdCode || '—'}</td>
                    <td>{claim.laymanTerm || claim.medicalDesc || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="button-primary"
          onClick={onContinue}
          disabled={!mappingValidation.isValid || !hasData}
          style={!mappingValidation.isValid || !hasData ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          Continue to Configuration
        </button>
      </div>
    </div>
  );
};
