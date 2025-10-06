import { useState, useEffect, useCallback } from 'react';
import { 
  validateAndSanitize, 
  validateAccessControl, 
  validatePassword, 
  validateFileUpload,
  validateSession,
  logSecurityEvent
} from '../utils/security';
import { getSchema as getValidationSchema } from '../utils/validationSchemas';

/**
 * Hook de seguridad OWASP para componentes React
 */
export const useSecurity = () => {
  const [securityState, setSecurityState] = useState({
    isAuthenticated: false,
    userRole: null,
    sessionValid: false,
    lastActivity: null
  });

  // Función para logout seguro
  const handleLogout = useCallback(() => {
    logSecurityEvent('USER_LOGOUT', {
      userRole: securityState.userRole
    });
    
    localStorage.clear();
    setSecurityState({
      isAuthenticated: false,
      userRole: null,
      sessionValid: false,
      lastActivity: null
    });
    
    window.location.href = '/login';
  }, [securityState.userRole]);

  // Verificar sesión al montar el componente
  useEffect(() => {
    const checkSession = () => {
      const isValid = validateSession();
      const userRole = localStorage.getItem('rol');
      const isAuth = !!localStorage.getItem('token');

      setSecurityState(prev => ({
        ...prev,
        isAuthenticated: isAuth,
        userRole: userRole ? parseInt(userRole) : null,
        sessionValid: isValid,
        lastActivity: new Date()
      }));

      if (isAuth && !isValid) {
        logSecurityEvent('SESSION_INVALID', { userRole });
        localStorage.clear();
        window.location.href = '/login';
      }
    };

    checkSession();
    
    // Verificar sesión cada 5 minutos
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []); // Sin dependencias para evitar re-renders infinitos

  // Función para validar acceso
  const checkAccess = useCallback((requiredRole) => {
    if (!securityState.isAuthenticated) {
      logSecurityEvent('ACCESS_DENIED_NOT_AUTHENTICATED');
      return false;
    }

    const hasAccess = validateAccessControl(securityState.userRole, requiredRole);
    
    if (!hasAccess) {
      logSecurityEvent('ACCESS_DENIED_INSUFFICIENT_ROLE', {
        userRole: securityState.userRole,
        requiredRole
      });
    }

    return hasAccess;
  }, [securityState.isAuthenticated, securityState.userRole]);

  // Función para validar y sanitizar datos de formulario
  const validateForm = useCallback((data, schemaType) => {
    try {
      const schema = getValidationSchema(schemaType);
      const result = validateAndSanitize(data, schema);
      
      if (!result.isValid) {
        logSecurityEvent('FORM_VALIDATION_FAILED', {
          schemaType,
          errors: result.errors
        });
      }
      
      return result;
    } catch (error) {
      logSecurityEvent('FORM_VALIDATION_ERROR', {
        schemaType,
        error: error.message
      });
      return {
        data: {},
        isValid: false,
        errors: [error.message]
      };
    }
  }, []);

  // Función para validar contraseña
  const validatePasswordSecurity = useCallback((password) => {
    const result = validatePassword(password);
    
    if (!result.isValid) {
      logSecurityEvent('WEAK_PASSWORD_ATTEMPT', {
        errors: result.errors
      });
    }
    
    return result;
  }, []);

  // Función para validar archivos
  const validateFile = useCallback((file, allowedTypes) => {
    try {
      const result = validateFileUpload(file, allowedTypes);
      
      if (!result.isValid) {
        logSecurityEvent('INVALID_FILE_UPLOAD', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          errors: result.errors
        });
      }
      
      return result;
    } catch (error) {
      logSecurityEvent('FILE_VALIDATION_ERROR', {
        fileName: file.name,
        error: error.message
      });
      return {
        isValid: false,
        errors: [error.message]
      };
    }
  }, []);

  // Función para registrar actividad de seguridad
  const logActivity = useCallback((event, details = {}) => {
    logSecurityEvent(event, {
      ...details,
      userRole: securityState.userRole,
      timestamp: new Date().toISOString()
    });
  }, [securityState.userRole]);

  // Función para verificar si el usuario puede acceder a una ruta
  const canAccessRoute = useCallback((route) => {
    const routePermissions = {
      '/users': 1, // Solo admin
      '/almacenes': 1, // Solo admin
      '/dashboard': [1, 2, 3], // Todos los roles
      '/inventory': [1, 2, 3], // Todos los roles
      '/add-donation': [1, 2], // Admin y voluntario
      '/donors': [1, 2], // Admin y voluntario
      '/send-donations': [1, 2], // Admin y voluntario
      '/history': [1, 2, 3], // Todos los roles
      '/campains': [1, 2], // Admin y voluntario
      '/help-request': [1, 2, 3] // Todos los roles
    };

    const requiredRoles = routePermissions[route];
    if (!requiredRoles) return true; // Ruta pública

    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(securityState.userRole);
    }

    return securityState.userRole === requiredRoles;
  }, [securityState.userRole]);

  return {
    // Estado de seguridad
    ...securityState,
    
    // Funciones de validación
    checkAccess,
    validateForm,
    validatePassword: validatePasswordSecurity,
    validateFile,
    canAccessRoute,
    
    // Funciones de control
    handleLogout,
    logActivity,
    
    // Utilidades
    isAdmin: securityState.userRole === 1,
    isVolunteer: securityState.userRole === 2,
    isWarehouseManager: securityState.userRole === 3
  };
};
