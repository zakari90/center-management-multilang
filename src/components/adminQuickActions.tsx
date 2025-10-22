// components/admin/admin-quick-actions.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Calendar,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function AdminQuickActions() {
  const t = useTranslations('adminQuickActions')
  
  const actions = [
    {
      title: t('myCenter.title'),
      description: t('myCenter.description'),
      icon: Building2,
      href: '/admin/center',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: t('allUsers.title'),
      description: t('allUsers.description'),
      icon: Users,
      href: '/admin/users',
      color: 'text-orange-600 bg-orange-100'
    },    
    {
      title: t('schedule.title'),
      description: t('schedule.description'),
      icon: Calendar,
      href: '/admin/schedule',
      color: 'text-pink-600 bg-pink-100'
    },
  ]

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className={`h-12 w-12 rounded-full ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}