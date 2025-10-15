// components/dashboard/quick-actions.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, GraduationCap, Receipt, Settings, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function QuickActions() {
  const actions = [
    {
      title: 'Add Student',
      description: 'Enroll a new student',
      icon: UserPlus,
      href: '/manager/students/create',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Add Teacher',
      description: 'Register new teacher',
      icon: GraduationCap,
      href: '/manager/teachers/create',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'New Receipt',
      description: 'Record payment',
      icon: Receipt,
      href: '/manager/receipts/create',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      title: 'Schedule',
      description: 'View calendar',
      icon: Calendar,
      href: '/manager/schedule',
      color: 'text-pink-600 bg-pink-100'
    },
  ]

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
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