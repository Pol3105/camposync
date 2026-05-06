/**
 * Validaciones compartidas de formato de identificación fiscal española.
 *
 * NIF/DNI: 8 dígitos + 1 letra mayúscula  (ej. 12345678A)
 * NIE:     X/Y/Z + 7 dígitos + 1 letra    (ej. X1234567A)
 * CIF:     1 letra + 7 dígitos + 1 letra/dígito (ej. B12345678)
 */

/** Valida DNI español (formato más común en explotaciones agrícolas persona física). */
export function validateNif(value) {
  return /^\d{8}[A-Z]$/.test(value)
}

/**
 * Mensaje de error para NIF inválido.
 * Devuelve string vacío si el valor es válido o está vacío.
 */
export function nifError(value) {
  if (!value || value.trim() === '') return ''
  return validateNif(value.trim())
    ? ''
    : 'Formato inválido. Debe ser 8 números y 1 letra mayúscula (ej. 12345678A)'
}
