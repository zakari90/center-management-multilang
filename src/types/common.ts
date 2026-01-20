/**
 * Common TypeScript type definitions for the Center Management application
 * 
 * This file contains shared types used across the application to improve type safety
 * and reduce the usage of `any` types.
 */

// ==================== UTILITY TYPES ====================

/**
 * Represents possible values for form inputs and filters
 */
export type FormValue = string | number | boolean | null | undefined

/**
 * Represents possible filter values
 */
export type FilterValue = string | number | boolean | null

/**
 * Generic record type for objects with unknown structure
 */
export type UnknownRecord = Record<string, unknown>

/**
 * Status types for offline-first entities
 */
export type EntityStatus = '1' | 'w' | '0' // 1 = synced, w = waiting, 0 = deleted

/**
 * Compensation type for teachers
 */
export type CompensationType = 'percentage' | 'hourly'

/**
 * Payment method types
 */
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check'

// ==================== SCHEDULE TYPES ====================

/**
 * Day of the week
 */
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

/**
 * Time in HH:MM format
 */
export type TimeString = string // e.g., "09:00", "17:30"

/**
 * Weekly schedule for a single day
 */
export interface DaySchedule {
  day: string
  startTime: TimeString
  endTime: TimeString
  isAvailable: boolean
}

/**
 * Parsed schedule entry from JSON
 */
export interface ParsedScheduleEntry {
  day: string
  startTime: TimeString
  endTime: TimeString
}

// ==================== FORM TYPES ====================

/**
 * Generic form field configuration
 */
export interface FormField<T = FormValue> {
  name: string
  type: 'text' | 'email' | 'number' | 'tel' | 'date' | 'time' | 'password'
  required: boolean
  value?: T
  placeholder?: string
  label?: string
}

/**
 * Teacher subject form data
 */
export interface TeacherSubjectForm {
  subjectId: string
  percentage?: number
  hourlyRate?: number
  compensationType: CompensationType
}

/**
 * Student subject form data
 */
export interface StudentSubjectForm {
  subjectId: string
  teacherId: string
}

// ==================== API RESPONSE TYPES ====================

/**
 * Generic API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  success: false
  error: string
  message?: string
}

/**
 * Combined API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Sync result for offline-first operations
 */
export interface SyncResult {
  success: boolean
  successCount?: number
  failCount?: number
  error?: string
  results?: Array<{
    success: boolean
    error?: string
  }>
}

// ==================== COLOR TYPES ====================

/**
 * Activity types for color coding
 */
export type ActivityType = 'student' | 'teacher' | 'enrollment' | 'payment' | 'center_created' | 'manager_added' | 'student_enrolled' | 'payment_received'

/**
 * Color variant types
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'student' | 'teacher' | 'payment'

// ==================== TABLE TYPES ====================

/**
 * Sort direction for tables
 */
export type SortDirection = 'asc' | 'desc' | null

/**
 * Filter map for tables
 */
export type FilterMap = Record<string, FilterValue>

// ==================== TRANSLATION TYPES ====================

/**
 * Translation function type (from next-intl)
 */
export type TranslationFunction = (key: string, values?: Record<string, string | number>) => string

// ==================== EVENT HANDLER TYPES ====================

/**
 * Generic change handler for form inputs
 */
export type InputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void

/**
 * Generic change handler for select inputs
 */
export type SelectChangeHandler = (value: string) => void

/**
 * Generic change handler for checkbox inputs
 */
export type CheckboxChangeHandler = (checked: boolean) => void

/**
 * Generic update handler for form fields
 */
export type FieldUpdateHandler<T = FormValue> = (field: string, value: T) => void
