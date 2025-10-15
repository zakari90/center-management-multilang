"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, BookOpen, Building2, CalendarDays, DollarSign, Clock, Plus } from "lucide-react"
import { useState } from "react"
import { ItemInputList } from "@/components/itemInputList"
import { EditDialog } from "./editDialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { SubjectForm } from "./newCenterForm copy"
import { availableGrades, availableSubjects, BASE_URL } from "@/types/types"
import axios from "axios"

type Subject = {
  id: string
  name: string
  grade: string
  price: number
  duration: number | null
  createdAt: string
  updatedAt: string
  centerId: string
}

export type Center = {
  id: string
  name: string
  address?: string
  phone?: string
  classrooms: string[]
  workingDays: string[]
  subjects: Subject[]
  createdAt: string
  updatedAt: string
  adminId: string
}

export default function CenterPresentation(center: Center) {
  const [formData, setFormData] = useState({
    name: center.name,
    address: center.address,
    phone: center.phone,
    classrooms: center.classrooms,
    workingDays: center.workingDays,
    subjects: center.subjects
  })

    const addSubject = (subjectName: string, grade: string, price: number, duration?: number) => {
    
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: subjectName, grade, price, duration }]
    }))
  }
  const [tempClassrooms, setTempClassrooms] = useState(formData.classrooms)
  const [tempWorkingDays, setTempWorkingDays] = useState(formData.workingDays)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
    const handleAddSubject = () => {
    setIsAddDialogOpen(true)
  }

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const payload = {
        centerId: formData.name,
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        classrooms: formData.classrooms,
        workingDays: formData.workingDays,
        subjects: formData.subjects
      }
      const response = await axios.put(BASE_URL+
            '/center', 
            payload
        , { headers: { 
            "Content-Type": "application/json", }, }
        );       


      if (!response) {
        throw new Error('Failed to create center')
      }

      setMessage("Center created successfully!")
      setFormData({
        name: "",
        address: "",
        phone: "",
        subjects: [],
        classrooms: [],
        workingDays: [],
      })
    } catch (error) {
      console.log(error);
      
      setMessage("Error creating center. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Card className="shadow-lg border border-border bg-background">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">
            {formData.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">Center Overview</p>
          {formData.address && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{formData.address}</p>
          )}
          {formData.phone && (
            <p className="text-sm text-muted-foreground">📞 {formData.phone}</p>
          )}
        </CardHeader>

        <Separator className="my-2" />

        <CardContent className="space-y-6">

          {/* Subjects */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Subjects Offered
              </div>
        <Button onClick={handleAddSubject} className="hover:cursor-pointer w-full m-2 mb-0 sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </div>

            <div className="space-y-3">
              {formData.subjects.length > 0 ? (
                formData.subjects.map((subject) => (
                  <Card key={subject.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-base">{subject.name}</h4>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{subject.grade}</Badge>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {subject.price} MAD
                          </span>
                          {subject.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {subject.duration} min
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No subjects added</p>
              )}
            </div>
          </div>

          {/* Classrooms */}
          <Section
            title="Available Classrooms"
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            items={formData.classrooms}
            onEditButton={
              <EditDialog
                title="Edit Classrooms"
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                }
                onSave={() => setFormData(prev => ({ ...prev, classrooms: tempClassrooms }))}
              >
                <ItemInputList
                  label="Classrooms"
                  placeholder="Type a classroom"
                  items={tempClassrooms}
                  onChange={setTempClassrooms}
                  suggestions={formData.classrooms}
                />
              </EditDialog>
            }
          />

          <Section
            title="Working Days"
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            items={formData.workingDays}
            onEditButton={
              <EditDialog
                title="Edit Working Days"
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                }
                onSave={() => setFormData(prev => ({ ...prev, workingDays: tempWorkingDays }))}
              >
                <ItemInputList
                  label="Working Days"
                  placeholder="Type a day name"
                  items={tempWorkingDays}
                  onChange={setTempWorkingDays}
                  suggestions={formData.workingDays}
                />
              </EditDialog>
            }
          />
        </CardContent>
      </Card>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new manager to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SubjectForm
                onAddSubject={addSubject} 
                availableSubjects={availableSubjects}
                availableGrades={availableGrades}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

type SectionProps = {
  title: string
  icon: React.ReactNode
  items: string[]
  onEditButton?: React.ReactNode
}

function Section({ title, icon, items, onEditButton }: SectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
          {icon}
          {title}
        </div>
        {onEditButton}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge key={item} variant="secondary" className="text-sm">
              {item}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic">No data</p>
        )}
      </div>
    </div>
  )
}