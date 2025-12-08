import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/apiEndpoints';

class CategoryService {

  async getAllCategories() {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.GET_ALL_CATEGORIES}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load category. Please try again.'
      );
    }
  }


  async getAllCategoriesWithPagination(page = 0, size = 10) {
    {
      try {
        const response = await axiosInstance.get(`${apiEndpoints.GET_ALL_CATEGORIES_WITH_PAGINATION}?page=${page}&size=${size}`);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to load categories');
      }
    }

  }
  // POST create new category
  async createCategory(categoryData) {
    try {
      console.log(categoryData, "Creating category...");

      const payload = {
        categories: [
          {
            name: categoryData.name,
            imageUrl: categoryData.imageUrl,
          },
        ],
      };

      const response = await axiosInstance.post(apiEndpoints.CREATE_CATEGORIES, payload);

      if (response.data?.success === false || response.data?.responseCode === 1012) {
        throw new Error(response.data.message || response.data.error || "Category creation failed");
      }

      console.log("Category created successfully:", response.data);
      return response.data;

    } catch (error) {
      const message = error.response?.data?.message || error.message || "Failed to create category";
      throw new Error(message)
    }
  }
  // DELETE category
  async deleteCategory(id) {
    try {
      const response = await axiosInstance.delete(
        `${apiEndpoints.DELETE_CATEGORY_BY_ID}/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new Error(
        error.response?.data?.message ||
        "Failed to delete category. Please try again."
      );
    }
  }

  async getCategoryById(id) {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.GET_CATEGORY_BY_ID}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to load category. Please try again.'
      );
    }
  }

  async getProductsByCategory(categoryId, page = 0) {
    try {
      const response = await axiosInstance.get(
        `${apiEndpoints.GET_PRODUCTS_BY_CATEGORY}/${categoryId}?page=${page}&size=10`
      );
      return response.data;
    } catch (error) {
      throw new Error('Failed to load products');
    }
  }

  async search(keyword, page = 0, size = 10) {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.SEARCH}`, {
        params: {
          keyword: keyword,
          page: page,
          size: size
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to search. Please try again.'
      );
    }
  }

  // Alternative: Search only categories
  async searchCategories(keyword, page = 0, size = 10) {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.SEARCH_CATEGORIES}`, {
        params: {
          keyword: keyword,
          page: page,
          size: size
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw new Error(
        error.response?.data?.message ||
        'Failed to search categories. Please try again.'
      );
    }
  }

}

export default new CategoryService();
