/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { BookOpen, Building2, CalendarDays, Clock, DollarSign, Pencil, Plus, Trash2 } from "lucide-react"
import { EditDialog } from "./editDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "./ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Subject } from "@prisma/client"
import { Textarea } from "./ui/textarea"
import { Separator } from "./ui/separator"
import { toast } from 'sonner'
import { ItemInputList } from "./itemInputList"
import { useLocalizedConstants } from "./useLocalizedConstants"

export default function CenterPresentation(center: any) {
  
    const { availableSubjects, availableGrades } = useLocalizedConstants();
  const [formData, setFormData] = useState({
    name: center.name,
    address: center.address,
    phone: center.phone,
    classrooms: center.classrooms,
    workingDays: center.workingDays,
    subjects: center.subjects
  })

  const [tempName, setTempName] = useState(formData.name)
  const [tempAddress, setTempAddress] = useState(formData.address)
  const [tempPhone, setTempPhone] = useState(formData.phone)
  const [tempClassrooms, setTempClassrooms] = useState(formData.classrooms)
  const [tempWorkingDays, setTempWorkingDays] = useState(formData.workingDays)

  // Update center
  const handleUpdateCenter = async () => {
    try {
      const { data } = await axios.patch(`/api/centers`, {
        centerId: center.id,
        name: tempName,
        address: tempAddress,
        phone: tempPhone
      })

      setFormData(prev => ({
        ...prev,
        name: data.name,
        address: data.address,
        phone: data.phone
      }))

      toast("Center updated successfully")
    } catch (error) {
      console.log(error);
      
      toast("Failed to update center")
    }
  }

  // Update classrooms
  const handleUpdateClassrooms = async () => {
    try {
      const { data } = await axios.patch(`/api/centers`, {
        centerId: center.id,
        classrooms: tempClassrooms
      })

      setFormData(prev => ({ ...prev, classrooms: data.classrooms }))

      toast("Classrooms updated successfully")
    } catch (error) {
      console.log(error);
      
      toast("Failed to update classrooms")
    }
  }

  // Update working days
  const handleUpdateWorkingDays = async () => {
    try {
      const { data } = await axios.patch(`/api/centers`, {
        centerId: center.id,
        workingDays: tempWorkingDays
      })

      setFormData(prev => ({ ...prev, workingDays: data.workingDays }))

      toast("Working days updated successfully")
    } catch (error) {
      console.log(error);

      toast("Failed to update working days")
    }
  }

  // Add new subject
  const handleAddSubject = async (subjectName: string, grade: string, price: number, duration?: number) => {
    try {
      const { data } = await axios.post(`/api/subjects`, {
        centerId: center.id,
        name: subjectName,
        grade: grade,
        price: price,
        duration: duration
      })

      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, data]
      }))

      toast("Subject added successfully")
    } catch (error) {
      console.log(error);
      toast("Failed to add subject")
    }
  }

  // Update existing subject
  const handleUpdateSubject = async (subjectId: string, updatedData: Partial<Subject>) => {
    try {
      const { data } = await axios.patch(`/api/subjects`, {
        subjectId,
        ...updatedData
      })

      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.map((s: { id: string }) => s.id === subjectId ? data : s)
      }))

      toast("Subject updated successfully")
    } catch (error) {
            console.log(error);

      toast("Failed to update subject")
    }
  }

  // Delete subject
  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await axios.delete(`/api/subjects`, {
        data: { subjectId }
      })

      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter((s: { id: string }) => s.id !== subjectId)
      }))

      toast("Subject deleted successfully")
    } catch (error) {
            console.log(error);

      toast("Failed to delete subject")
    }
  }

  return (
    <main>
      <Card className="shadow-lg border border-border bg-background">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-3xl font-bold text-primary">
              {formData.name}
            </CardTitle>
            <EditDialog
              title="Edit Center Info"
              trigger={
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              }
              onSave={handleUpdateCenter}
            >
              <div className="space-y-4">
                <div>
                  <Label>Center Name</Label>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Center name"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea
                    value={tempAddress || ''}
                    onChange={(e) => setTempAddress(e.target.value)}
                    placeholder="Center address"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={tempPhone || ''}
                    onChange={(e) => setTempPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>
            </EditDialog>
          </div>
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
          {/* Subjects Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Subjects Offered
              </div>
              <EditDialog
                title="Add New Subject"
                trigger={
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add Subject
                  </Button>
                }
                onSave={() => {}} // Empty because SubjectForm handles submission
              >
                <SubjectForm
                  onAddSubject={handleAddSubject}
                  availableSubjects={availableSubjects}
                  availableGrades={availableGrades}
                />
              </EditDialog>
            </div>

            <div className="space-y-3">
              {formData.subjects.length > 0 ? (
                formData.subjects.map((subject: { name: string; centerId: string; grade: string; price: number; duration: number | null; id: string; createdAt: Date; updatedAt: Date }) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    onUpdate={handleUpdateSubject}
                    onDelete={handleDeleteSubject}
                    availableSubjects={availableSubjects}
                    availableGrades={availableGrades}
                  />
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
                onSave={handleUpdateClassrooms}
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

          {/* Working Days */}
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
                onSave={handleUpdateWorkingDays}
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
    </main>
  )
}

