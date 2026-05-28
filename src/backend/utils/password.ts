// Password generation utility

export function generatePassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function formatPhoneNumber(phone: string): string {
  // Remove non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading 0 and add 62 (Indonesia country code)
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  
  // If doesn't start with 62, add it
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
}

export function maskPassword(password: string): string {
  return '*'.repeat(password.length);
}

// Example: generatePassword() -> "aB3dE5fG"
// Example: formatPhoneNumber("083844570735") -> "6283844570735"
// Example: formatPhoneNumber("+6283844570735") -> "6283844570735"
