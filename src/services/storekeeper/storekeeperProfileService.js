import api from '../api';

export const getStorekeeperProfile = async ( token) => {
  try {
    const response = await api.get(
      '/nukkad/api/storekeeper/v1/get/profile',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(' Storekeeper get profile API success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Storekeeper Create Profile API Error:', {
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

export const createStorekeeperProfile = async (profileData, token) => {
  try {
    const formData = new FormData();
    const jsonBlob = {
      name: 'data.json',
      type: 'application/json',
      string: JSON.stringify({
        name: profileData.name,
        storeName: profileData.storeName,
        contactNumber: profileData.contactNumber,
        gstNum: profileData.gstNum,
        addressLine1: profileData.addressLine1,
        addressLine2: profileData.addressLine2,
        landmark: profileData.landmark,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
      }),
    };

    formData.append('data', jsonBlob);

    profileData.images?.forEach((img, index) => {
      if (img?.uri) {
        formData.append('images', {
          uri: img.uri,
          name: img.fileName || `image_${index}.jpg`,
          type: img.type || 'image/jpeg',
        });
      }
    });

    //  3. Axios post
    const response = await api.post(
      '/nukkad/api/storekeeper/v1/profile/save',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(' Storekeeper API success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Storekeeper Create Profile API Error:', {
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

export const UpdateStorekeeperProfile = async (profileData, token) => {
  try {
    const formData = new FormData();
    const jsonBlob = {
      name: 'data.json',
      type: 'application/json',
      string: JSON.stringify({
        name: profileData.name,
        storeName: profileData.storeName,
        contactNumber: profileData.contactNumber,
        storeQrId: profileData.storeQrId,
        gstNum: profileData.gstNum,
        addressLine1: profileData.addressLine1,
        addressLine2: profileData.addressLine2,
        landmark: profileData.landmark,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
      }),
    };

    formData.append('data', jsonBlob); //  send as file, not string

    //   //  2. Append image files
    //   profileData.images?.forEach((img, index) => {
    //     if (img?.uri) {
    //       formData.append('images', {
    //         uri: img.uri,
    //         name: img.fileName || `image_${index}.jpg`,
    //         type: img.type || 'image/jpeg',
    //       });
    //     }
    //   });
    console.log(formData);

    const response = await api.put(
      '/nukkad/api/storekeeper/v1/profile/update',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log(' Storekeeper API success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Storekeeper update Profile API Error:', {
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