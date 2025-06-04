import { useEffect } from 'react';
import { Client } from '@stomp/stompjs';

const MetricasWebSocketListener = ({ onNuevaNotificacion }) => {
  useEffect(() => {
    const client = new Client({
      brokerURL: 'ws://34.123.227.162:8080/ws', // URL directa ws://
      reconnectDelay: 5000,
      debug: (str) => {
        console.log('[STOMP]', str);
      },
      onConnect: () => {
        console.log('Conectado a WebSocket para notificaciones');

        client.subscribe('/topic/nueva-aprobada', (message) => {
          const body = message.body;
          console.log('Notificación recibida:', body);
          if (onNuevaNotificacion) {
            onNuevaNotificacion(body);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [onNuevaNotificacion]);

  return null;
};

export default MetricasWebSocketListener;