// Your SubjectForm Component
export const SubjectForm = ({
  onAddSubject,
  availableSubjects,
  availableGrades
}: {
  onAddSubject: (name: string, grade: string, price: number, duration?: number) => void
  availableSubjects: string[]
  availableGrades: string[]
}) => {
  const [subjectData, setSubjectData] = useState({
    selectedSubject: "",
    selectedGrade: "",
    price: "",
    duration: ""
  })

  const handleAddSubject = () => {
    if (subjectData.selectedSubject && subjectData.selectedGrade && subjectData.price) {
      onAddSubject(
        subjectData.selectedSubject,
        subjectData.selectedGrade,
        parseFloat(subjectData.price),
        subjectData.duration ? parseInt(subjectData.duration) : undefined
      )

      // Reset form
      setSubjectData({
        selectedSubject: "",
        selectedGrade: "",
        price: "",
        duration: ""
      })
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
      <div className="text-sm text-muted-foreground mb-4">
        Please select one subject and one grade. Duration is optional.
      </div>

      <div className="space-y-4">
        {/* Subject Selection */}
        <div className="space-y-2">
          <Label>Select Subject *</Label>
          <ItemInputList
            label="Subject"
            placeholder="Type or select a subject"
            items={subjectData.selectedSubject ? [subjectData.selectedSubject] : []}
            onChange={(items) => {
              const single = items[0] || ""
              setSubjectData(prev => ({ ...prev, selectedSubject: single }))
            }}
            suggestions={availableSubjects}
          />
          {subjectData.selectedSubject && (
            <div className="text-xs text-muted-foreground">
              Selected: {subjectData.selectedSubject}
            </div>
          )}
        </div>

        {/* Grade Selection */}
        <div className="space-y-2">
          <Label>Select Grade *</Label>
          <ItemInputList
            label="Grade"
            placeholder="Type or select a grade"
            items={subjectData.selectedGrade ? [subjectData.selectedGrade] : []}
            onChange={(items) => {
              const single = items[0] || ""
              setSubjectData(prev => ({ ...prev, selectedGrade: single }))
            }}
            suggestions={availableGrades}
          />
          {subjectData.selectedGrade && (
            <div className="text-xs text-muted-foreground">
              Selected: {subjectData.selectedGrade}
            </div>
          )}
        </div>

        {/* Price and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subjectPrice">Price (MAD) *</Label>
            <Input
              id="subjectPrice"
              type="number"
              step="0.01"
              value={subjectData.price}
              onChange={(e) => setSubjectData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectDuration">Duration (minutes)</Label>
            <Input
              id="subjectDuration"
              type="number"
              value={subjectData.duration}
              onChange={(e) => setSubjectData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="60"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleAddSubject}
          size="sm"
          className="w-full"
          disabled={!subjectData.selectedSubject || !subjectData.selectedGrade || !subjectData.price}
        >
          Add Subject to Center
        </Button>
      </div>
    </div>
  )
}

// Subject Card Component for editing
function SubjectCard({ 
  subject, 
  onUpdate, 
  onDelete,
  availableSubjects,
  availableGrades
}: { 
  subject: Subject
  onUpdate: (id: string, data: Partial<Subject>) => void
  onDelete: (id: string) => void
  availableSubjects: string[]
  availableGrades: string[]
}) {
  const [tempSubject, setTempSubject] = useState({
    selectedSubject: subject.name,
    selectedGrade: subject.grade,
    price: subject.price.toString(),
    duration: subject.duration?.toString() || ""
  })

  const handleUpdateSubject = () => {
    onUpdate(subject.id, {
      name: tempSubject.selectedSubject,
      grade: tempSubject.selectedGrade,
      price: parseFloat(tempSubject.price),
      duration: tempSubject.duration ? parseInt(tempSubject.duration) : null
    })
  }

  return (
    <Card className="p-4">
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
        
        <div className="flex gap-1">
          <EditDialog
            title="Edit Subject"
            trigger={
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            }
            onSave={handleUpdateSubject}
          >
            <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
              <div className="space-y-4">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label>Select Subject *</Label>
                  <ItemInputList
                    label="Subject"
                    placeholder="Type or select a subject"
                    items={tempSubject.selectedSubject ? [tempSubject.selectedSubject] : []}
                    onChange={(items) => {
                      const single = items[0] || ""
                      setTempSubject(prev => ({ ...prev, selectedSubject: single }))
                    }}
                    suggestions={availableSubjects}
                  />
                </div>

                {/* Grade Selection */}
                <div className="space-y-2">
                  <Label>Select Grade *</Label>
                  <ItemInputList
                    label="Grade"
                    placeholder="Type or select a grade"
                    items={tempSubject.selectedGrade ? [tempSubject.selectedGrade] : []}
                    onChange={(items) => {
                      const single = items[0] || ""
                      setTempSubject(prev => ({ ...prev, selectedGrade: single }))
                    }}
                    suggestions={availableGrades}
                  />
                </div>

                {/* Price and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editPrice">Price (MAD) *</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={tempSubject.price}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editDuration">Duration (minutes)</Label>
                    <Input
                      id="editDuration"
                      type="number"
                      value={tempSubject.duration}
                      onChange={(e) => setTempSubject(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>
            </div>
          </EditDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{subject.name}&quot; from the center.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(subject.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  )
}

// Section Component
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