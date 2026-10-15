import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '../store/auth'
import type { Role } from '../types'

/** Redirects to /login when signed out, and to / when the role is not allowed. */
export default function ProtectedRoute({ roles, children }: { roles?: Role[]; children?: ReactNode }) {
  const user = useCurrentUser()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children ?? <Outlet />}</>
}
