import api from '../api';

export const deleteAccount = async (token) => {
  console.log('📤 Sending request to deactivate user account');

  try {
    const response = await api.put(
      '/nukkad/api/otp/v1/otp/deactivate/user/account',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('✅ Account Deactivation API Success:', {
      status: response.status,
      data: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Account Deactivation API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to deactivate account',
    );
  }
};
