/**
 * Email validation function
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
export const isValidEmail = (email) => {
    if (!email) return false;
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Password strength validation
   * 
   * @param {string} password - Password to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with strength score and feedback
   */
  export const validatePassword = (password, options = {}) => {
    // Default options
    const defaultOptions = {
      minLength: 6,
      requireLetter: true,
      requireNumber: true,
      requireSymbol: false,
      ...options
    };
    
    if (!password) {
      return {
        isValid: false,
        score: 0,
        feedback: 'Senha é obrigatória'
      };
    }
    
    // Check minimum length
    if (password.length < defaultOptions.minLength) {
      return {
        isValid: false,
        score: 1,
        feedback: `A senha deve ter pelo menos ${defaultOptions.minLength} caracteres`
      };
    }
    
    let score = 2; // Start with score 2 if minimum length is met
    let feedback = '';
    
    // Check for letters
    if (defaultOptions.requireLetter && !/[a-zA-Z]/.test(password)) {
      feedback = 'A senha deve conter pelo menos uma letra';
      return { isValid: false, score, feedback };
    } else {
      score += 1;
    }
    
    // Check for numbers
    if (defaultOptions.requireNumber && !/\d/.test(password)) {
      feedback = 'A senha deve conter pelo menos um número';
      return { isValid: false, score, feedback };
    } else {
      score += 1;
    }
    
    // Check for symbols
    if (defaultOptions.requireSymbol && !/[^a-zA-Z0-9]/.test(password)) {
      feedback = 'A senha deve conter pelo menos um símbolo';
      return { isValid: false, score, feedback };
    } else if (defaultOptions.requireSymbol) {
      score += 1;
    }
    
    // Additional strength checks
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    
    // Cap score at 5
    score = Math.min(score, 5);
    
    // Generate feedback based on score
    switch (score) {
      case 2:
        feedback = 'Muito fraca';
        break;
      case 3:
        feedback = 'Fraca';
        break;
      case 4:
        feedback = 'Boa';
        break;
      case 5:
        feedback = 'Forte';
        break;
      default:
        feedback = 'Fraca';
    }
    
    return {
      isValid: true,
      score,
      feedback
    };
  };
  
  /**
   * Validate form field based on type
   * 
   * @param {string} type - Field type (email, password, text, etc)
   * @param {string} value - Field value
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  export const validateField = (type, value, options = {}) => {
    switch (type) {
      case 'email':
        return {
          isValid: isValidEmail(value),
          feedback: isValidEmail(value) ? '' : 'Email inválido'
        };
      case 'password':
        return validatePassword(value, options);
      case 'text':
        if (options.required && !value) {
          return {
            isValid: false,
            feedback: 'Este campo é obrigatório'
          };
        }
        if (options.minLength && value.length < options.minLength) {
          return {
            isValid: false,
            feedback: `Este campo deve ter pelo menos ${options.minLength} caracteres`
          };
        }
        if (options.maxLength && value.length > options.maxLength) {
          return {
            isValid: false,
            feedback: `Este campo deve ter no máximo ${options.maxLength} caracteres`
          };
        }
        return { isValid: true, feedback: '' };
      default:
        return { isValid: true, feedback: '' };
    }
  };