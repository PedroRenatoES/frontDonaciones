/**
 * Utilidades de Seguridad OWASP
 * Implementa validaciones y sanitización según OWASP Top 10
 */

// A01:2021 – Broken Access Control
export const validateAccessControl = (userRole, requiredRole) => {
  const roleHierarchy = {
    1: 'admin',      // Administrador
    2: 'voluntario', // Voluntario  
    3: 'almacenista' // Almacenista
  };

  const userRoleName = roleHierarchy[userRole];
  const requiredRoleName = roleHierarchy[requiredRole];

  if (!userRoleName || !requiredRoleName) {
    return false;
  }

  // Solo admin puede acceder a todo
  if (userRoleName === 'admin') return true;
  
  // Voluntario puede acceder a funciones básicas
  if (userRoleName === 'voluntario' && requiredRoleName !== 'admin') return true;
  
  // Almacenista solo puede acceder a funciones de almacén
  if (userRoleName === 'almacenista' && requiredRoleName === 'almacenista') return true;
  
  return false;
};

// A03:2021 – Injection Prevention
export const sanitizeInput = (input, type = 'string') => {
  if (input === null || input === undefined) return '';
  
  let sanitized = String(input).trim();
  
  // Remover caracteres peligrosos para inyección
  const dangerousChars = /[<>'"&;(){}[\]\\|`~!@#$%^*+=]/g;
  
  switch (type) {
    case 'string':
      // Permitir solo letras, números, espacios y algunos caracteres seguros
      sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_.,áéíóúñÁÉÍÓÚÑ]/g, '');
      break;
      
    case 'number':
      // Solo números
      sanitized = sanitized.replace(/[^0-9.-]/g, '');
      break;
      
    case 'email':
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitized)) {
        throw new Error('Formato de email inválido');
      }
      break;
      
    case 'phone':
      // Solo números, espacios, guiones y paréntesis
      sanitized = sanitized.replace(/[^0-9\s\-()]/g, '');
      break;
      
    case 'ci':
      // Solo números para cédula de identidad
      sanitized = sanitized.replace(/[^0-9]/g, '');
      break;
      
    case 'coordinates':
      // Solo números, puntos, comas y espacios para coordenadas
      sanitized = sanitized.replace(/[^0-9.,\s-]/g, '');
      break;
      
    default:
      // Sanitización básica
      sanitized = sanitized.replace(dangerousChars, '');
  }
  
  return sanitized;
};

// A03:2021 – SQL Injection Prevention
export const validateSQLInjection = (input) => {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'UNION', 'OR', 'AND', 'WHERE', 'FROM', 'TABLE', 'DATABASE',
    'SCRIPT', 'EXEC', 'EXECUTE', 'SP_', 'XP_', '--', '/*', '*/'
  ];
  
  const upperInput = input.toUpperCase();
  
  for (const keyword of sqlKeywords) {
    if (upperInput.includes(keyword)) {
      throw new Error(`Entrada no permitida: contiene palabra reservada "${keyword}"`);
    }
  }
  
  return true;
};

// A03:2021 – XSS Prevention
export const sanitizeHTML = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// A07:2021 – Identification and Authentication Failures
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// A07:2021 – Session Management
export const validateSession = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('usuario');
  
  if (!token || !user) {
    return false;
  }
  
  try {
    // Verificar si el token no ha expirado (formato JWT básico)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return false;
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      localStorage.clear();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validando sesión:', error);
    localStorage.clear();
    return false;
  }
};

// A05:2021 – Security Misconfiguration
export const validateFileUpload = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  const errors = [];
  
  // Validar tipo de archivo
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(', ')}`);
  }
  
  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    errors.push('El archivo es demasiado grande. Máximo 5MB permitido');
  }
  
  // Validar nombre del archivo
  const fileName = file.name.toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar'];
  
  for (const ext of dangerousExtensions) {
    if (fileName.endsWith(ext)) {
      errors.push('Tipo de archivo no permitido por seguridad');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// A09:2021 – Security Logging and Monitoring
export const logSecurityEvent = (event, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // En producción, esto debería enviarse a un servicio de logging
  console.warn('🔒 Security Event:', logEntry);
  
  // También guardar en localStorage para debugging
  const existingLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
  existingLogs.push(logEntry);
  
  // Mantener solo los últimos 100 logs
  if (existingLogs.length > 100) {
    existingLogs.splice(0, existingLogs.length - 100);
  }
  
  localStorage.setItem('securityLogs', JSON.stringify(existingLogs));
};

// A10:2021 – Server-Side Request Forgery (SSRF) Prevention
export const validateURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    
    // Solo permitir HTTP y HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Protocolo no permitido');
    }
    
    // Bloquear localhost y IPs privadas
    const hostname = parsedUrl.hostname.toLowerCase();
    const privateIPs = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '::ffff:127.0.0.1'
    ];
    
    if (privateIPs.includes(hostname)) {
      throw new Error('URL no permitida');
    }
    
    // Bloquear rangos de IP privadas
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./
    ];
    
    for (const range of privateRanges) {
      if (range.test(hostname)) {
        throw new Error('URL no permitida');
      }
    }
    
    return true;
  } catch (error) {
    throw new Error('URL inválida o no permitida');
  }
};

// Función principal de validación
export const validateAndSanitize = (data, schema) => {
  const sanitizedData = {};
  const errors = [];
  
  for (const [field, config] of Object.entries(schema)) {
    const value = data[field];
    
    try {
      // Validar requerido
      if (config.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field} es requerido`);
        continue;
      }
      
      // Si no es requerido y está vacío, usar valor por defecto
      if (!value || value.toString().trim() === '') {
        sanitizedData[field] = config.default || '';
        continue;
      }
      
      // Sanitizar entrada
      let sanitized = sanitizeInput(value, config.type);
      
      // Validar longitud
      if (config.minLength && sanitized.length < config.minLength) {
        errors.push(`${field} debe tener al menos ${config.minLength} caracteres`);
      }
      
      if (config.maxLength && sanitized.length > config.maxLength) {
        errors.push(`${field} no puede tener más de ${config.maxLength} caracteres`);
      }
      
      // Validar patrón
      if (config.pattern && !config.pattern.test(sanitized)) {
        errors.push(`${field} no tiene un formato válido`);
      }
      
      // Validar inyección SQL
      if (config.preventSQLInjection) {
        validateSQLInjection(sanitized);
      }
      
      sanitizedData[field] = sanitized;
      
    } catch (error) {
      errors.push(`${field}: ${error.message}`);
    }
  }
  
  return {
    data: sanitizedData,
    isValid: errors.length === 0,
    errors
  };
};
