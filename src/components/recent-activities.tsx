// components/dashboard/recent-activities.tsx
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserPlus, BookOpen, DollarSign, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'student' | 'teacher' | 'enrollment' | 'payment'
  title: string
  description: string
  date: string
  link?: string
  amount?: number
}

export default function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const { data } = await axios.get('/api/dashboard/activities')
      setActivities(data)
    } catch (err) {
      console.error('Failed to fetch activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'student':
      case 'teacher':
        return <UserPlus className="h-4 w-4" />
      case 'enrollment':
        return <BookOpen className="h-4 w-4" />
      case 'payment':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-blue-500'
      case 'teacher':
        return 'bg-purple-500'
      case 'enrollment':
        return 'bg-green-500'
      case 'payment':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest updates from your center</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            No recent activities
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className={`${getColor(activity.type)} h-9 w-9 flex items-center justify-center`}>
                  <AvatarFallback className="bg-transparent text-white">
                    {getIcon(activity.type)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {activity.link ? (
                        <Link href={activity.link} className="hover:underline">
                          {activity.title}
                        </Link>
                      ) : (
                        activity.title
                      )}
                    </p>
                    {activity.amount && (
                      <Badge variant="outline" className="ml-2">
                        ${activity.amount.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
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