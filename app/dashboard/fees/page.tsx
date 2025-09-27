'use client'

import dynamic from 'next/dynamic'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper, { SubStepGroup } from '@/components/focus/SubStepWrapper'
import { Card, Space, Alert, Typography, Tooltip } from 'antd'
import { InfoCircleOutlined, ExclamationTriangleOutlined } from '@ant-design/icons'
import { useStepCompletion } from '@/lib/store/useAppStore'

const DynamicFeeForm = dynamic(() => import('@/components/fees/DynamicFeeForm'), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-dashed border-black/20 bg-white/60 p-6 text-center text-sm text-black/60">Loading fee configuration…</div>,
})

const BudgetForm = dynamic(() => import('@/components/fees/BudgetForm'), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-dashed border-black/20 bg-white/60 p-6 text-center text-sm text-black/60">Loading budget form…</div>,
})

const MonthlyAdjustmentsForm = dynamic(() => import('@/components/fees/MonthlyAdjustmentsForm'), {
  ssr: false,
  loading: () => <div className="rounded-lg border border-dashed border-black/20 bg-white/60 p-6 text-center text-sm text-black/60">Loading adjustments interface…</div>,
})

const { Title, Text } = Typography

export default function FeesPage() {
  const stepCompletion = useStepCompletion()

  if (!stepCompletion.upload) {
    return (
      <FocusWrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <Card style={{ maxWidth: 400, textAlign: 'center' }}>
            <Space direction="vertical" size="large">
              <ExclamationTriangleOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <div>
                <Title level={3}>Upload Required</Title>
                <Text type="secondary">
                  Please upload your experience data first before configuring monthly fees.
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      </FocusWrapper>
    )
  }

  return (
    <FocusWrapper>
      <SubStepGroup>
        {/* Sub-step 0: Fee Schedule */}
        <SubStepWrapper
          subStep={0}
          title="Fee Schedule Configuration"
          description="Define your monthly fee structure and rates"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <div>
                    <Title level={4} style={{ margin: 0 }}>Monthly Fee Definitions</Title>
                    <Text type="secondary">Configure fee rates, basis, and calculation methods</Text>
                  </div>
                  <Tooltip 
                    title={
                      <div>
                        <div><strong>Rate Basis Guidance:</strong></div>
                        <ul style={{ paddingLeft: 16 }}>
                          <li>Flat monthly: enter the invoice amount as-is</li>
                          <li>PEPM / PMPM: enter the rate; multiplied by counts</li>
                          <li>Annual: enter total; allocated evenly</li>
                          <li>Custom: enter monthly overrides directly</li>
                        </ul>
                        <div style={{ marginTop: 8 }}><strong>Best Practices:</strong></div>
                        <ul style={{ paddingLeft: 16 }}>
                          <li>Enter credits as negative values</li>
                          <li>Track PEPM fees with rate and invoice</li>
                          <li>Use custom overrides for deviations</li>
                        </ul>
                      </div>
                    }
                    placement="left"
                  >
                    <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                </div>
              }
              size="large"
            >
              <DynamicFeeForm />
            </Card>
          </Space>
        </SubStepWrapper>

        {/* Sub-step 1: Budget Schedule */}
        <SubStepWrapper
          subStep={1}
          title="Budget Schedule Setup"
          description="Set budget amounts and per-member rates for planning"
        >
          <Card 
            title={
              <div>
                <Title level={4} style={{ margin: 0 }}>Budget Configuration</Title>
                <Text type="secondary">
                  Define your budget targets and PEPM rates for comparison with actual expenses
                </Text>
              </div>
            }
            size="large"
          >
            <BudgetForm />
          </Card>
        </SubStepWrapper>

        {/* Sub-step 2: Monthly Adjustments */}
        <SubStepWrapper
          subStep={2}
          title="Monthly Adjustments"
          description="Apply one-time adjustments and overrides for specific months"
        >
          <Card 
            title={
              <div>
                <Title level={4} style={{ margin: 0 }}>One-Time Adjustments</Title>
                <Text type="secondary">
                  Add credits, rebates, or one-off adjustments that don't follow the regular fee schedule
                </Text>
              </div>
            }
            size="large"
          >
            <MonthlyAdjustmentsForm />
          </Card>
        </SubStepWrapper>
      </SubStepGroup>
    </FocusWrapper>
  )
}
