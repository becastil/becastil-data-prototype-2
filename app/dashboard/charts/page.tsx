'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { useStepCompletion, useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper, { SubStepGroup } from '@/components/focus/SubStepWrapper'
import InfoTooltip from '@/components/ui/InfoTooltip'
import { Card, Space, Button, Tooltip, Typography } from 'antd'
import { ExclamationTriangleOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons'

const { Title, Text } = Typography
import MonthlyActualBudgetCombo from '@/components/charts/advanced/MonthlyActualBudgetCombo'
import LossRatioTrendSection from '@/components/charts/advanced/LossRatioTrendSection'
import PremiumClaimsSection from '@/components/charts/advanced/PremiumClaimsSection'
import CostDriversTable from '@/components/charts/advanced/CostDriversTable'
import MemberDistributionChart from '@/components/charts/advanced/MemberDistributionChart'
import ConditionsAnalysis from '@/components/charts/advanced/ConditionsAnalysis'
import {
  transformMonthlyActualBudgetData,
  transformLossRatioData,
  transformPremiumClaimsData,
  transformCostDriversData,
  transformMemberDistributionData,
  transformConditionsData
} from '@/lib/utils/chartData'

export default function ChartsPage() {
  const router = useRouter()
  const stepCompletion = useStepCompletion()
  const experienceData = useExperienceData()
  const highCostClaimants = useHighCostClaimants()

  // Transform data for each chart section
  const monthlyActualBudgetData = useMemo(() => 
    transformMonthlyActualBudgetData(experienceData), [experienceData])
  
  const lossRatioData = useMemo(() => 
    transformLossRatioData(experienceData), [experienceData])
  
  const premiumClaimsData = useMemo(() => 
    transformPremiumClaimsData(experienceData), [experienceData])
  
  const costDriversData = useMemo(() => 
    transformCostDriversData(experienceData), [experienceData])
  
  const memberDistributionData = useMemo(() => 
    transformMemberDistributionData(highCostClaimants), [highCostClaimants])
  
  const conditionsData = useMemo(() => 
    transformConditionsData(highCostClaimants), [highCostClaimants])

  const chartInsightsSections = [
    {
      content: (
        <ul className="list-disc space-y-1 pl-4">
          <li>Monthly Actual vs Budget shows stacked expense and claims vs budget line.</li>
          <li>Loss Ratio Trends track performance against 80% and 100% benchmarks.</li>
          <li>Cost Drivers table reveals top expense categories and trends.</li>
          <li>Member Distribution analyzes demographics and cost patterns by age.</li>
          <li>Conditions Analysis breaks down healthcare spending by diagnosis.</li>
        </ul>
      ),
    },
  ]

  const handleExportPDF = () => {
    router.push('/dashboard/print')
  }
  
  if (!stepCompletion.charts) {
    return (
      <FocusWrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <Card style={{ maxWidth: 400, textAlign: 'center' }}>
            <Space direction="vertical" size="large">
              <ExclamationTriangleOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <div>
                <Title level={3}>Previous Steps Required</Title>
                <Text type="secondary">
                  Please complete the data upload and fees form before viewing charts and analytics.
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
        {/* Sub-step 0: Monthly Actual vs Budget */}
        <SubStepWrapper
          subStep={0}
          title="Monthly Actual vs Budget"
          description="Comprehensive view of actual expenses and claims versus budget with combo chart visualization"
        >
          <Card 
            title={
              <div className="flex items-center justify-between">
                <div>
                  <Title level={4} style={{ margin: 0 }}>Monthly Actual vs Budget Analysis</Title>
                  <Text type="secondary">
                    Stacked bars show actual expenses and claims vs budgeted amounts
                  </Text>
                </div>
                <Space>
                  <Tooltip 
                    title={
                      <div>
                        <div><strong>Chart insights and tips:</strong></div>
                        <ul style={{ paddingLeft: 16, margin: 0 }}>
                          <li>Monthly Actual vs Budget shows stacked expense and claims vs budget line.</li>
                          <li>Loss Ratio Trends track performance against 80% and 100% benchmarks.</li>
                          <li>Cost Drivers table reveals top expense categories and trends.</li>
                          <li>Member Distribution analyzes demographics and cost patterns by age.</li>
                          <li>Conditions Analysis breaks down healthcare spending by diagnosis.</li>
                        </ul>
                      </div>
                    }
                    placement="left"
                  >
                    <InfoCircleOutlined style={{ color: '#1890ff', cursor: 'help' }} />
                  </Tooltip>
                  <Button
                    type="default"
                    icon={<DownloadOutlined />}
                    onClick={handleExportPDF}
                  >
                    Export PDF Report
                  </Button>
                </Space>
              </div>
            }
            size="large"
          >
            <MonthlyActualBudgetCombo data={monthlyActualBudgetData} />
          </Card>
        </SubStepWrapper>

        {/* Sub-step 1: Loss Ratio Trends */}
        <SubStepWrapper
          subStep={1}
          title="Loss Ratio Trends"
          description="Track loss ratio performance over time with industry benchmarks and rolling averages"
        >
          <Card size="large">
            <LossRatioTrendSection data={lossRatioData} />
          </Card>
        </SubStepWrapper>

        {/* Sub-step 2: Premium vs Claims Analysis */}
        <SubStepWrapper
          subStep={2}
          title="Premium vs Claims Analysis"
          description="Compare premium collections against medical and pharmacy claims with detailed breakdowns"
        >
          <Card size="large">
            <PremiumClaimsSection data={premiumClaimsData} />
          </Card>
        </SubStepWrapper>

        {/* Sub-step 3: Cost Drivers Analysis */}
        <SubStepWrapper
          subStep={3}
          title="Cost Drivers Analysis"
          description="Identify and analyze the top cost categories driving healthcare expenses"
        >
          <Card size="large">
            <CostDriversTable data={costDriversData} />
          </Card>
        </SubStepWrapper>

        {/* Sub-step 4: Member Distribution */}
        <SubStepWrapper
          subStep={4}
          title="Member Distribution"
          description="Analyze member demographics and cost distribution across age groups"
        >
          <Card size="large">
            <MemberDistributionChart data={memberDistributionData} />
          </Card>
        </SubStepWrapper>

        {/* Sub-step 5: Conditions Analysis */}
        <SubStepWrapper
          subStep={5}
          title="Conditions Analysis"
          description="Deep dive into healthcare conditions and their associated costs with subcategory breakdowns"
        >
          <Card size="large">
            <ConditionsAnalysis data={conditionsData} />
          </Card>
        </SubStepWrapper>
      </SubStepGroup>
    </FocusWrapper>
  )
}