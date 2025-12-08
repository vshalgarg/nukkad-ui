import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/apiEndpoints';

class ProductService {
  async getAllProducts(page = 0, size = 10) {
    try {
      const response = await axiosInstance.get(apiEndpoints.GET_PRODUCTS, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch products';
      throw new Error(errorMessage);
    }
  }

  async bulkCreateProducts(products) {

    console.log("Calling bulk create products API", products);
    try {
      const response = await axiosInstance.post(apiEndpoints.CREATE_PRODUCTS, { items: products });

      if (response.data && (response.data.success === false || response.data.responseCode === 1039)) {
        throw new Error(response.data.message || 'failed to create products');
      }

      return response.data;
    }

    catch (error) {
     throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const response = await axiosInstance.delete(`${apiEndpoints.DELETE_PRODUCT_BY_ID}/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete product';
      throw new Error(errorMessage);
    }
  }

  async uploadExcel(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(
      apiEndpoints.IMPORT_EXCEL_PRODUCT_FILE,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );

    if (response.data && (response.data.success === false || response.data.responseCode === 1039)) {
      throw new Error(response.data.message || response.data.error || 'Excel import failed');
    }

    return response.data;
  }

  async importProductsWithCategories(jsonData) {
    try {
      const response = await axiosInstance.post(
        apiEndpoints.IMPORT_JSON_PRODUCT_FILE,
        jsonData
      );
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'JSON import failed';
      throw new Error(errorMessage);
    }
  }

  async updateProduct(id, updateData) {
    try {
      const response = await axiosInstance.put(
        `${apiEndpoints.UPDATE_PRODUCT}/${id}`,
        updateData
      );
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update product';
      throw new Error(errorMessage);
    }
  }
}

export default new ProductService();