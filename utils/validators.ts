/**
 * utils/validators.ts
 * 
 * Input validation functions.
 */

/**
 * Validate Employee ID — huruf dan nombor sahaja, max 10 aksara.
 */
export function validateEmployeeId(id: string): { valid: boolean; error?: string } {
  if (!id || id.trim().length === 0) {
    return { valid: false, error: 'Sila masukkan ID pekerja' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(id)) {
    return { valid: false, error: 'ID pekerja mestilah gabungan huruf atau nombor' };
  }

  if (id.length > 10) {
    return { valid: false, error: 'ID pekerja maksimum 10 aksara' };
  }

  return { valid: true };
}

/**
 * Validate PIN — 6 digit sahaja.
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin || pin.trim().length === 0) {
    return { valid: false, error: 'Sila masukkan PIN' };
  }

  if (!/^\d{6}$/.test(pin)) {
    return { valid: false, error: 'PIN mestilah 6 digit' };
  }

  return { valid: true };
}

/**
 * Validate semua login fields sekaligus.
 */
export function validateLoginForm(employeeId: string, pin: string): { 
  valid: boolean; 
  errors: { employeeId?: string; pin?: string } 
} {
  const idResult = validateEmployeeId(employeeId);
  const pinResult = validatePin(pin);

  return {
    valid: idResult.valid && pinResult.valid,
    errors: {
      ...(idResult.error ? { employeeId: idResult.error } : {}),
      ...(pinResult.error ? { pin: pinResult.error } : {}),
    },
  };
}
