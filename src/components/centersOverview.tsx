// components/admin/centers-overview.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import axios from 'axios'
import {
  Building2,
  Coins,
  Loader2,
  MapPin,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Center {
  id: string
  name: string
  address: string | null
  studentsCount: number
  teachersCount: number
  revenue: number
  managersCount: number
}

export default function CenterOverview() {
  const t = useTranslations('centerOverview')
  const [centers, setCenters] = useState<Center[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCenters()
  }, [])

  const fetchCenters = async () => {
    try {
      const { data } = await axios.get('/api/admin/centers')
      setCenters(data)
    } catch (err) {
      console.error('Failed to fetch centers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalRevenue = centers.reduce((sum, c) => sum + c.revenue, 0)

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : centers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noCenters')}</p>
            <Button asChild className="mt-4">
              <Link href="/admin/center">{t('createFirstCenter')}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {centers.map((center) => (
<Card 
  key={center.id} 
  className="border-2 hover:border-primary/50 transition-all duration-200"
>
  <CardContent className="p-4 sm:p-6">
    {/* Main Container - Stack on mobile, horizontal on larger screens */}
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      
      {/* Left Section - Content */}
      <div className="flex-1 space-y-3 sm:space-y-4">
        
        {/* Header - Name, Badge, Address */}
        <div className="space-y-2">
          {/* Name and Badge - Stack on very small screens */}
          <div className="flex flex-col xs:flex-row xs:items-center xs:flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
              <Link 
                href={`/admin/centers/${center.id}`}
                className="text-base sm:text-lg font-semibold hover:underline truncate"
              >
                {center.name}
              </Link>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              {center.managersCount} {t('managers')}
            </Badge>
          </div>
          
          {/* Address */}
          {center.address && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{center.address}</span>
            </div>
          )}
        </div>

        {/* Stats Grid - Responsive columns */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Students */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span>{t('students')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {center.studentsCount.toLocaleString()}
            </div>
          </div>
          
          {/* Teachers */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span>{t('teachers')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {center.teachersCount.toLocaleString()}
            </div>
          </div>
          
          {/* Revenue - Full width on mobile if needed */}
          <div className="space-y-1 xs:col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Coins className="h-3 w-3 flex-shrink-0" />
              <span>{t('revenue')}</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {center.revenue.toLocaleString('ar-MA', { 
                style: 'currency', 
                currency: 'MAD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
        </div>

        {/* Performance Progress Bar */}
        {totalRevenue > 0 && (
          <div className="space-y-1.5 w-full">
            <div className="flex flex-col xs:flex-row xs:justify-between gap-1 text-xs text-muted-foreground">
              <span>{t('performance')}</span>
              <span className="font-medium">
                {((center.revenue / totalRevenue) * 100).toFixed(1)}% {t('ofTotal')}
              </span>
            </div>
            <Progress 
              value={(center.revenue / totalRevenue) * 100} 
              className="h-2"
            />
          </div>
        )}
      </div>

      {/* Action Button - Full width on mobile, auto on larger */}
      <Button 
        variant="outline" 
        size="sm" 
        asChild
        className="w-full sm:w-auto sm:flex-shrink-0 order-first sm:order-last"
      >
        <Link href={`/admin/center`}>
          {t('viewDetails')}
        </Link>
      </Button>
    </div>
  </CardContent>
</Card>

            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}