"use client"

import { ItemInputList } from "@/components/itemInputList"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { availableClassrooms, availableGrades, availableSubjects, BASE_URL } from "@/types/types"
import { Separator } from "@radix-ui/react-separator"
import axios from "axios"

import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { SubjectForm } from "./centerPresentation copy"


export const NewCenterForm = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    workingDays: [] as string[],
    classrooms: [] as string[],
    subjects: [] as Array<{name: string, grade: string, price: number, duration?: number}>,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [step, setStep] = useState(1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const updateClassrooms = (newClassrooms: string[]) => {
    setFormData(prev => ({ ...prev, classrooms: newClassrooms }))
  }

  const addSubject = (subjectName: string, grade: string, price: number, duration?: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, { name: subjectName, grade, price, duration }]
    }))
  }

  const removeSubject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const payload = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        classrooms: formData.classrooms,
        workingDays: formData.workingDays,
        subjects: formData.subjects
      }
      const response = await axios.post(
            '/api/center', 
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
      setStep(1)
      router.refresh()
    } catch (error) {
      console.log(error);
      
      setMessage("Error creating center. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto mt-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                <div className="relative my-4 flex items-center justify-center overflow-hidden">
                  <Separator className="flex-1 h-px bg-border" />
                  <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                    <Label>Basic Information</Label>
                  </div>
                  <Separator className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Center Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter center's full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter center's address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <Label>Classrooms</Label>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <ItemInputList
                label="Classrooms"
                placeholder="Type a classroom name"
                items={formData.classrooms}
                onChange={updateClassrooms}
                suggestions={availableClassrooms}
              />

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <Label>Working Days</Label>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <div key={day} className="border rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={day}
                        checked={formData.workingDays.includes(day)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            workingDays: checked
                              ? [...prev.workingDays, day]
                              : prev.workingDays.filter((d) => d !== day),
                          }))
                        }}
                      />
                      <Label htmlFor={day} className="font-medium">
                        {day}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
              
                type="button" 
                onClick={() => setStep(2)} 
                className="w-full hover:cursor-pointer"
                disabled={!formData.name.trim()}
              >
                Next: Add Subjects
              </Button>
            </>
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <>
              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <Label>Subjects & Pricing</Label>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>

              <SubjectForm 
                onAddSubject={addSubject} 
                availableSubjects={availableSubjects}
                availableGrades={availableGrades}
              />

              {formData.subjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Added Subjects ({formData.subjects.length}):</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {formData.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {subject.grade}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Price: ${subject.price}
                            {subject.duration && ` • Duration: ${subject.duration} minutes`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(index)}
                          className="ml-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating Center..." : "Create Center"}
                </Button>
              </div>
            </>
          )}

          {message && (
            <Alert className={message.includes("Error") ? "border-destructive" : "border-green-500"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export const SubjectFormMultipleChoices = ({ 
  onAddSubject, 
  availableSubjects, 
  availableGrades 
}: { 
  onAddSubject: (name: string, grade: string, price: number, duration?: number) => void
  availableSubjects: string[]
  availableGrades: string[]
}) => {
  const [subjectData, setSubjectData] = useState({
    selectedSubjects: [] as string[],
    selectedGrades: [] as string[],
    price: "",
    duration: ""
  })

  const updateSubjects = (newSubjects: string[]) => {
    setSubjectData(prev => ({ ...prev, selectedSubjects: newSubjects }))
  }

  const updateGrades = (newGrades: string[]) => {
    setSubjectData(prev => ({ ...prev, selectedGrades: newGrades }))
  }

  const handleAddSubjects = () => {
    if (subjectData.selectedSubjects.length > 0 && 
        subjectData.selectedGrades.length > 0 && 
        subjectData.price) {
      
      // Create combinations of subjects and grades
      subjectData.selectedSubjects.forEach(subject => {
        subjectData.selectedGrades.forEach(grade => {
          onAddSubject(
            subject,
            grade,
            parseFloat(subjectData.price),
            subjectData.duration ? parseInt(subjectData.duration) : undefined
          )
        })
      })
      
      // Reset form
      setSubjectData({ 
        selectedSubjects: [], 
        selectedGrades: [], 
        price: "", 
        duration: "" 
      })
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
      <div className="text-sm text-muted-foreground mb-4">
        You can select multiple subjects and grades. Each combination will create a separate course.
      </div>
      
      {/* NO FORM WRAPPER - just div */}
      <div className="space-y-4">
        {/* Subject Selection */}
        <div className="space-y-2">
          <Label>Select Subjects *</Label>
          <ItemInputList
            label="Subjects"
            placeholder="Type or select subjects"
            items={subjectData.selectedSubjects}
            onChange={updateSubjects}
            suggestions={availableSubjects}
          />
          {subjectData.selectedSubjects.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Selected: {subjectData.selectedSubjects.join(', ')}
            </div>
          )}
        </div>

        {/* Grade Selection */}
        <div className="space-y-2">
          <Label>Select Grades *</Label>
          <ItemInputList
            label="Grades"
            placeholder="Type or select grades"
            items={subjectData.selectedGrades}
            onChange={updateGrades}
            suggestions={availableGrades}
          />
          {subjectData.selectedGrades.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Selected: {subjectData.selectedGrades.join(', ')}
            </div>
          )}
        </div>

        {/* Price and Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subjectPrice">Price ($) *</Label>
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

        {/* Preview */}
        {subjectData.selectedSubjects.length > 0 && subjectData.selectedGrades.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Will create {subjectData.selectedSubjects.length * subjectData.selectedGrades.length} course(s):
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              {subjectData.selectedSubjects.slice(0, 3).map(subject => (
                <div key={subject}>
                  {subject}: {subjectData.selectedGrades.slice(0, 3).join(', ')}
                  {subjectData.selectedGrades.length > 3 && ` +${subjectData.selectedGrades.length - 3} more`}
                </div>
              ))}
              {subjectData.selectedSubjects.length > 3 && (
                <div className="italic">+{subjectData.selectedSubjects.length - 3} more subjects...</div>
              )}
            </div>
          </div>
        )}

        <Button 
          type="button" // ✅ Important: type="button" to prevent form submission
          onClick={handleAddSubjects}
          size="sm" 
          className="w-full"
          disabled={!subjectData.selectedSubjects.length || !subjectData.selectedGrades.length || !subjectData.price}
        >
          Add Subject(s) to Center
        </Button>
      </div>
    </div>
  )
}