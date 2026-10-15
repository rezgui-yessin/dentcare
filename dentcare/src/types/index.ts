export type Role = 'admin' | 'secretary'
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-show'
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid'
export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-show']
export const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: Role
  specialty: string | null
  phone: string
  avatar: string | null
  language: string
}

export interface WorkingDay {
  open: boolean
  start: string | null
  end: string | null
  breakStart: string | null
  breakEnd: string | null
}

export interface Settings {
  cabinet: { name: string; address: string; phone: string; email: string; logo: string | null; currency: string }
  workingHours: Record<DayKey, WorkingDay>
  holidays: { date: string; name: string }[]
  slotDuration: number
  reminderHoursBefore: number
  defaultLanguage: string
  theme: string
}

export interface Treatment {
  id: string
  name: string
  defaultDuration: number
  price: number
  color: string
  category: string
  active: boolean
}

export interface ToothRecord {
  treatment: string
  date: string
  status: 'done' | 'planned'
}

export interface PatientDocument {
  id: string
  name: string
  type: string
  dataUrl: string
  addedAt: string
}

export interface Patient {
  id: string
  firstName: string
  lastName: string
  gender: 'M' | 'F'
  dateOfBirth: string
  phone: string
  email: string
  address: string
  allergies: string[]
  medicalHistory: string | null
  insurance: { provider: string; policyNumber: string } | null
  emergencyContact: { name: string; phone: string }
  notes: string
  documents: PatientDocument[]
  odontogram: Record<string, ToothRecord[]>
  createdAt: string
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  treatmentId: string
  date: string // yyyy-MM-dd
  startTime: string // HH:mm
  endTime: string
  duration: number
  status: AppointmentStatus
  toothNumber: number | null
  notes: string
  createdBy: string
  createdAt: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  appointmentId: string | null
  patientId: string
  date: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  amountPaid: number
  paymentStatus: PaymentStatus
  paymentMethod: string | null
}

export interface Reminder {
  id: string
  appointmentId: string
  patientId: string
  channel: 'SMS' | 'Email'
  scheduledFor: string
  sent: boolean
  message: string
}

export interface BookingRequest {
  id: string
  name: string
  phone: string
  email: string | null
  preferredDate: string
  preferredTime: string
  reason: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
}

export interface DB {
  users: User[]
  settings: Settings
  treatments: Treatment[]
  patients: Patient[]
  appointments: Appointment[]
  invoices: Invoice[]
  reminders: Reminder[]
  bookingRequests: BookingRequest[]
}

export type Collection = Exclude<keyof DB, 'settings'>
