// components/admin/centers-overview.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import axios from 'axios'
import {
  Building2,
  DollarSign,
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
              <Card key={center.id} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <Link 
                            href={`/admin/centers/${center.id}`}
                            className="text-lg font-semibold hover:underline"
                          >
                            {center.name}
                          </Link>
                          <Badge variant="secondary">
                            {center.managersCount} {t('managers')}
                          </Badge>
                        </div>
                        {center.address && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {center.address}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            {t('students')}
                          </div>
                          <div className="text-2xl font-bold">{center.studentsCount}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            {t('teachers')}
                          </div>
                          <div className="text-2xl font-bold">{center.teachersCount}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                            <DollarSign className="h-3 w-3" />
                            {t('revenue')}
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            ${center.revenue.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('performance')}</span>
                          <span>{((center.revenue / totalRevenue) * 100).toFixed(1)}% {t('ofTotal')}</span>
                        </div>
                        <Progress value={(center.revenue / totalRevenue) * 100} />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" asChild>
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