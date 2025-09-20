import ReactECharts from 'echarts-for-react';
import { formatCurrency, formatMonthKey } from '../../utils/format';
import { Alert } from '../common/Alert';

const buildMonthlyChart = (metrics) => {
  const categories = metrics.monthSequence.map((item) => item.label);
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Medical', 'Pharmacy', 'Net Paid'] },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Medical',
        type: 'bar',
        data: metrics.monthSequence.map((item) => Number(item.medical.toFixed(2))),
        itemStyle: { color: '#2563eb' },
      },
      {
        name: 'Pharmacy',
        type: 'bar',
        data: metrics.monthSequence.map((item) => Number(item.pharmacy.toFixed(2))),
        itemStyle: { color: '#0ea5e9' },
      },
      {
        name: 'Net Paid',
        type: 'line',
        smooth: true,
        data: metrics.monthSequence.map((item) => Number(item.netPaid.toFixed(2))),
        itemStyle: { color: '#1d4ed8' },
      },
    ],
  };
};

const buildServicePie = (metrics) => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  series: [
    {
      name: 'Service Type',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}\n{d}%' },
      itemStyle: { borderRadius: 12, borderColor: '#fff', borderWidth: 2 },
      data: metrics.serviceDistribution.map((item) => ({
        name: item.serviceType,
        value: Number(item.total.toFixed(2)),
      })),
    },
  ],
});

export const FinancialReporting = ({ metrics, summaryRows, months }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!metrics?.monthSequence?.length) {
    return (
      <div className="tab-content">
        <Alert tone="danger" title="Reporting requires data" message="Upload claims and configure assumptions before generating the report." />
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="section-title">
        <h2>Step 4 · Financial Reporting</h2>
        <small>Board-ready two-page report with financial and visual insights</small>
      </div>

      <div className="print-actions">
        <button type="button" className="button-secondary" onClick={handlePrint}>
          Generate Print-Ready PDF
        </button>
      </div>

      <div className="print-layout">
        <section>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Page 1 · Financial Summary Table</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Line Item</th>
                  {months.map((month) => (
                    <th key={month}>{formatMonthKey(month)}</th>
                  ))}
                  <th>Annual Total</th>
                  <th>Budget</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row) => {
                  const variance = row.budget ? row.annualTotal - row.budget : undefined;
                  return (
                    <tr key={row.key}>
                      <td>
                        <strong>{row.label}</strong>
                        {row.type ? <div style={{ fontSize: 12, color: '#64748b' }}>{row.type}</div> : null}
                      </td>
                      {months.map((month) => (
                        <td key={`${row.key}-${month}`}>{formatCurrency(row.monthsTotals?.[month] || 0)}</td>
                      ))}
                      <td>{formatCurrency(row.annualTotal || 0)}</td>
                      <td>{row.budget ? formatCurrency(row.budget) : '—'}</td>
                      <td style={{ color: variance !== undefined && variance > 0 ? '#b91c1c' : '#15803d' }}>
                        {variance !== undefined ? formatCurrency(variance) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Page 2 · Visual Exhibits</h3>
          <div className="chart-grid">
            <div className="surface-panel">
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>Monthly Claims vs Net Paid</h4>
              <ReactECharts option={buildMonthlyChart(metrics)} style={{ height: 320 }} notMerge lazyUpdate />
            </div>
            <div className="surface-panel">
              <h4 style={{ marginTop: 0, marginBottom: 12 }}>Service Type Distribution</h4>
              <ReactECharts option={buildServicePie(metrics)} style={{ height: 320 }} notMerge lazyUpdate />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
