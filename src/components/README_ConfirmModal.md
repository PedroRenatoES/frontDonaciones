# Sistema de Confirmación Personalizado

## Descripción
Se ha reemplazado el sistema de alerts nativos del navegador (`window.confirm()` y `alert()`) con un sistema de modales personalizados que proporciona una mejor experiencia de usuario.

## Componentes

### ConfirmModal
Componente de modal personalizado que reemplaza los alerts nativos.

**Props:**
- `show`: boolean - Controla si el modal está visible
- `title`: string - Título del modal
- `message`: string - Mensaje a mostrar
- `type`: string - Tipo de modal ("confirm", "alert", "success", "error")
- `confirmText`: string - Texto del botón de confirmación
- `cancelText`: string - Texto del botón de cancelación
- `onConfirm`: function - Callback cuando se confirma
- `onCancel`: function - Callback cuando se cancela

### useConfirmModal Hook
Hook personalizado que facilita el uso de los modales de confirmación.

**Métodos:**
- `showConfirm(options)`: Muestra un modal de confirmación
- `showAlert(options)`: Muestra un modal de alerta
- `hideModal()`: Oculta el modal

## Uso

### 1. Importar el hook y componente
```jsx
import ConfirmModal from './ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
```

### 2. Usar el hook en el componente
```jsx
function MiComponente() {
  const { modalState, showConfirm, showAlert } = useConfirmModal();
  
  // ... resto del código
}
```

### 3. Reemplazar window.confirm()
**Antes:**
```jsx
if (window.confirm('¿Estás seguro?')) {
  // hacer algo
}
```

**Después:**
```jsx
const confirmed = await showConfirm({
  title: "Confirmar acción",
  message: "¿Estás seguro?",
  type: "confirm"
});

if (confirmed) {
  // hacer algo
}
```

### 4. Reemplazar alert()
**Antes:**
```jsx
alert('Operación exitosa');
```

**Después:**
```jsx
await showAlert({
  title: "Éxito",
  message: "Operación exitosa",
  type: "success"
});
```

### 5. Agregar el componente al JSX
```jsx
return (
  <div>
    {/* Tu contenido */}
    
    <ConfirmModal
      show={modalState.show}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      onConfirm={modalState.onConfirm}
      onCancel={modalState.onCancel}
    />
  </div>
);
```

## Tipos de Modal

### confirm
Modal con botones "Aceptar" y "Cancelar". Usado para confirmaciones.

### alert
Modal con solo botón "Aceptar". Usado para alertas importantes.

### success
Modal verde con ícono de éxito. Usado para operaciones exitosas.

### error
Modal rojo con ícono de error. Usado para mostrar errores.

## Ejemplos de Uso

### Confirmación de eliminación
```jsx
const handleDelete = async (id) => {
  const confirmed = await showConfirm({
    title: "Eliminar elemento",
    message: "¿Estás seguro de que deseas eliminar este elemento?",
    type: "alert"
  });

  if (!confirmed) return;

  try {
    await axios.delete(`/api/items/${id}`);
    await showAlert({
      title: "Éxito",
      message: "Elemento eliminado correctamente",
      type: "success"
    });
  } catch (error) {
    await showAlert({
      title: "Error",
      message: "No se pudo eliminar el elemento",
      type: "error"
    });
  }
};
```

### Mensaje de éxito
```jsx
await showAlert({
  title: "Operación exitosa",
  message: "Los datos se han guardado correctamente",
  type: "success"
});
```

### Mensaje de error
```jsx
await showAlert({
  title: "Error",
  message: "No se pudo conectar con el servidor",
  type: "error"
});
```

## Archivos Actualizados

Los siguientes archivos han sido actualizados para usar el nuevo sistema:

- `Inventory.jsx` - Confirmaciones de eliminación de donaciones
- `Almacen.jsx` - Confirmación de eliminación de almacenes
- `Users.jsx` - Confirmaciones de usuarios y alertas
- `Donors.jsx` - Confirmación de eliminación de donantes

## Beneficios

1. **Mejor UX**: Modales personalizados con mejor diseño
2. **Consistencia**: Todos los modales tienen el mismo estilo
3. **Responsive**: Se adaptan a diferentes tamaños de pantalla
4. **Accesibilidad**: Mejor soporte para lectores de pantalla
5. **Flexibilidad**: Diferentes tipos de modal según el contexto
6. **Animaciones**: Transiciones suaves para mejor experiencia
