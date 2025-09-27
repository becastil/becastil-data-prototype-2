'use client'

import { useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import ExperienceUpload from '@/components/upload/ExperienceUpload'
import HighCostUpload from '@/components/upload/HighCostUpload'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper, { SubStepGroup } from '@/components/focus/SubStepWrapper'
import { Row, Col, Card, Statistic, Space } from 'antd'
import { DatabaseOutlined, UserOutlined } from '@ant-design/icons'

export default function UploadPage() {
  const experience = useExperienceData()
  const highCostClaimants = useHighCostClaimants()

  const hasExperience = experience.length > 0
  const hasHighCost = highCostClaimants.length > 0

  return (
    <FocusWrapper>
      <SubStepGroup>
        {/* Sub-step 0: Experience Data Upload */}
        <SubStepWrapper
          subStep={0}
          title="Experience Data Upload"
          description="Upload your healthcare experience data to begin the analysis"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Data Summary for Experience */}
            {hasExperience && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic
                      title="Experience Records"
                      value={experience.length}
                      prefix={<DatabaseOutlined />}
                      suffix="records"
                    />
                  </Card>
                </Col>
              </Row>
            )}

            <Card title="Experience Data Upload" size="large">
              <ExperienceUpload />
            </Card>
          </Space>
        </SubStepWrapper>

        {/* Sub-step 1: High Cost Claimants Upload */}
        <SubStepWrapper
          subStep={1}
          title="High Cost Claimants Upload"
          description="Upload your high cost claimant data for advanced analysis"
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Data Summary for High Cost */}
            {hasHighCost && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic
                      title="High-Cost Claimants"
                      value={highCostClaimants.length}
                      prefix={<UserOutlined />}
                      suffix="members"
                      valueStyle={{ 
                        color: highCostClaimants.filter(c => c.hitStopLoss === 'Y').length > 0 ? '#cf1322' : '#3f8600' 
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card>
                    <Statistic
                      title="Stop Loss Hits"
                      value={highCostClaimants.filter(c => c.hitStopLoss === 'Y').length}
                      suffix="members"
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            <Card title="High Cost Claimants Upload" size="large">
              <HighCostUpload />
            </Card>
          </Space>
        </SubStepWrapper>
      </SubStepGroup>
    </FocusWrapper>
  )
}