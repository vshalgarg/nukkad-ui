import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/apiEndpoints';

class CustomerService {
  // GET all customers
  async getAllCustomers() {
    try {
      console.log('🚀 Fetching customers from:', apiEndpoints.GET_ALL_CUSTOMERS);
      const response = await axiosInstance.get(apiEndpoints.GET_ALL_CUSTOMERS);
      console.log('✅ Customers response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching customers:', error);

      let errorMessage = 'Failed to load customers';

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
              errorMessage = 'Customers API endpoint not found';
              break;
            case 500:
              errorMessage = 'Server error occurred while fetching customers';
              break;
            case 403:
              errorMessage = 'Access denied. You do not have permission to view customers';
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

  // GET single customer by ID
  async getCustomerById(id) {
    try {
      console.log('🚀 Fetching customer by ID:', id);
      const response = await axiosInstance.get(`${apiEndpoints.GET_CUSTOMER_BY_ID}/${id}`);
      console.log('✅ Customer details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching customer:', error);

      let errorMessage = 'Failed to load customer details';

      if (error.response) {
        const { status, data } = error.response;

        if (data && data.message) {
          errorMessage = data.message;
        } else if (data && data.error) {
          errorMessage = data.error;
        } else {
          switch (status) {
            case 404:
              errorMessage = 'Customer not found';
              break;
            case 500:
              errorMessage = 'Server error occurred while fetching customer';
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

  // DELETE customer
 async deleteCustomer(id) {
    try {
      console.log('🚀 Deleting customer with ID:', id);
      const { data } = await axiosInstance.delete(`${apiEndpoints.DELETE_CUSTOMER_BY_ID}/${id}`);
      console.log('✅ Customer deleted successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error deleting customer:', error);

      let errorMessage = 'Failed to delete customer';

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
}

export default new CustomerService();