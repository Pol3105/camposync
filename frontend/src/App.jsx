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
import RevisionTratamientoPage from './pages/RevisionTratamientoPage'
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
import RecursosAgricultor  from './pages/agricultor/RecursosAgricultor'
import PerfilAgricultor     from './pages/agricultor/PerfilAgricultor'
import RoleProtectedRoute from './components/RoleProtectedRoute'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" replace />
}

function PrivateAsesor({ children }) {
  return (
    <PrivateRoute>
      <RoleProtectedRoute allowedRoles={['ASESOR']}>
        {children}
      </RoleProtectedRoute>
    </PrivateRoute>
  )
}

function PrivateGranjero({ children }) {
  return (
    <PrivateRoute>
      <RoleProtectedRoute allowedRoles={['GRANJERO']}>
        {children}
      </RoleProtectedRoute>
    </PrivateRoute>
  )
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
        <Route path="/dashboard"      element={<PrivateAsesor><DashboardPage /></PrivateAsesor>} />
        {/* Agricultor mobile routes */}
        <Route path="/cuaderno"                                          element={<PrivateGranjero><DashboardAgricultor /></PrivateGranjero>} />
        <Route path="/cuaderno/tratamientos"                             element={<PrivateGranjero><CuadernoTratamientos /></PrivateGranjero>} />
        <Route path="/cuaderno/fincas"                                   element={<PrivateGranjero><FincasAgricultor /></PrivateGranjero>} />
        <Route path="/cuaderno/fincas/:expId"                            element={<PrivateGranjero><FincaDetalle /></PrivateGranjero>} />
        <Route path="/cuaderno/fincas/:expId/parcelas/:parcelaId"        element={<PrivateGranjero><ParcelaDetalle /></PrivateGranjero>} />
        <Route path="/cuaderno/fincas/:expId/parcelas/:parcelaId/recintos/:recintoId/tratamientos" element={<PrivateGranjero><TratamientosRecinto /></PrivateGranjero>} />
        <Route path="/cuaderno/recursos"                                 element={<PrivateGranjero><RecursosAgricultor /></PrivateGranjero>} />
        <Route path="/cuaderno/perfil"                                   element={<PrivateGranjero><PerfilAgricultor /></PrivateGranjero>} />
        {/* Asesor routes */}
        <Route path="/invitaciones"   element={<PrivateAsesor><InvitacionesPage /></PrivateAsesor>} />
        <Route path="/agricultores"                        element={<PrivateAsesor><AgricultoresPage /></PrivateAsesor>} />
        <Route path="/agricultores/:id/explotaciones"      element={<PrivateAsesor><AgricultorExplotacionesPage /></PrivateAsesor>} />
        <Route path="/explotaciones"                       element={<PrivateAsesor><ExplotacionesPage /></PrivateAsesor>} />
        <Route path="/explotaciones/:id/parcelas"          element={<PrivateAsesor><ExplotacionParcelasPage /></PrivateAsesor>} />
        <Route path="/parcelas/:id/tratamientos"           element={<PrivateAsesor><ParcelaTratamientosPage /></PrivateAsesor>} />
        <Route path="/parcelas/:id/recintos"              element={<PrivateAsesor><ParcelaRecintosPage /></PrivateAsesor>} />
        <Route path="/recintos/:id/tratamientos"          element={<PrivateAsesor><RecintoTratamientosPage /></PrivateAsesor>} />
        <Route path="/tratamientos"                        element={<PrivateAsesor><TratamientosPage /></PrivateAsesor>} />
        <Route path="/tratamientos/:id/revision"           element={<PrivateAsesor><RevisionTratamientoPage /></PrivateAsesor>} />
        <Route path="/configuracion"                       element={<PrivateAsesor><ConfiguracionPage /></PrivateAsesor>} />
        <Route path="*"               element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
