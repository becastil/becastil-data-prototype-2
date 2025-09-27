'use client'

import { useStepCompletion, useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import FinancialSummaryTable from '@/components/table/FinancialSummaryTable'
import DataTable, { Column } from '@/components/ui/DataTable'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper from '@/components/focus/SubStepWrapper'
import { Card, Space, Row, Col, Statistic, Typography, Table } from 'antd'
import { ExclamationTriangleOutlined, DatabaseOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

export default function TablePage() {
  const stepCompletion = useStepCompletion()
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()
  
  if (!stepCompletion.table) {
    return (
      <FocusWrapper>
        <div className="flex justify-center items-center min-h-[400px]">
          <Card style={{ maxWidth: 400, textAlign: 'center' }}>
            <Space direction="vertical" size="large">
              <ExclamationTriangleOutlined style={{ fontSize: 48, color: '#faad14' }} />
              <div>
                <Title level={3}>Previous Steps Required</Title>
                <Text type="secondary">
                  Please complete the data upload and fees form before viewing the summary table.
                </Text>
              </div>
            </Space>
          </Card>
        </div>
      </FocusWrapper>
    )
  }

  // High-cost claimants table columns for Ant Design Table
  const antdColumns = [
    {
      title: 'Member ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 120,
    },
    {
      title: 'Total Claims',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      render: (value: number) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value)
    },
    {
      title: 'Plan %',
      dataIndex: 'percentPlanPaid',
      key: 'percentPlanPaid',
      width: 100,
      render: (value: number) => `${value}%`
    },
    {
      title: 'Stop Loss',
      dataIndex: 'hitStopLoss',
      key: 'hitStopLoss',
      width: 100,
      render: (value: string) => value === 'Y' ? 'Yes' : 'No'
    },
    {
      title: 'Enrolled',
      dataIndex: 'enrolledAtTimeOfClaim',
      key: 'enrolledAtTimeOfClaim',
      width: 100,
      render: (value: string) => value === 'Y' ? 'Yes' : 'No'
    }
  ]

  return (
    <FocusWrapper>
      <SubStepWrapper
        subStep={0}
        title="Financial Summary Table"
        description="Comprehensive view of your healthcare financial data"
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Financial Summary */}
          <Card 
            title={
              <Title level={4} style={{ margin: 0 }}>Financial Summary</Title>
            }
            size="large"
          >
            <FinancialSummaryTable />
          </Card>

          {/* High-Cost Claimants Table */}
          {highCostClaimants.length > 0 && (
            <Card 
              title={
                <div>
                  <Title level={4} style={{ margin: 0 }}>High-Cost Claimants</Title>
                  <Text type="secondary">
                    {highCostClaimants.length} members
                  </Text>
                </div>
              }
              size="large"
            >
              <Table 
                dataSource={highCostClaimants}
                columns={antdColumns}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                scroll={{ y: 400 }}
                rowKey="memberId"
                size="small"
              />
            </Card>
          )}

          {/* Data Summary Cards */}
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Experience Records"
                  value={experience.length}
                  prefix={<DatabaseOutlined />}
                  suffix="data points"
                />
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Time Period"
                  value={new Set(experience.map(e => e.month)).size}
                  prefix={<CalendarOutlined />}
                  suffix="months"
                />
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Stop Loss Hits"
                  value={highCostClaimants.filter(c => c.hitStopLoss === 'Y').length}
                  prefix={<UserOutlined />}
                  suffix="members"
                  valueStyle={{ color: highCostClaimants.filter(c => c.hitStopLoss === 'Y').length > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </SubStepWrapper>
    </FocusWrapper>
  )
}