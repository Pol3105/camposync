import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import InviteRegisterPage from './pages/InviteRegisterPage'
import InvitacionesPage from './pages/InvitacionesPage'
import AgricultoresPage from './pages/AgricultoresPage'
import ExplotacionesPage from './pages/ExplotacionesPage'
import AgricultorExplotacionesPage from './pages/AgricultorExplotacionesPage'
import TratamientosPage from './pages/TratamientosPage'
import ExplotacionParcelasPage from './pages/ExplotacionParcelasPage'
import ParcelaTratamientosPage from './pages/ParcelaTratamientosPage'
import ParcelaRecintosPage from './pages/ParcelaRecintosPage'
import RecintoTratamientosPage from './pages/RecintoTratamientosPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
// Agricultor mobile interface
import DashboardAgricultor  from './pages/agricultor/DashboardAgricultor'
import CuadernoTratamientos from './pages/agricultor/CuadernoTratamientos'
import FincasAgricultor     from './pages/agricultor/FincasAgricultor'
import FincaDetalle         from './pages/agricultor/FincaDetalle'
import ParcelaDetalle       from './pages/agricultor/ParcelaDetalle'
import TratamientosRecinto  from './pages/agricultor/TratamientosRecinto'
import PerfilAgricultor     from './pages/agricultor/PerfilAgricultor'

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
        <Route path="/forgot-password"        element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token"  element={<ResetPasswordPage />} />
        <Route path="/dashboard"      element={<Private><DashboardPage /></Private>} />
        {/* Agricultor mobile routes */}
        <Route path="/cuaderno"                                          element={<Private><DashboardAgricultor /></Private>} />
        <Route path="/cuaderno/tratamientos"                             element={<Private><CuadernoTratamientos /></Private>} />
        <Route path="/cuaderno/fincas"                                   element={<Private><FincasAgricultor /></Private>} />
        <Route path="/cuaderno/fincas/:expId"                            element={<Private><FincaDetalle /></Private>} />
        <Route path="/cuaderno/fincas/:expId/parcelas/:parcelaId"        element={<Private><ParcelaDetalle /></Private>} />
        <Route path="/cuaderno/fincas/:expId/parcelas/:parcelaId/recintos/:recintoId/tratamientos" element={<Private><TratamientosRecinto /></Private>} />
        <Route path="/cuaderno/perfil"                                   element={<Private><PerfilAgricultor /></Private>} />
        <Route path="/invitaciones"   element={<Private><InvitacionesPage /></Private>} />
        <Route path="/agricultores"                        element={<Private><AgricultoresPage /></Private>} />
        <Route path="/agricultores/:id/explotaciones"      element={<Private><AgricultorExplotacionesPage /></Private>} />
        <Route path="/explotaciones"                       element={<Private><ExplotacionesPage /></Private>} />
        <Route path="/explotaciones/:id/parcelas"          element={<Private><ExplotacionParcelasPage /></Private>} />
        <Route path="/parcelas/:id/tratamientos"           element={<Private><ParcelaTratamientosPage /></Private>} />
        <Route path="/parcelas/:id/recintos"              element={<Private><ParcelaRecintosPage /></Private>} />
        <Route path="/recintos/:id/tratamientos"          element={<Private><RecintoTratamientosPage /></Private>} />
        <Route path="/tratamientos"                        element={<Private><TratamientosPage /></Private>} />
        <Route path="/configuracion"                       element={<Private><ConfiguracionPage /></Private>} />
        <Route path="*"               element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
