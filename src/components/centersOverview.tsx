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
    <Card className="col-span-1 lg:col-span-4 w-full">
      <CardHeader className="px-4 sm:px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div>
            <CardTitle className="text-lg sm:text-xl">{t('title')}</CardTitle>
            <CardDescription className="text-sm">{t('description')}</CardDescription>
          </div>
          {centers.length > 0 && (
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto mt-2 sm:mt-0">
              <Link href="/admin/center">{t('createFirstCenter')}</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center items-center h-48 sm:h-64 md:h-72">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : centers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-4">{t('noCenters')}</p>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/center">{t('createFirstCenter')}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 p-4 sm:p-6">
            {centers.map((center) => (
              <Card 
                key={center.id} 
                className="border-2 hover:border-primary/50 transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-4 sm:p-6">
                  {/* Header Section - Stacked on mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex-1 space-y-2">
                      {/* Name and Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                          <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                          <Link 
                            href={`/admin/centers/${center.id}`}
                            className="text-lg sm:text-xl font-semibold hover:underline line-clamp-1"
                          >
                            {center.name}
                          </Link>
                        </div>
                        <Badge variant="secondary" className="text-xs px-2 py-1 whitespace-nowrap">
                          {center.managersCount} {t('managers')}
                        </Badge>
                      </div>

                      {/* Address */}
                      {center.address && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{center.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="w-full sm:w-auto flex-shrink-0"
                    >
                      <Link href={`/admin/centers/${center.id}`}>
                        {t('viewDetails')}
                      </Link>
                    </Button>
                  </div>

                  {/* Stats Section - Responsive Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    {/* Students */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{t('students')}</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {center.studentsCount.toLocaleString()}
                      </div>
                    </div>

                    {/* Teachers */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{t('teachers')}</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        {center.teachersCount.toLocaleString()}
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Coins className="h-3 w-3" />
                        <span>{t('revenue')}</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-green-600">
                        {center.revenue.toLocaleString('ar-MA', { 
                          style: 'currency', 
                          currency: 'MAD',
                          minimumFractionDigits: 0 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Performance Progress Bar */}
                  {totalRevenue > 0 && (
                    <div className="space-y-2 w-full">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-xs text-muted-foreground">
                        <span>{t('performance')}</span>
                        <span>
                          {((center.revenue / totalRevenue) * 100).toFixed(1)}% {t('ofTotal')}
                        </span>
                      </div>
                      <Progress 
                        value={(center.revenue / totalRevenue) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
