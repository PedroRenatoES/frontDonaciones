import { useState, useEffect, useCallback } from 'react';
import { validateSession, logSecurityEvent } from '../utils/security';

/**
 * Hook de seguridad simplificado para evitar re-renders infinitos
 */
export const useSimpleSecurity = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [sessionValid, setSessionValid] = useState(false);

  // Verificar sesión una sola vez al montar
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('rol');
      const isValid = validateSession();

      setIsAuthenticated(!!token);
      setUserRole(role ? parseInt(role) : null);
      setSessionValid(isValid);

      if (token && !isValid) {
        logSecurityEvent('SESSION_INVALID', { role });
        localStorage.clear();
        window.location.href = '/login';
      }
    };

    checkSession();
  }, []); // Sin dependencias para evitar re-renders

  // Función para validar acceso
  const checkAccess = useCallback((requiredRole) => {
    if (!isAuthenticated) {
      return false;
    }

    const roleHierarchy = {
      1: 'admin',
      2: 'voluntario', 
      3: 'almacenista'
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
  }, [isAuthenticated, userRole]);

  // Función para verificar si puede acceder a una ruta
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
      return requiredRoles.includes(userRole);
    }

    return userRole === requiredRoles;
  }, [userRole]);

  // Función para logout
  const handleLogout = useCallback(() => {
    logSecurityEvent('USER_LOGOUT', { userRole });
    localStorage.clear();
    setIsAuthenticated(false);
    setUserRole(null);
    setSessionValid(false);
    window.location.href = '/login';
  }, [userRole]);

  // Función para loggear actividades
  const logActivity = useCallback((event, details = {}) => {
    logSecurityEvent(event, {
      ...details,
      userRole,
      timestamp: new Date().toISOString()
    });
  }, [userRole]);

  return {
    isAuthenticated,
    userRole,
    sessionValid,
    checkAccess,
    canAccessRoute,
    handleLogout,
    logActivity,
    isAdmin: userRole === 1,
    isVolunteer: userRole === 2,
    isWarehouseManager: userRole === 3
  };
};
