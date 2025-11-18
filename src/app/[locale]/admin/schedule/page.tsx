"use client"

import TeacherScheduleView from "@/components/teacherWithSchedule"
import TimetableManagement from "@/components/TimeTableManagement"
import { centerActions } from "@/lib/dexie/dexieActions"
import { useAuth } from "@/context/authContext"
import { Loader2 } from "lucide-react"
import { useEffect, useState, useCallback } from "react"

export default function SchedulePage() {
  const [centerId, setCenterId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  const fetchCenterId = useCallback(async () => {
    try {
      setIsLoading(true)
      
      if (!user) {
        setCenterId(null)
        setIsLoading(false)
        return
      }

      const centers = await centerActions.getAll()
      const activeCenters = centers.filter(c => c.status !== '0')
      
      // For admin, get the first active center (or center matching adminId)
      const isAdmin = user.role?.toUpperCase() === 'ADMIN'
      const adminCenters = activeCenters.filter(c => c.adminId === user.id)
      
      const centerToShow = adminCenters.length > 0 
        ? adminCenters[0] 
        : (isAdmin && activeCenters.length > 0)
          ? activeCenters[0]
          : null
      
      setCenterId(centerToShow?.id || null)
    } catch (error) {
      console.error("Error fetching center data:", error)
      setCenterId(null)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCenterId()
  }, [fetchCenterId])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <TeacherScheduleView />
      <TimetableManagement centerId={centerId || undefined} />
    </div>
  )
}