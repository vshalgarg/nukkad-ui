import axios from "axios";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../constants/apiEndpoints";


export const authService = {
  login: async (credentials) => {
    try {
      console.log("🔄 Calling login API...", credentials);

      //const response = await axiosInstance.post(apiEndpoints.ADMIN_LOGIN, { items: products });
      const response = await axiosInstance.post(
        API_PATHS.ADMIN.LOGIN,
        credentials
      );

      console.log("📥 API Response:", response.data);

      if (!response.data.token) {
        throw new Error(response.data.message || "No token received from server");
      }

      return {
        token: response.data.token,
        user: {
          userId: response.data.userId,
          email: response.data.email,
          roles: response.data.roles,
          permissions: response.data.permissions,
          profile: response.data.userProfile,
        },
      };
    } catch (error) {
      console.error("❌ Login error:", error);
      throw new Error(error.response?.data?.message || error.message || "Network error");
    }
  },
};
