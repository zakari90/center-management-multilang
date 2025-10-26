// components/admin/system-activity-log.tsx
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useTranslations } from 'next-intl'

interface ActivityLog {
  id: string
  type: 'center_created' | 'manager_added' | 'student_enrolled' | 'payment_received'
  description: string
  centerName?: string
  amount?: number
  timestamp: string
}

export default function SystemActivityLog() {
  const t = useTranslations('systemActivityLog')
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const { data } = await axios.get('/api/admin/dashboard/activities')
      setActivities(data)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'center_created': return 'bg-blue-500'
      case 'manager_added': return 'bg-purple-500'
      case 'student_enrolled': return 'bg-green-500'
      case 'payment_received': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Avatar className={`${getActivityColor(activity.type)} h-8 w-8`}>
                  <AvatarFallback className="bg-transparent text-white">
                    <Activity className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium">
                      {activity.description}
                    </p>
                    {activity.amount && (
                      <Badge variant="outline" className="ml-2">
                        ${activity.amount.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  {activity.centerName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.centerName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}