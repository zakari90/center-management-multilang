/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface DaySchedule {
  day: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface Subject {
  id: string
  name: string
  grade: string
  price: number
}

interface TeacherSubject {
  subjectId: string
  percentage?: number
  hourlyRate?: number
  compensationType: "percentage" | "hourly"
}

export default function CreateTeacherForm() {
  const router = useRouter()
  const t = useTranslations("CreateTeacherForm")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const DAYS = [t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday"), t("sunday")]

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    DAYS.map((day) => ({
      day,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: false,
    })),
  )

  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([])

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get("/api/subjects")
        if (response) setSubjects(response.data)
      } catch (err) {
        console.error("Failed to fetch subjects:", err)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleScheduleChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addSubject = () => {
    setTeacherSubjects((prev) => [
      ...prev,
      { subjectId: "", compensationType: "percentage", percentage: 0, hourlyRate: 0 },
    ])
  }

  const removeSubject = (index: number) => {
    setTeacherSubjects((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSubject = (index: number, field: keyof TeacherSubject, value: any) => {
    setTeacherSubjects((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const validSubjects = teacherSubjects.filter((ts) => ts.subjectId)
      for (const ts of validSubjects) {
        if (ts.compensationType === "percentage" && (!ts.percentage || ts.percentage <= 0 || ts.percentage > 100)) {
          throw new Error(t("percentageRangeError"))
        }
        if (ts.compensationType === "hourly" && (!ts.hourlyRate || ts.hourlyRate <= 0)) {
          throw new Error(t("hourlyRateError"))
        }
      }

      const activeSchedule = weeklySchedule
        .filter((day) => day.isAvailable)
        .map(({ day, startTime, endTime }) => ({ day, startTime, endTime }))

      const payload = {
        ...formData,
        weeklySchedule: activeSchedule.length > 0 ? activeSchedule : null,
        subjects: validSubjects.map((ts) => ({
          subjectId: ts.subjectId,
          percentage: ts.compensationType === "percentage" ? ts.percentage : null,
          hourlyRate: ts.compensationType === "hourly" ? ts.hourlyRate : null,
        })),
      }

      await axios.post("/api/teachers", payload)
      await router.push("/manager/teachers")
      router.refresh()
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.error || t("genericError"))
      else if (err instanceof Error) setError(err.message)
      else setError(t("genericError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("basicInfo")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["name", "email", "phone", "address"].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>
                      {t(field)}
                      {field === "name" && <span className="text-destructive">*</span>}
                    </Label>
                    <Input
                      type={field === "email" ? "email" : "text"}
                      id={field}
                      name={field}
                      required={field === "name"}
                      value={(formData as any)[field]}
                      onChange={handleInputChange}
                      placeholder={t(field)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Subjects & Compensation Section */}
            <div className="border-b pb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{t("subjectsCompensation")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("assignSubjects")}</p>
                </div>
                <Button type="button" onClick={addSubject} disabled={loadingSubjects}>
                  {t("addSubject")}
                </Button>
              </div>

              {loadingSubjects ? (
                <p className="text-muted-foreground text-center py-4">{t("loadingSubjects")}</p>
              ) : subjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t("noSubjects")}</p>
              ) : teacherSubjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 bg-muted rounded-md">{t("noSubjectsAssigned")}</p>
              ) : (
                <div className="space-y-4">
                  {teacherSubjects.map((ts, index) => {
                    return (
                      <Card key={index}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-2">
                              <Label htmlFor={`subject-${index}`}>
                                {t("subject")} <span className="text-destructive">*</span>
                              </Label>
                              <Select
                                value={ts.subjectId}
                                onValueChange={(value) => updateSubject(index, "subjectId", value)}
                              >
                                <SelectTrigger id={`subject-${index}`}>
                                  <SelectValue placeholder={t("subject")} />
                                </SelectTrigger>
                                <SelectContent>
                                  {subjects
                                    .filter(
                                      (s) =>
                                        !teacherSubjects.some(
                                          (ts2, i) => i !== index && ts2.subjectId === s.id,
                                        ),
                                    )
                                    .map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name} - {subject.grade} (${subject.price})
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSubject(index)}
                              className="mt-7 text-destructive hover:text-destructive"
                              title={t("remove")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-sm">
                            <div className="space-y-2">
                              <Label htmlFor={`payment-type-${index}`}>{t("paymentType")}</Label>
                              <Select
                                value={ts.compensationType}
                                onValueChange={(value) => updateSubject(index, "compensationType", value)}
                              >
                                <SelectTrigger id={`payment-type-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">{t("percentage")}</SelectItem>
                                  <SelectItem value="hourly">{t("hourlyRate")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {ts.compensationType === "percentage" ? (
                              <div className="space-y-2">
                                <Label htmlFor={`percentage-${index}`}>
                                  {t("percentage")} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`percentage-${index}`}
                                  type="number"
                                  min={1}
                                  max={100}
                                  step={0.1}
                                  value={ts.percentage || ""}
                                  onChange={(e) =>
                                    updateSubject(index, "percentage", parseFloat(e.target.value))
                                  }
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label htmlFor={`hourly-rate-${index}`}>
                                  {t("hourlyRate")} <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`hourly-rate-${index}`}
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={ts.hourlyRate || ""}
                                  onChange={(e) =>
                                    updateSubject(index, "hourlyRate", parseFloat(e.target.value))
                                  }
                                />
                              </div>
                            )}

                            <div className="flex items-end">
                              <Card className="w-full bg-primary/5">
                                <CardContent className="pt-4">
                                  <p className="text-xs text-muted-foreground mb-1">{t("estimatedEarnings")}</p>
                                  <p className="text-lg font-semibold">
                                    {ts.compensationType === "percentage" && ts.percentage
                                      ? `$${((subjects.find((s) => s.id === ts.subjectId)?.price ?? 0 * ts.percentage) / 100).toFixed(2)}`
                                      : ts.hourlyRate
                                      ? `$${ts.hourlyRate.toFixed(2)}/hr`
                                      : "$0.00"}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Weekly Schedule Section */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold mb-4">{t("weeklySchedule")}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t("selectAvailable")}</p>

              <div className="space-y-3">
                {weeklySchedule.map((schedule, index) => (
                  <div key={schedule.day} className="flex items-center  p-4 bg-muted rounded-md">
                    <div className="flex items-center min-w-[100px]">
                      <Checkbox
                        id={`day-${schedule.day}`}
                        checked={schedule.isAvailable}
                        onCheckedChange={(checked) => handleScheduleChange(index, "isAvailable", checked as boolean)}
                      />
                      <Label htmlFor={`day-${schedule.day}`} className="m-3 cursor-pointer">
                        {schedule.day}
                      </Label>
                    </div>

                    {schedule.isAvailable && (
                      <div className="flex gap-3 flex-1 flex-wrap">
                        <div className="flex ">
                          <Label className="text-sm m-1">{t("from")}</Label>
                          <Input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => handleScheduleChange(index, "startTime", e.target.value)}
                            className="w-32"
                          />
                        </div>
                        <div className="flex">
                          <Label className="text-sm m-1">{t("to")}</Label>
                          <Input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => handleScheduleChange(index, "endTime", e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("creating") : t("createTeacher")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
