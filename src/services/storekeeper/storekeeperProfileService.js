import api from '../api';

export const getStorekeeperProfile = async token => {
  try {
    const response = await api.get('/nukkad/api/storekeeper/v1/get/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(' Storekeeper get profile API success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Storekeeper Create Profile API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    throw {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
};

export const createStorekeeperProfile = async (profileData, token) => {
  try {
    // Prepare JSON payload
    const payload = {
      name: profileData.name,
      storeName: profileData.storeName,
      contactNumber: profileData.contactNumber,
      gstNum: profileData.gstNum,
      storeQrId: profileData.storeQrId,
      addressLine1: profileData.addressLine1,
      addressLine2: profileData.addressLine2,
      landmark: profileData.landmark,
      city: profileData.city,
      state: profileData.state,
      pincode: profileData.pincode,
      imageUrls: profileData.imageUrls?.filter(url => !!url) || [],
    };

    const response = await api.post(
      '/nukkad/api/storekeeper/v1/profile/save',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('Storekeeper API success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Storekeeper Create Profile API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      request: profileData,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to create storekeeper profile',
    );
  }
};

export const updateStorekeeperProfile = async (profileData, token) => {
  try {
    // Prepare JSON payload
    const payload = {
      name: profileData.name,
      storeName: profileData.storeName,
      contactNumber: profileData.contactNumber,
      gstNum: profileData.gstNum,
      storeQrId: profileData.storeQrId,
      addressLine1: profileData.addressLine1,
      addressLine2: profileData.addressLine2,
      landmark: profileData.landmark,
      city: profileData.city,
      state: profileData.state,
      pincode: profileData.pincode,
      imageUrls: profileData.imageUrls?.filter(url => !!url) || [],
    };

    const response = await api.put(
      '/nukkad/api/storekeeper/v1/profile/update',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log('Storekeeper API success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Storekeeper Update Profile API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      request: profileData,
    });

    throw new Error(
      error.response?.data?.message || 'Failed to update storekeeper profile',
    );
  }
};
