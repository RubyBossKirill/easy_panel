// Утилиты для работы с криптографией в браузере

// Создание HMAC подписи используя Web Crypto API
export async function createHmacSignature(message: string, secret: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Ошибка создания HMAC подписи:', error);
    return '';
  }
}

// Создание SHA-256 хеша
export async function createSha256Hash(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Ошибка создания SHA-256 хеша:', error);
    return '';
  }
}

// Генерация случайного ключа
export function generateRandomKey(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Кодирование в base64
export function encodeBase64(data: string): string {
  return btoa(data);
}

// Декодирование из base64
export function decodeBase64(data: string): string {
  return atob(data);
}

// Создание безопасного пароля
export function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.getRandomValues(new Uint8Array(1))[0] % charset.length;
    password += charset[randomIndex];
  }
  
  return password;
}

// Проверка силы пароля
export function checkPasswordStrength(password: string): {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else feedback.push('Пароль должен содержать минимум 8 символов');
  
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Добавьте строчные буквы');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Добавьте заглавные буквы');
  
  if (/[0-9]/.test(password)) score++;
  else feedback.push('Добавьте цифры');
  
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Добавьте специальные символы');
  
  return {
    score,
    feedback,
    isStrong: score >= 4
  };
}

// Глобальные функции для консоли браузера (только в режиме разработки)
if (process.env.NODE_ENV === 'development') {
  (window as any).cryptoUtils = {
    createHmacSignature,
    createSha256Hash,
    generateRandomKey,
    encodeBase64,
    decodeBase64,
    generateSecurePassword,
    checkPasswordStrength
  };
  
  console.log('🔐 Crypto Utils доступны в консоли:');
  console.log('  - cryptoUtils.createHmacSignature(message, secret)');
  console.log('  - cryptoUtils.createSha256Hash(data)');
  console.log('  - cryptoUtils.generateRandomKey(length)');
  console.log('  - cryptoUtils.generateSecurePassword(length)');
  console.log('  - cryptoUtils.checkPasswordStrength(password)');
} 