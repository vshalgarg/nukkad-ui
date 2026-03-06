// Vite environment variables
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const API_VERSION =
  import.meta.env.VITE_API_VERSION || "v1";

// ---------------- API PATHS ----------------
export const API_PATHS = {
  // Admin/Auth
  ADMIN: {
    LOGIN: `/nukkad/api/admin/${API_VERSION}/login`,
    UPLOAD_FILE: `/nukkad/api/admin/${API_VERSION}/upload/file`,
    UPLOAD_JSON: `/nukkad/api/admin/${API_VERSION}/upload/json`,
    DELETE_CUSTOMER: `/nukkad/api/admin/${API_VERSION}/delete/customer`,
    DELETE_STOREKEEPER: `/nukkad/api/admin/${API_VERSION}/delete/storekeeper`,
  },

  // Category
  CATEGORY: {
    GET_ALL: `/nukkad/api/category/${API_VERSION}`,
    GET_ALL_WITH_PAGINATION: `/nukkad/api/category/${API_VERSION}/all`,
    CREATE: `/nukkad/api/category/${API_VERSION}`,
    DELETE_BY_ID: (id) =>
      `/nukkad/api/category/${API_VERSION}/${id}`,
    GET_BY_ID: (id) =>
      `/nukkad/api/category/${API_VERSION}/${id}`,
  },

  // Product / Item
  PRODUCT: {
    GET_ALL: `/nukkad/api/item/${API_VERSION}`,
    CREATE: `/nukkad/api/item/${API_VERSION}`,
    UPDATE: `/nukkad/api/item/${API_VERSION}`,
    DELETE_BY_ID: (id) =>
      `/nukkad/api/item/${API_VERSION}/${id}`,
    GET_BY_CATEGORY: (categoryId) =>
      `/nukkad/api/item/${API_VERSION}/category/${categoryId}`,
  },

  // Customer
  CUSTOMER: {
    GET_ALL: `/nukkad/api/customer/${API_VERSION}`,
    GET_BY_ID: (id) =>
      `/nukkad/api/customer/${API_VERSION}/${id}`,
  },

  // Storekeeper
  STOREKEEPER: {
    GET_ALL: `/nukkad/api/storekeeper/${API_VERSION}`,
    GET_BY_ID: (id) =>
      `/nukkad/api/storekeeper/${API_VERSION}/${id}`,
  },

  // Search
  SEARCH: {
    GENERAL: `/nukkad/api/search/${API_VERSION}`,
  },
};

// ---------------- FULL URLS (Optional) ----------------
export const API_URLS = {
  LOGIN: `${API_BASE_URL}${API_PATHS.ADMIN.LOGIN}`,
};
