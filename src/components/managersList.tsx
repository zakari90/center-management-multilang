// components/admin/managers-list.tsx
'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Loader2, 
  UserPlus, 
  Mail,
  Building2,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Manager {
  id: string
  name: string
  email: string
  centersCount: number
  studentsCount: number
  teachersCount: number
}

export default function ManagersList() {
  const t = useTranslations('managersList')
  const [managers, setManagers] = useState<Manager[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchManagers()
  }, [])

  const fetchManagers = async () => {
    try {
      const { data } = await axios.get('/api/admin/managers')
      setManagers(data)
    } catch (err) {
      console.error('Failed to fetch managers:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin/managers/create">
              <UserPlus className="h-4 w-4 mr-1" />
              {t('add')}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : managers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noManagers')}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Avatar className="h-10 w-10 bg-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {manager.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Link 
                      href={`/admin/managers/${manager.id}`}
                      className="font-semibold hover:underline truncate"
                    >
                      {manager.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <Mail className="h-3 w-3" />
                    {manager.email}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      {manager.centersCount} {t('centers')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {manager.studentsCount} {t('students')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {manager.teachersCount} {t('teachers')}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}