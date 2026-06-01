export const mapAuthError = (errorMsg: string | undefined): string => {
  if (!errorMsg) return 'An unexpected error occurred. Please try again.';

  const msg = errorMsg.toLowerCase();

  // Database / Trigger errors (usually 500s)
  if (msg.includes('database error saving new user') || msg.includes('500')) {
    return 'Our servers are currently synchronizing. Please try again in a few moments.';
  }

  // Already exists
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return 'This phone number or email is already registered. Please sign in instead.';
  }

  // Invalid credentials
  if (msg.includes('invalid login credentials') || msg.includes('invalid email')) {
    return 'Incorrect email or password. Please check your credentials.';
  }

  // Network/Session
  if (msg.includes('failed to fetch') || msg.includes('network error')) {
    return 'Internet connection unstable. Please check your connection and retry.';
  }
  if (msg.includes('session expired') || msg.includes('jwt expired')) {
    return 'Session expired. Please login again to continue.';
  }

  // OCR/Uploads
  if (msg.includes('upload failed')) {
    return 'Upload failed. Please check your connection and retry.';
  }
  if (msg.includes('process image clearly')) {
    return 'Could not process image clearly. Please ensure the image is bright and legible.';
  }

  // Default fallback
  return errorMsg;
};
