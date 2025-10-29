'use client'

import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { ResponsiveText } from '@/components/ui/responsive-container'
import { ResponsiveButton } from '@/components/ui/responsive-button'
import { ResponsiveCard, ResponsiveCardContent } from '@/components/ui/responsive-card'

export default function ResponsiveTest() {
  return (
    <ResponsiveContainer className="py-8">
      <ResponsiveCard>
        <ResponsiveCardContent>
          <ResponsiveText size="2xl" weight="bold" className="mb-4">
            Responsive Test Component
          </ResponsiveText>
          <ResponsiveText size="base" color="muted" className="mb-6">
            This component tests the responsive design system
          </ResponsiveText>
          <ResponsiveButton size="lg" variant="default">
            Test Button
          </ResponsiveButton>
        </ResponsiveCardContent>
      </ResponsiveCard>
    </ResponsiveContainer>
  )
}
