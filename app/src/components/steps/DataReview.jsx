import { useMemo, useState } from 'react';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { StatCard } from '../common/StatCard';
import { filterClaims, getHighCostClaims } from '../../utils/finance';

const exportToCsv = (rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [headers.join(',')]
    .concat(
      rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      ),
    )
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'claims-review.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const DataReview = ({ processedClaims, metrics, serviceTypes, onContinue }) => {
  const [serviceFilter, setServiceFilter] = useState('');
  const [stopLossOnly, setStopLossOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClaims = useMemo(
    () =>
      filterClaims(processedClaims, {
        serviceType: serviceFilter || undefined,
        stopLossOnly,
        searchTerm: searchTerm.trim() || undefined,
      }).sort((a, b) => new Date(b.claimDate).getTime() - new Date(a.claimDate).getTime()),
    [processedClaims, serviceFilter, stopLossOnly, searchTerm],
  );

  const highCostClaims = useMemo(() => getHighCostClaims(processedClaims, 5), [processedClaims]);

  return (
    <div className="tab-content">
      <div className="section-title">
        <h2>Step 3 · Data Review Layer</h2>
        <small>Validate processed claims, stop loss impact, and patterns</small>
      </div>

      <div className="card-grid cols-3" style={{ marginBottom: 24 }}>
        <StatCard
          label="Net Paid Claims"
          value={formatCurrency(metrics.netPaid)}
          trend={`${formatCurrency(metrics.totalClaims)} gross • ${formatCurrency(metrics.stopLossReimbursement)} reimbursed`}
        />
        <StatCard
          label="Stop Loss Triggers"
          value={formatNumber(metrics.stopLossCount)}
          trend={`${formatCurrency(metrics.stopLossExcess)} excess exposure`}
        />
        <StatCard
          label="Members Impacted"
          value={formatNumber(metrics.uniqueClaimants)}
          trend={`${serviceTypes.length} service categories`}
        />
      </div>

      <div className="surface-panel" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>
          <h2 style={{ fontSize: 18 }}>Review Controls</h2>
          <small>Filter and search to validate calculations</small>
        </div>
        <div className="toolbar">
          <div className="input-group" style={{ flex: '1 1 240px' }}>
            <label>Search members, ICD codes, descriptions</label>
            <input
              className="input-control"
              placeholder="Type to search..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="input-group" style={{ width: 220 }}>
            <label>Service Type</label>
            <select className="input-control" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
              <option value="">All services</option>
              {serviceTypes.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ width: 160 }}>
            <label>Stop Loss</label>
            <select
              className="input-control"
              value={stopLossOnly ? 'stopLoss' : 'all'}
              onChange={(event) => setStopLossOnly(event.target.value === 'stopLoss')}
            >
              <option value="all">All claims</option>
              <option value="stopLoss">Stop loss only</option>
            </select>
          </div>
          <div className="spacer" />
          <button type="button" className="button-secondary" onClick={() => exportToCsv(filteredClaims)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-container" style={{ marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Claimant</th>
              <th>Date</th>
              <th>Service Type</th>
              <th>Total Paid</th>
              <th>Medical</th>
              <th>Pharmacy</th>
              <th>Stop Loss Excess</th>
              <th>Reimbursement</th>
              <th>Net Paid</th>
              <th>ICD Code</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.map((claim) => (
              <tr key={`${claim.id}-${claim.claimDate}`}>
                <td>{claim.claimantId}</td>
                <td>{formatDate(claim.claimDate)}</td>
                <td>{claim.serviceType}</td>
                <td>{formatCurrency(claim.totalAmount)}</td>
                <td>{formatCurrency(claim.medicalAmount)}</td>
                <td>{formatCurrency(claim.pharmacyAmount)}</td>
                <td>{formatCurrency(claim.stopLossExcess)}</td>
                <td>{formatCurrency(claim.stopLossReimbursement)}</td>
                <td>{formatCurrency(claim.netPaid)}</td>
                <td>{claim.icdCode || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-grid cols-2" style={{ marginBottom: 32 }}>
        <div className="surface-panel">
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>High-Cost Claims (Top 5)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Claimant</th>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Total Paid</th>
                  <th>Excess</th>
                  <th>Reimbursement</th>
                </tr>
              </thead>
              <tbody>
                {highCostClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.claimantId}</td>
                    <td>{formatDate(claim.claimDate)}</td>
                    <td>{claim.serviceType}</td>
                    <td>{formatCurrency(claim.totalAmount)}</td>
                    <td>{formatCurrency(claim.stopLossExcess)}</td>
                    <td>{formatCurrency(claim.stopLossReimbursement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="surface-panel">
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Service Distribution</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {metrics.serviceDistribution.map((service) => (
              <li
                key={service.serviceType}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'white',
                  borderRadius: 12,
                  padding: '12px 16px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <div>
                  <strong>{service.serviceType}</strong>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{formatCurrency(service.medical)} medical • {formatCurrency(service.pharmacy)} pharmacy</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(service.total)}</div>
                  <div style={{ fontSize: 12, color: '#1d4ed8' }}>
                    {metrics.totalClaims ? `${((service.total / metrics.totalClaims) * 100).toFixed(1)}% of total` : '—'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="button-primary" onClick={onContinue}>
          Proceed to Financial Reporting
        </button>
      </div>
    </div>
  );
};
