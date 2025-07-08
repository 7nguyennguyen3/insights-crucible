import axios from "axios";

// The API client now ONLY talks to our own Next.js backend.
// The browser automatically handles sending the secure session cookie with each request.
const apiClient = axios.create({
  // The base URL is now the relative path to your Next.js API routes.
  baseURL: "/api",
});

export default apiClient;
