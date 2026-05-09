import { Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function RoleProtectedRoute({ allowedRoles, children }) {
  const navigate = useNavigate()
  const userRole = localStorage.getItem('rol')

  useEffect(() => {
    if (!userRole || !allowedRoles.includes(userRole)) {
      const fallback = userRole === 'GRANJERO' ? '/cuaderno' : '/dashboard'

      // Try to navigate back, or go to fallback if no history
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate(fallback, { replace: true })
      }
    }
  }, [userRole, allowedRoles, navigate])

  if (!userRole || !allowedRoles.includes(userRole)) {
    return null // Return null while navigating
  }

  return children
}