import axios from "axios";

// withCredentials: true makes the browser attach and accept the HttpOnly
// "token" cookie the backend sets on login. Without this, the cookie is
// never sent back on later requests (like /customers/me), so the server
// would treat every request as logged out.
const api = axios.create({
  // Keep the app usable if the Vite env file is missing or Vite has not been
  // restarted since it changed. The local API listens on port 8000.
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

export default api;
