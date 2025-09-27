'use client'

import { useExperienceData, useHighCostClaimants } from '@/lib/store/useAppStore'
import ExperienceUpload from '@/components/upload/ExperienceUpload'
import HighCostUpload from '@/components/upload/HighCostUpload'
import FocusWrapper from '@/components/focus/FocusWrapper'
import SubStepWrapper, { SubStepGroup } from '@/components/focus/SubStepWrapper'
import StatCard from '@/components/ui/StatCard'
import AnimatedCard from '@/components/ui/AnimatedCard'
import StaggerContainer from '@/components/ui/StaggerContainer'

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
          <div className="space-y-8">
            {/* Data Summary for Experience */}
            {hasExperience && (
              <StaggerContainer className="space-y-4" staggerDelay={150}>
                <AnimatedCard direction="up" delay={200}>
                  <StatCard
                    title="Experience Records"
                    value={experience.length.toString()}
                    subtitle="Data points loaded"
                    icon={(
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    trend="positive"
                  />
                </AnimatedCard>
              </StaggerContainer>
            )}

            <AnimatedCard direction="up" delay={300}>
              <ExperienceUpload />
            </AnimatedCard>
          </div>
        </SubStepWrapper>

        {/* Sub-step 1: High Cost Claimants Upload */}
        <SubStepWrapper
          subStep={1}
          title="High Cost Claimants Upload"
          description="Upload your high cost claimant data for advanced analysis"
        >
          <div className="space-y-8">
            {/* Data Summary for High Cost */}
            {hasHighCost && (
              <StaggerContainer className="space-y-4" staggerDelay={150}>
                <AnimatedCard direction="up" delay={200}>
                  <StatCard
                    title="High-Cost Claimants"
                    value={highCostClaimants.length.toString()}
                    subtitle="Members tracked"
                    icon={(
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    )}
                    trend={highCostClaimants.filter(c => c.hitStopLoss === 'Y').length > 0 ? 'negative' : 'neutral'}
                  />
                </AnimatedCard>
              </StaggerContainer>
            )}

            <AnimatedCard direction="up" delay={300}>
              <HighCostUpload />
            </AnimatedCard>
          </div>
        </SubStepWrapper>
      </SubStepGroup>
    </FocusWrapper>
  )
}