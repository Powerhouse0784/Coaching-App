import axios from "axios";
import { getToken, clearAuth } from "./auth";
import { triggerUnauthorized } from "./authEvents";

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://intense-learners.vercel.app";

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuth();
      triggerUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;