En Docker, apunta el proxy de Vite al servicio backend:
VITE_API_PROXY_TARGET=http://backend:4000

En desarrollo local (sin Docker), mantenlo en http://localhost:4000.
