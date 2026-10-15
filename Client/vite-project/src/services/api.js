import axios from "axios";

// withCredentials: true makes the browser attach and accept the HttpOnly
// "token" cookie the backend sets on login. Without this, the cookie is
// never sent back on later requests (like /customers/me), so the server
// would treat every request as logged out.
const api = axios.create({
  // Local Vite uses the backend's existing paths. In production, the frontend
  // and API share one origin and the backend is mounted under /api.
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD ? "/api" : "http://localhost:8000"),
  withCredentials: true,
});

export default api;
