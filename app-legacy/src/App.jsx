import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { DataUpload } from './components/steps/DataUpload';
import { Configuration } from './components/steps/Configuration';
import { DataReview } from './components/steps/DataReview';
import { FinancialReporting } from './components/steps/FinancialReporting';
import { sampleClaims } from './data/sampleClaims';
import { defaultConfig } from './data/defaultConfig';
import { normalizeClaims, extractColumns } from './utils/dataProcessing';
import { ensureDefaultMapping } from './utils/fieldMapping';
import {
  aggregateMetrics,
  applyConfiguration,
  deriveMonthKeys,
  evaluateLineItems,
  buildFinancialSummaryRows,
} from './utils/finance';

const steps = [
  { key: 'upload', label: 'Step 1 · Data Intake', icon: '📥' },
  { key: 'configuration', label: 'Step 2 · Configuration', icon: '⚙️' },
  { key: 'review', label: 'Step 3 · Data Review', icon: '🔍' },
  { key: 'reporting', label: 'Step 4 · Reporting', icon: '📊' },
];

function App() {
  const [activeStep, setActiveStep] = useState('upload');
  const [rawRows, setRawRows] = useState(sampleClaims);
  const [mapping, setMapping] = useState({});
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    if (!rawRows.length) return;
    setMapping((current) => ensureDefaultMapping(extractColumns(rawRows), current));
  }, [rawRows]);

  const normalizedClaims = useMemo(() => normalizeClaims(rawRows, mapping), [rawRows, mapping]);

  const processedClaims = useMemo(
    () => applyConfiguration(normalizedClaims, config),
    [normalizedClaims, config],
  );

  const metrics = useMemo(() => aggregateMetrics(processedClaims), [processedClaims]);

  const months = useMemo(() => {
    const derived = deriveMonthKeys(processedClaims);
    if (derived.length) return derived;
    return ['2024-01'];
  }, [processedClaims]);

  const lineItemsSummary = useMemo(
    () => evaluateLineItems(processedClaims, config, months),
    [processedClaims, config, months],
  );

  const summaryRows = useMemo(
    () => buildFinancialSummaryRows(metrics, config, lineItemsSummary, months),
    [metrics, config, lineItemsSummary, months],
  );

  const serviceTypes = useMemo(
    () => metrics.serviceDistribution.map((item) => item.serviceType),
    [metrics],
  );

  const canAccessConfiguration = normalizedClaims.length > 0;
  const canAccessReview = processedClaims.length > 0;
  const canAccessReporting = processedClaims.length > 0;

  const loadSampleData = () => {
    setRawRows(sampleClaims);
    setConfig(defaultConfig);
  };

  const renderStep = () => {
    switch (activeStep) {
      case 'upload':
        return (
          <DataUpload
            rawRows={rawRows}
            onRawRowsChange={setRawRows}
            mapping={mapping}
            onMappingChange={setMapping}
            normalizedClaims={normalizedClaims}
            onContinue={() => setActiveStep('configuration')}
            loadSampleData={loadSampleData}
          />
        );
      case 'configuration':
        return (
          <Configuration
            config={config}
            onConfigChange={setConfig}
            metrics={metrics}
            serviceTypes={serviceTypes}
            onContinue={() => setActiveStep('review')}
          />
        );
      case 'review':
        return (
          <DataReview
            processedClaims={processedClaims}
            metrics={metrics}
            serviceTypes={serviceTypes}
            onContinue={() => setActiveStep('reporting')}
          />
        );
      case 'reporting':
        return <FinancialReporting metrics={metrics} summaryRows={summaryRows} months={months} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Healthcare Analytics Dashboard</h1>
        <p>End-to-end documentation-aligned workflow for data ingestion, configuration, validation, and reporting.</p>
      </header>

      <nav className="tab-bar">
        {steps.map((step) => {
          const isDisabled =
            (step.key === 'configuration' && !canAccessConfiguration) ||
            (step.key === 'review' && !canAccessReview) ||
            (step.key === 'reporting' && !canAccessReporting);
          return (
            <button
              key={step.key}
              type="button"
              className={`tab-button ${activeStep === step.key ? 'active' : ''}`}
              onClick={() => {
                if (!isDisabled) setActiveStep(step.key);
              }}
              disabled={isDisabled}
              style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              <span className="icon" role="img" aria-hidden="true">
                {step.icon}
              </span>
              {step.label}
            </button>
          );
        })}
      </nav>

      {renderStep()}
    </div>
  );
}

export default App;
