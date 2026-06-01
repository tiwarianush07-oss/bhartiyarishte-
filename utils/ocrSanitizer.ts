export interface OCRData {
  full_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  age?: number | string;
  height?: string;
  address?: string;
  city?: string;
  state?: string;
  religion?: string;
  caste?: string;
  education?: string;
  profession?: string;
  marital_status?: string;
  confidenceScore?: number;
}

/**
 * Sanitizes and normalizes the OCR JSON payload to prevent
 * database corruption from malformed AI responses.
 */
export function sanitizeOCRData(rawData: any): OCRData {
  if (!rawData || typeof rawData !== 'object') {
    return { confidenceScore: 0 };
  }

  const cleanString = (val: any) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null' || trimmed === '') {
        return undefined;
      }
      return trimmed;
    }
    return undefined;
  };

  const cleanNumber = (val: any) => {
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  const sanitized: OCRData = {
    full_name: cleanString(rawData.full_name),
    email: cleanString(rawData.email),
    phone: cleanString(rawData.phone),
    gender: cleanString(rawData.gender),
    dob: cleanString(rawData.dob),
    age: cleanNumber(rawData.age),
    height: cleanString(rawData.height),
    address: cleanString(rawData.address),
    city: cleanString(rawData.city),
    state: cleanString(rawData.state),
    religion: cleanString(rawData.religion),
    caste: cleanString(rawData.caste),
    education: cleanString(rawData.education),
    profession: cleanString(rawData.profession),
    marital_status: cleanString(rawData.marital_status),
  };

  // Calculate a basic confidence score based on essential fields found
  let score = 0;
  if (sanitized.full_name) score += 30;
  if (sanitized.gender) score += 10;
  if (sanitized.dob || sanitized.age) score += 20;
  if (sanitized.phone || sanitized.email) score += 20;
  if (sanitized.religion || sanitized.caste) score += 10;
  if (sanitized.education || sanitized.profession) score += 10;

  sanitized.confidenceScore = score;

  return sanitized;
}
