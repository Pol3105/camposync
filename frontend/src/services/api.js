const BASE = '/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // 1. Leemos el cuerpo de la respuesta primero
  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  // 2. Si es 401 pero NO es la ruta de login, entonces sí redirigimos (sesión caducada)
  if (res.status === 401 && !path.includes('/auth/login')) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return
  }

  // 3. Si la respuesta no es OK (incluyendo el 401 del login), LANZAMOS el error
  if (!res.ok) {
    // Lanzamos un objeto con toda la información para que el catch lo use
    throw { 
      status: res.status, 
      message: data?.message ?? data?.detail ?? 'Error inesperado', 
      campos: data?.campos ?? null 
    }
  }
  
  return data
}

export const auth = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  registerAsesor: ({ nombreAsesor, nombreAsesoria, email, password }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: email, password, tipo: 'ASESOR', nombreAsesor, nombreAsesoria }),
    }),

  registerGranjero: ({ username, password }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, tipo: 'GRANJERO' }),
    }),

  // Flujo atómico: register + aceptar invitación + devuelve JWT en una sola llamada
  registerInvite: (token, { username, password , nombre }) =>
    request(`/auth/register-invite/${token}`, {
      method: 'POST',
      body: JSON.stringify({ username, password, nombre }),
    }),
}

export const invitaciones = {
  aceptar: (token) =>
    request(`/invitaciones/${token}/aceptar`, { method: 'POST' }),

  crear: (emailInvitado, rolDestino = 'AGRICULTOR') =>
    request('/invitaciones', { method: 'POST', body: JSON.stringify({ emailInvitado, rolDestino }) }),

  listar:   () => request('/asesor/invitaciones'),
  cancelar: (token) => request(`/invitaciones/${token}`, { method: 'DELETE' }),
  reenviar: (token) => request(`/invitaciones/${token}/reenviar`, { method: 'POST' }),
}

export const granjero = {
  explotaciones:          () => request('/explotaciones'),
  parcelasPorExplotacion: (id) => request(`/parcelas/explotacion/${id}`),
  recintosPorParcela:     (id) => request(`/recintos/parcela/${id}`),
  inventario:             () => request('/inventario'),
  tratamientos:           () => request('/tratamientos'),
  crearTratamiento:       (body) => request('/tratamientos', { method: 'POST', body: JSON.stringify(body) }),
}

export const asesor = {
  granjeros: () => request('/asesor/granjeros'),
  explotaciones: () => request('/asesor/explotaciones'),
  tratamientos: () => request('/asesor/tratamientos'),
  parcelasDeExplotacion: (id) => request(`/asesor/explotaciones/${id}/parcelas`),
  recintosPorParcela:    (id) => request(`/asesor/parcelas/${id}/recintos`),
  tratamientosPorRecinto: (id) => request(`/asesor/recintos/${id}/tratamientos`),
  validarTratamiento: (id, validado, observaciones) =>
    request(`/asesor/tratamientos/${id}/validar`, {
      method: 'PATCH',
      body: JSON.stringify({ validado, observacionesValidador: observaciones }),
    }),
  crearExplotacion: (body) =>
    request('/asesor/explotaciones', { method: 'POST', body: JSON.stringify(body) }),
  crearParcela: (explotacionId, body) =>
    request(`/asesor/explotaciones/${explotacionId}/parcelas`, { method: 'POST', body: JSON.stringify(body) }),
  crearRecinto: (parcelaId, body) =>
    request(`/asesor/parcelas/${parcelaId}/recintos`, { method: 'POST', body: JSON.stringify(body) }),
  editarExplotacion: (id, body) =>
    request(`/asesor/explotaciones/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarExplotacion: (id) =>
    request(`/asesor/explotaciones/${id}`, { method: 'DELETE' }),
  editarParcela: (id, body) =>
    request(`/asesor/parcelas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarParcela: (id) =>
    request(`/asesor/parcelas/${id}`, { method: 'DELETE' }),
  editarRecinto: (id, body) =>
    request(`/asesor/recintos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarRecinto: (id) =>
    request(`/asesor/recintos/${id}`, { method: 'DELETE' }),
  explotacionesPorGranjero: (granjeroId) => request(`/asesor/granjeros/${granjeroId}/explotaciones`),
  tratamientosPorExplotacion: (explotacionId) => request(`/asesor/explotaciones/${explotacionId}/tratamientos`),
  tratamientosPorParcela: (parcelaId) => request(`/asesor/parcelas/${parcelaId}/tratamientos`),
  getPerfil: () => request('/asesor/perfil'),
  actualizarPerfil: (body) =>
    request('/asesor/perfil', { method: 'PUT', body: JSON.stringify(body) }),
}
