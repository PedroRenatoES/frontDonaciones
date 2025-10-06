import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleSecurity } from '../hooks/useSimpleSecurity';

/**
 * Componente para proteger rutas según roles de usuario (OWASP A01)
 */
const SecureRoute = ({ 
  children, 
  requiredRole = null, 
  allowedRoles = null,
  fallbackPath = '/login',
  showAccessDenied = true 
}) => {
  const { 
    isAuthenticated, 
    sessionValid, 
    checkAccess, 
    canAccessRoute,
    logActivity 
  } = useSimpleSecurity();

  // Verificar autenticación
  if (!isAuthenticated || !sessionValid) {
    // Solo loggear si no estamos ya en la página de login
    if (window.location.pathname !== '/login') {
      logActivity('ROUTE_ACCESS_DENIED_NOT_AUTHENTICATED', {
        path: window.location.pathname
      });
    }
    return <Navigate to={fallbackPath} replace />;
  }

  // Verificar acceso por rol específico
  if (requiredRole !== null) {
    const hasAccess = checkAccess(requiredRole);
    if (!hasAccess) {
      logActivity('ROUTE_ACCESS_DENIED_INSUFFICIENT_ROLE', {
        path: window.location.pathname,
        requiredRole
      });
      
      if (showAccessDenied) {
        return (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              maxWidth: '400px'
            }}>
              <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
                🔒 Acceso Denegado
              </h2>
              <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                No tienes permisos para acceder a esta sección.
              </p>
              <button 
                onClick={() => window.history.back()}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Volver
              </button>
            </div>
          </div>
        );
      }
      
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar acceso por lista de roles permitidos
  if (allowedRoles && Array.isArray(allowedRoles)) {
    const hasAccess = allowedRoles.some(role => checkAccess(role));
    if (!hasAccess) {
      logActivity('ROUTE_ACCESS_DENIED_NOT_IN_ALLOWED_ROLES', {
        path: window.location.pathname,
        allowedRoles
      });
      
      if (showAccessDenied) {
        return (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              maxWidth: '400px'
            }}>
              <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
                🔒 Acceso Denegado
              </h2>
              <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                No tienes permisos para acceder a esta sección.
              </p>
              <button 
                onClick={() => window.history.back()}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Volver
              </button>
            </div>
          </div>
        );
      }
      
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Verificar acceso por ruta
  const currentPath = window.location.pathname;
  if (!canAccessRoute(currentPath)) {
    logActivity('ROUTE_ACCESS_DENIED_PATH_NOT_ALLOWED', {
      path: currentPath
    });
    
    if (showAccessDenied) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            maxWidth: '400px'
          }}>
            <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
              🔒 Acceso Denegado
            </h2>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              No tienes permisos para acceder a esta sección.
            </p>
            <button 
              onClick={() => window.history.back()}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
    
    return <Navigate to={fallbackPath} replace />;
  }

  // Acceso permitido
  logActivity('ROUTE_ACCESS_GRANTED', {
    path: currentPath
  });

  return children;
};

export default SecureRoute;
