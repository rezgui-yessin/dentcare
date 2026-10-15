import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './routes/ProtectedRoute'
import { Spinner } from './components/ui/misc'

const Login = lazy(() => import('./pages/Login'))
const PublicBooking = lazy(() => import('./pages/PublicBooking'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Appointments = lazy(() => import('./pages/Appointments'))
const Patients = lazy(() => import('./pages/Patients'))
const PatientDetail = lazy(() => import('./pages/PatientDetail'))
const Treatments = lazy(() => import('./pages/Treatments'))
const Billing = lazy(() => import('./pages/Billing'))
const Reminders = lazy(() => import('./pages/Reminders'))
const Requests = lazy(() => import('./pages/Requests'))
const Reports = lazy(() => import('./pages/Reports'))
const SettingsPage = lazy(() => import('./pages/Settings'))

export default function App() {
  return (
    <Suspense fallback={<Spinner className="h-screen" />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/book" element={<PublicBooking />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="treatments" element={<Treatments />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="requests" element={<Requests />} />

          {/* Admin / doctor only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
