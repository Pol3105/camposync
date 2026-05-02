import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import DashboardGranjero from './pages/DashboardGranjero'
import InviteRegisterPage from './pages/InviteRegisterPage'
import InvitacionesPage from './pages/InvitacionesPage'
import AgricultoresPage from './pages/AgricultoresPage'
import ExplotacionesPage from './pages/ExplotacionesPage'
import AgricultorExplotacionesPage from './pages/AgricultorExplotacionesPage'
import TratamientosPage from './pages/TratamientosPage'
import ExplotacionParcelasPage from './pages/ExplotacionParcelasPage'
import ParcelaTratamientosPage from './pages/ParcelaTratamientosPage'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function Private({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/register"               element={<SignUpPage />} />
        <Route path="/register/invite/:token" element={<InviteRegisterPage />} />
        <Route path="/dashboard"      element={<Private><DashboardPage /></Private>} />
        <Route path="/cuaderno"       element={<Private><DashboardGranjero /></Private>} />
        <Route path="/invitaciones"   element={<Private><InvitacionesPage /></Private>} />
        <Route path="/agricultores"                        element={<Private><AgricultoresPage /></Private>} />
        <Route path="/agricultores/:id/explotaciones"      element={<Private><AgricultorExplotacionesPage /></Private>} />
        <Route path="/explotaciones"                       element={<Private><ExplotacionesPage /></Private>} />
        <Route path="/explotaciones/:id/parcelas"          element={<Private><ExplotacionParcelasPage /></Private>} />
        <Route path="/parcelas/:id/tratamientos"           element={<Private><ParcelaTratamientosPage /></Private>} />
        <Route path="/tratamientos"                        element={<Private><TratamientosPage /></Private>} />
        <Route path="*"               element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
