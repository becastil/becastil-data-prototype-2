import { useMemo, useState } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/format';
import { StatCard } from '../common/StatCard';

const LINE_ITEM_TYPES = [
  { value: 'budget', label: 'Budget Allocation' },
  { value: 'fixedCost', label: 'Fixed Cost' },
  { value: 'rebate', label: 'Rebate / Offset' },
  { value: 'stopLoss', label: 'Stop Loss' },
  { value: 'other', label: 'Other' },
];

const LINE_ITEM_SOURCES = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'claims', label: 'Derive from Claims' },
];

const CLAIM_FIELDS = [
  { value: 'totalAmount', label: 'Total Claims Paid' },
  { value: 'medicalAmount', label: 'Medical Claims' },
  { value: 'pharmacyAmount', label: 'Pharmacy Claims' },
  { value: 'stopLossExcess', label: 'Stop Loss Excess' },
  { value: 'stopLossReimbursement', label: 'Stop Loss Reimbursements' },
  { value: 'netPaid', label: 'Net Paid Claims' },
];

const BASIS_OPTIONS = [
  { value: 'monthly', label: 'Monthly Amount' },
  { value: 'annual', label: 'Annual Amount' },
  { value: 'pepm', label: 'PEPM (Per Employee Per Month)' },
];

const shortId = () => Math.random().toString(36).slice(2, 8);

