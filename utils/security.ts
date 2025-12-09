
// Simple hash function to simulate generating a unique ID based on browser properties
export const getDeviceId = (): string => {
  const navigatorInfo = window.navigator.userAgent + window.navigator.language + window.screen.width;
  let hash = 0;
  for (let i = 0; i < navigatorInfo.length; i++) {
    const char = navigatorInfo.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Format as AAAA-BBBB-CCCC
  const raw = Math.abs(hash).toString(16).toUpperCase().padEnd(12, '0');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
};

// THE SECRET KEY (Only you know this)
const SECRET_SALT = "NIZAM_HR_SECRET_2025";

// Helper: Convert Date to Hex String (Days since epoch)
const dateToHex = (days: number): string => {
  return days.toString(16).toUpperCase();
};

// Helper: Convert Hex String to Date (Days since epoch)
const hexToDate = (hex: string): number => {
  return parseInt(hex, 16);
};

// Generate License Key based on Device ID + Duration
export const generateLicenseKey = (deviceId: string, durationInDays: number): string => {
  // 1. Calculate Expiry Date (Days since epoch)
  const today = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const expiryDays = today + durationInDays;
  const expiryHex = dateToHex(expiryDays);

  // 2. Create Signature (Hash of DeviceID + Expiry + Secret)
  const combo = deviceId + expiryHex + SECRET_SALT;
  let hash = 0;
  for (let i = 0; i < combo.length; i++) {
    const char = combo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const signature = Math.abs(hash).toString(16).toUpperCase().padEnd(8, 'X');
  
  // Format: NZM-[EXPIRY]-[SIGNATURE]
  return `NZM-${expiryHex}-${signature}`;
};

// Validate License Key
// Returns object: { isValid: boolean, message: string, expiryDate?: string }
export const validateLicenseKey = (key: string, deviceId: string): { isValid: boolean, message: string, expiryDate?: string } => {
  try {
    const parts = key.split('-');
    if (parts.length !== 3 || parts[0] !== 'NZM') {
      return { isValid: false, message: 'تنسيق الكود غير صحيح' };
    }

    const expiryHex = parts[1];
    const providedSignature = parts[2];

    // 1. Re-generate Signature to verify authenticity
    const combo = deviceId + expiryHex + SECRET_SALT;
    let hash = 0;
    for (let i = 0; i < combo.length; i++) {
      const char = combo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const expectedSignature = Math.abs(hash).toString(16).toUpperCase().padEnd(8, 'X');

    if (providedSignature !== expectedSignature) {
      return { isValid: false, message: 'الكود غير صالح لهذا الجهاز' };
    }

    // 2. Check Expiry Date
    const expiryDays = hexToDate(expiryHex);
    const currentDays = Math.floor(Date.now() / (1000 * 60 * 60 * 24));

    // Calculate readable date
    const dateObj = new Date(expiryDays * 24 * 60 * 60 * 1000);
    const readableDate = dateObj.toISOString().split('T')[0];

    if (currentDays > expiryDays) {
      return { isValid: false, message: `انتهت صلاحية هذا الكود في ${readableDate}`, expiryDate: readableDate };
    }

    return { isValid: true, message: 'تم التفعيل بنجاح', expiryDate: readableDate };

  } catch (e) {
    return { isValid: false, message: 'خطأ في معالجة الكود' };
  }
};
