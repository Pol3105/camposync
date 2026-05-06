export const MOCK_USUARIO = {
  nombre: 'Juan García López',
  email: 'juan.garcia@finca.es',
  nif: null,
  nombreLegal: null,
  createdAt: '2024-11-15',
}

export const MOCK_EXPLOTACIONES = [
  { id: 1, nombre: 'Finca El Olivo', orientacion: 'OL', superficie: 12.4, numParcelas: 2, municipio: 'Palma del Río' },
  { id: 2, nombre: 'La Vega Norte',  orientacion: 'CE', superficie: 8.1,  numParcelas: 1, municipio: 'Córdoba' },
]

export const MOCK_PARCELAS = {
  1: [
    { id: 10, refCatastral: '14-077-0-0-1-80', municipio: 'Palma del Río', poligono: 5, parcelaSigpac: 80, numRecintos: 2 },
    { id: 11, refCatastral: '14-077-0-0-2-40', municipio: 'Palma del Río', poligono: 6, parcelaSigpac: 40, numRecintos: 1 },
  ],
  2: [
    { id: 20, refCatastral: '14-058-0-0-1-10', municipio: 'Córdoba', poligono: 3, parcelaSigpac: 10, numRecintos: 3 },
  ],
}

export const MOCK_RECINTOS = {
  10: [
    { id: 100, numero: 1, cultivo: 'Olivar',      uso: 'OL', superficie: 3.2, pendientes: 1 },
    { id: 101, numero: 2, cultivo: 'Olivar',      uso: 'OL', superficie: 2.8, pendientes: 0 },
  ],
  11: [
    { id: 110, numero: 1, cultivo: 'Olivar',      uso: 'OL', superficie: 4.0, pendientes: 0 },
  ],
  20: [
    { id: 200, numero: 1, cultivo: 'Trigo blando', uso: 'CE', superficie: 2.5, pendientes: 2 },
    { id: 201, numero: 2, cultivo: 'Cebada',       uso: 'CE', superficie: 3.0, pendientes: 0 },
    { id: 202, numero: 3, cultivo: 'Girasol',      uso: 'FS', superficie: 2.6, pendientes: 1 },
  ],
}

export const MOCK_TRATAMIENTOS = [
  { id: 1, fecha: '2025-05-02', explotacion: 'Finca El Olivo', refCatastral: '14-077-0-0-1-80', recintoNum: 1, producto: 'Roundup Max',    dosis: 2.5, unidades: 'L/ha',  validado: false, plaga: 'Malas hierbas'   },
  { id: 2, fecha: '2025-04-28', explotacion: 'Finca El Olivo', refCatastral: '14-077-0-0-1-80', recintoNum: 2, producto: 'Karate Zeon',    dosis: 0.3, unidades: 'L/ha',  validado: true,  plaga: 'Prays del olivo' },
  { id: 3, fecha: '2025-04-20', explotacion: 'La Vega Norte',  refCatastral: '14-058-0-0-1-10', recintoNum: 1, producto: 'Funguicida Pro', dosis: 1.5, unidades: 'kg/ha', validado: true,  plaga: 'Oidio'           },
  { id: 4, fecha: '2025-04-10', explotacion: 'La Vega Norte',  refCatastral: '14-058-0-0-1-10', recintoNum: 3, producto: 'Herbicida 2,4-D',dosis: 1.2, unidades: 'L/ha',  validado: false, plaga: 'Malas hierbas'   },
]
