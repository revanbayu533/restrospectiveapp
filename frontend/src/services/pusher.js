import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || '00687bd774bc433def89';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap1';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let pusherInstance = null;

/**
 * Mendapatkan singleton instance Pusher client
 */
export function getPusherClient() {
  if (pusherInstance) {
    return pusherInstance;
  }

  pusherInstance = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
    forceTLS: true,
    authEndpoint: `${API_BASE_URL}/pusher/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
      },
    },
    // Handler otorisasi kustom untuk memastikan token selalu terupdate
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          const token = localStorage.getItem('access_token') || '';
          fetch(`${API_BASE_URL}/pusher/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Auth failed: ${res.status}`);
              }
              return res.json();
            })
            .then((data) => {
              callback(null, data);
            })
            .catch((err) => {
              console.warn('[Pusher Auth Error]', err.message);
              callback(err, null);
            });
        },
      };
    },
  });

  // Event handler status koneksi untuk logging & monitoring
  pusherInstance.connection.bind('state_change', (states) => {
    // states = { previous: '...', current: '...' }
    if (states.current === 'connected') {
      console.log('[Pusher] Terkoneksi ke realtime server');
    } else if (states.current === 'unavailable' || states.current === 'failed') {
      console.warn('[Pusher] Koneksi realtime terputus, mencoba rekoneksi otomatis...');
    }
  });

  return pusherInstance;
}

/**
 * Reset instance Pusher (misalnya saat logout)
 */
export function disconnectPusher() {
  if (pusherInstance) {
    pusherInstance.disconnect();
    pusherInstance = null;
  }
}
