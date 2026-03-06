import axios from "axios";
import { API_BASE_URL } from "../constants/apiEndpoints";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    // Logging (development only)
    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🔑 Token: ${token ? "Present" : "Not Present"}`);
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const { response } = error;
    
    console.error("❌ API Error:", {
      status: response?.status,
      url: error.config?.url,
      message: response?.data?.message || error.message,
    });
    
    // Handle specific errors
    if (response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    
    // Return error for handling in components
    return Promise.reject({
      message: response?.data?.message || "Something went wrong",
      status: response?.status,
      data: response?.data,
    });
  }
);

export default axiosInstance;