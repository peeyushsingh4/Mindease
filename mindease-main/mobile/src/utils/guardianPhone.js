export const GUARDIAN_PHONE_DIGITS = 10;

export const sanitizeGuardianPhoneInput = (value) => String(value || '').replace(/\D/g, '').slice(0, GUARDIAN_PHONE_DIGITS);

export const isValidGuardianPhone = (value) => sanitizeGuardianPhoneInput(value).length === GUARDIAN_PHONE_DIGITS;
