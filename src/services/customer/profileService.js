// services/customer/profile.js
import api from '../api';

//  Get Customer Profile
export const getCustomerProfile = async token => {
  try {
    const response = await api.get('/nukkad/api/customer/v1/get/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(' Get Profile API Success:', {
      status: response.status,
      data: response.data,
    });

    const user = response.data || {};

    // Parse name -> firstName, lastName
    const [firstName = '', ...rest] = user.name?.split(' ') || [];
    const lastName = rest.join(' ');
    return {
      ...user,
      firstName,
      lastName,
      DOB: user.dob,
    };
  } catch (error) {
    console.error(' Get Profile API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw error;
  }
};

//  Update Customer Profile
export const updateCustomerProfile = async (payload, token) => {
  try {
    // Only send JSON now; image URL is included in the JSON
    const requestBody = {
      name: payload.name || '',
      email: payload.email || '',
      dob: payload.dob || '',
      mobileNumber: payload.mobileNumber || '',
      profileImageUrl: payload.image || '', // Firebase URL
    };
    console.log('request body from updateApi', requestBody);

    const response = await api.put(
      '/nukkad/api/customer/v1/update',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('✅ Update success:', response.data);
    return response.data?.data;
  } catch (error) {
    console.error('❌ Update error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      request: payload,
    });
    throw new Error(
      error.response?.data?.message || 'Failed to update customer profile',
    );
  }
};
