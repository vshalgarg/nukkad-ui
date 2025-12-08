import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/apiEndpoints';

class StorekeeperService {
  // GET all storekeepers
  async getAllStorekeepers() {
    try {
      console.log('🚀 Fetching storekeepers from:', apiEndpoints.GET_ALL_STOREKEEPERS);
      const response = await axiosInstance.get(apiEndpoints.GET_ALL_STOREKEEPERS);
      console.log('✅ Storekeepers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching storekeepers:', error);
      
      let errorMessage = 'Failed to load storekeepers';
      
      if (error.response) {
        const { status, data } = error.response;
        
        console.log('🔍 Server Error Details:', {
          status: status,
          data: data
        });

        if (data && data.message) {
          errorMessage = data.message;
        } else if (data && data.error) {
          errorMessage = data.error;
        } else {
          switch (status) {
            case 404:
              errorMessage = 'Storekeepers API endpoint not found';
              break;
            case 500:
              errorMessage = 'Server error occurred while fetching storekeepers';
              break;
            case 403:
              errorMessage = 'Access denied. You do not have permission to view storekeepers';
              break;
            case 401:
              errorMessage = 'Authentication failed. Please login again';
              break;
            default:
              errorMessage = `Server error: ${status}`;
          }
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // GET single storekeeper by ID
  async getStorekeeperById(id) {
    try {
      console.log('🚀 Fetching storekeeper by ID:', id);
      const response = await axiosInstance.get(`${apiEndpoints.GET_STOREKEEPER_BY_ID}/${id}`);
      console.log('✅ Storekeeper details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching storekeeper:', error);
      
      let errorMessage = 'Failed to load storekeeper details';
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (data && data.message) {
          errorMessage = data.message;
        } else if (data && data.error) {
          errorMessage = data.error;
        } else {
          switch (status) {
            case 404:
              errorMessage = 'Storekeeper not found';
              break;
            case 500:
              errorMessage = 'Server error occurred while fetching storekeeper';
              break;
            default:
              errorMessage = `Server error: ${status}`;
          }
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  async deleteStorekeeper(id) {
    try {
      console.log('🚀 Deleting storekeeper with ID:', id);
      const { data } = await axiosInstance.delete(`${apiEndpoints.DELETE_STOREKEEPER_BY_ID}/${id}`);
      console.log('✅ Storekeeper deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error deleting storekeeper:', error);

      let errorMessage = 'Failed to delete storekeeper';

      if (error.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection';
      } else {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }
};

export default new StorekeeperService();