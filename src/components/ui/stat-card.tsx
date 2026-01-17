'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  valueColor?: string
}

/**
 * Reusable stat card component for displaying metrics
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  valueColor = '',
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-3 md:pt-6 md:p-6">
        <p className="text-xs md:text-sm text-muted-foreground truncate mb-2">
          {title}
        </p>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Desktop icon */}
          <div className={`hidden md:flex h-10 w-10 items-center justify-center rounded-full ${iconBgColor}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {/* Mobile icon */}
          <div className={`flex md:hidden h-8 w-8 items-center justify-center rounded-full ${iconBgColor} shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xl md:text-3xl font-bold ${valueColor}`}>
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
