/**
 * Validate username format for user creation
 * @param username - The username to validate
 * @param t - Translation function
 * @returns Object with validation result and error message
 */
export const validateUsername = (
  username: string,
  t: (key: string) => string
): { isValid: boolean; error: string } => {
  const trimmedUsername = username.trim();
  
  // Check if empty
  if (!trimmedUsername) {
    return { isValid: false, error: t('userManagement.errors.usernameEmpty') };
  }
  
  // Check minimum length (more than 6 characters means at least 7)
  if (trimmedUsername.length <= 6) {
    return { isValid: false, error: t('userManagement.errors.usernameTooShort') };
  }
  
  // Check if starts with alphabet
  if (!/^[a-zA-Z]/.test(trimmedUsername)) {
    return { isValid: false, error: t('userManagement.errors.usernameMustStartWithLetter') };
  }
  
  // Check if contains only alphanumeric characters (no spaces or special characters)
  if (!/^[a-zA-Z0-9]+$/.test(trimmedUsername)) {
    return { isValid: false, error: t('userManagement.errors.usernameInvalidCharacters') };
  }
  
  return { isValid: true, error: '' };
};

/**
 * Sanitize username to ensure it can be used in email
 * @param username - The username to sanitize
 * @returns Sanitized username
 */
export const sanitizeUsername = (username: string): string => {
  return username.trim().toLowerCase();
};