export const Configuration = ({
  config,
  onConfigChange,
  metrics,
  serviceTypes,
  onContinue,
}) => {
  const [draftItem, setDraftItem] = useState({
    label: '',
    type: 'budget',
    source: 'manual',
    basis: 'monthly',
    amount: '',
    field: 'totalAmount',
    serviceType: '',
  });

  const updateConfig = (field, value) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const removeLineItem = (id) => {
    onConfigChange({
      ...config,
      lineItems: config.lineItems.filter((item) => item.id !== id),
    });
  };

  const addLineItem = () => {
    if (!draftItem.label.trim()) return;
    const newItem = {
      id: `li-${shortId()}`,
      ...draftItem,
      amount: draftItem.source === 'manual' ? Number(draftItem.amount || 0) : undefined,
      serviceType: draftItem.serviceType || undefined,
    };
    onConfigChange({
      ...config,
      lineItems: [...config.lineItems, newItem],
    });
    setDraftItem({
      label: '',
      type: 'budget',
      source: 'manual',
      basis: 'monthly',
      amount: '',
      field: 'totalAmount',
      serviceType: '',
    });
  };

  const stopLossRatio = useMemo(() => {
    if (!metrics.totalClaims) return 0;
    return metrics.stopLossReimbursement / metrics.totalClaims;
  }, [metrics]);

  return (
    <div className="tab-content">
      <div className="section-title">
        <h2>Step 2 · Configuration Layer</h2>
        <small>Blend CSV data with financial drivers and stop loss modelling</small>
      </div>

      <div className="card-grid cols-3" style={{ marginBottom: 24 }}>
        <StatCard
          label="Plan Year Claims"
          value={formatCurrency(metrics.totalClaims)}
          trend={`${metrics.uniqueClaimants} members • ${formatNumber(metrics.stopLossCount)} stop loss triggers`}
        />
        <StatCard
          label="Stop Loss Recovery"
          value={formatCurrency(metrics.stopLossReimbursement)}
          trend={`Recovers ${formatPercent(stopLossRatio)} of total claims`}
        />
        <StatCard
          label="Monthly Coverage"
          value={`${metrics.monthSequence.length} months`}
          trend={`${formatCurrency(metrics.totalMedical)} medical • ${formatCurrency(metrics.totalPharmacy)} Rx`}
        />
      </div>

      <div className="card-grid cols-2" style={{ marginBottom: 32 }}>
        <div className="surface-panel">
          <div className="section-title" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>Plan Settings</h2>
            <small>Baseline assumptions and budgets</small>
          </div>
          <div className="card-grid cols-2" style={{ gap: 20 }}>
            <div className="input-group">
              <label>Plan Year</label>
              <input
                className="input-control"
                type="number"
                value={config.planYear}
                onChange={(event) => updateConfig('planYear', Number(event.target.value))}
              />
            </div>
            <div className="input-group">
              <label>Covered Members</label>
              <input
                className="input-control"
                type="number"
                value={config.memberCount}
                onChange={(event) => updateConfig('memberCount', Number(event.target.value))}
              />
            </div>
            <div className="input-group">
              <label>Medical Budget (Annual)</label>
              <input
                className="input-control"
                type="number"
                value={config.medicalBudget}
                onChange={(event) => updateConfig('medicalBudget', Number(event.target.value))}
              />
            </div>
            <div className="input-group">
              <label>Pharmacy Budget (Annual)</label>
              <input
                className="input-control"
                type="number"
                value={config.rxBudget}
                onChange={(event) => updateConfig('rxBudget', Number(event.target.value))}
              />
            </div>
            <div className="input-group">
              <label>Administrative Fees (Monthly)</label>
              <input
                className="input-control"
                type="number"
                value={config.adminFeeMonthly}
                onChange={(event) => updateConfig('adminFeeMonthly', Number(event.target.value))}
              />
            </div>
            <div className="input-group">
              <label>Pharmacy Rebates (Monthly)</label>
              <input
                className="input-control"
                type="number"
                value={config.rxRebatesMonthly}
                onChange={(event) => updateConfig('rxRebatesMonthly', Number(event.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="surface-panel">
          <div className="section-title" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18 }}>Stop Loss Strategy</h2>
            <small>Thresholds, reimbursement, and financial policy</small>
          </div>
          <div className="card-grid cols-2" style={{ gap: 20 }}>
            <div className="input-group">
              <label>Stop Loss Threshold</label>
              <input
                className="input-control"
                type="number"
                value={config.stopLossThreshold}
                onChange={(event) => updateConfig('stopLossThreshold', Number(event.target.value))}
              />
            </div>
            <div className="input-group">
              <label>Carrier Reimbursement Rate</label>
              <input
                className="input-control"
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={config.stopLossReimbursementRate}
                onChange={(event) => updateConfig('stopLossReimbursementRate', Number(event.target.value))}
              />
            </div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Notes & Assumptions</label>
              <textarea
                className="input-control"
                rows={3}
                value={config.notes || ''}
                onChange={(event) => updateConfig('notes', event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="surface-panel" style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18 }}>Dynamic Line Items</h2>
          <small>Create budget, cost, rebate, and stop loss components</small>
        </div>
        <div className="card-grid cols-3" style={{ gap: 16, marginBottom: 16 }}>
          <div className="input-group">
            <label>Label</label>
            <input
              className="input-control"
              value={draftItem.label}
              onChange={(event) => setDraftItem({ ...draftItem, label: event.target.value })}
              placeholder="e.g., Wellness Incentive"
            />
          </div>
          <div className="input-group">
            <label>Line Item Type</label>
            <select
              className="input-control"
              value={draftItem.type}
              onChange={(event) => setDraftItem({ ...draftItem, type: event.target.value })}
            >
              {LINE_ITEM_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label>Source</label>
            <select
              className="input-control"
              value={draftItem.source}
              onChange={(event) => setDraftItem({ ...draftItem, source: event.target.value })}
            >
              {LINE_ITEM_SOURCES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {draftItem.source === 'manual' ? (
            <>
              <div className="input-group">
                <label>Basis</label>
                <select
                  className="input-control"
                  value={draftItem.basis}
                  onChange={(event) => setDraftItem({ ...draftItem, basis: event.target.value })}
                >
                  {BASIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Amount</label>
                <input
                  type="number"
                  className="input-control"
                  value={draftItem.amount}
                  onChange={(event) => setDraftItem({ ...draftItem, amount: event.target.value })}
                />
              </div>
            </>
          ) : (
            <>
              <div className="input-group">
                <label>Claim Field</label>
                <select
                  className="input-control"
                  value={draftItem.field}
                  onChange={(event) => setDraftItem({ ...draftItem, field: event.target.value })}
                >
                  {CLAIM_FIELDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Filter by Service Type</label>
                <select
                  className="input-control"
                  value={draftItem.serviceType}
                  onChange={(event) => setDraftItem({ ...draftItem, serviceType: event.target.value })}
                >
                  <option value="">All services</option>
                  {serviceTypes.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="button-secondary" onClick={addLineItem}>
            Add Line Item
          </button>
        </div>
      </div>

      {config.lineItems.length ? (
        <div className="table-container" style={{ marginBottom: 32 }}>
          <table>
            <thead>
              <tr>
                <th>Label</th>
                <th>Type</th>
                <th>Source</th>
                <th>Basis</th>
                <th>Claim Field</th>
                <th>Service Filter</th>
                <th>Amount / Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {config.lineItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  <td>{LINE_ITEM_TYPES.find((option) => option.value === item.type)?.label || item.type}</td>
                  <td>{LINE_ITEM_SOURCES.find((option) => option.value === item.source)?.label || item.source}</td>
                  <td>{item.source === 'manual' ? BASIS_OPTIONS.find((option) => option.value === item.basis)?.label : 'Derived'}</td>
                  <td>{item.source === 'claims' ? CLAIM_FIELDS.find((option) => option.value === item.field)?.label : 'Manual'}</td>
                  <td>{item.serviceType || 'All services'}</td>
                  <td>{item.source === 'manual' ? formatCurrency(Number(item.amount || 0)) : 'Dynamic from claims'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="button-secondary" onClick={() => removeLineItem(item.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="button-primary" onClick={onContinue}>
          Proceed to Data Review
        </button>
      </div>
    </div>
  );
};
