const GUARDIAN_PHONE_DIGITS = 10;

function normalizeGuardianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === GUARDIAN_PHONE_DIGITS) {
    return digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return '';
}

function isValidGuardianPhone(value) {
  return normalizeGuardianPhone(value).length === GUARDIAN_PHONE_DIGITS;
}

function toGuardianPhoneE164(value) {
  const digits = normalizeGuardianPhone(value);
  return digits ? `+91${digits}` : '';
}

module.exports = {
  GUARDIAN_PHONE_DIGITS,
  normalizeGuardianPhone,
  isValidGuardianPhone,
  toGuardianPhoneE164,
};
