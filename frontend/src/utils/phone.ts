export function formatIndonesianPhone(phone: string | null | undefined): string {
  if (!phone) return '';

  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  const digits = cleaned.substring(2);

  if (digits.length <= 3) {
    return '+62 ' + digits;
  } else if (digits.length <= 7) {
    return '+62 ' + digits.substring(0, 3) + '-' + digits.substring(3);
  } else {
    return '+62 ' + digits.substring(0, 3) + '-' + digits.substring(3, 7) + '-' + digits.substring(7, 11);
  }
}

export function formatPhoneInput(value: string): { formatted: string } {
  if (!value || value.trim().length === 0) {
    return { formatted: '' };
  }

  let cleaned = value.replace(/[^\d+]/g, '');

  if (cleaned.length === 0) {
    return { formatted: '' };
  }

  let digits = cleaned.replace(/[^\d]/g, '');

  if (digits.length === 0) {
    return { formatted: '' };
  }

  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  if (digits.startsWith('62')) {
    digits = digits.substring(2);
  }

  if (digits.length === 0) {
    return { formatted: '' };
  }

  digits = digits.substring(0, 11);

  let formatted = '+62';
  if (digits.length > 0) {
    formatted += ' ' + digits.substring(0, 3);
    if (digits.length > 3) {
      formatted += '-' + digits.substring(3, 7);
      if (digits.length > 7) {
        formatted += '-' + digits.substring(7, 11);
      }
    }
  }

  return { formatted };
}

export function getRawPhone(formatted: string | null | undefined): string {
  if (!formatted) return '';
  
  let cleaned = formatted.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }

  return '+' + cleaned;
}

