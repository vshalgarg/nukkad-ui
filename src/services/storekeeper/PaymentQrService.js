// PaymentQrService.js
import api from '../api';

// 📤 Upload a new QR image
export const uploadQRImage = async (file, token) => {
  console.log('📤 Uploading QR image:', file);
  try {
    const formData = new FormData();
    formData.append('qrCodes', {
      uri: file.uri,
      name: file.fileName || 'qr.jpg',
      type: file.type || 'image/jpeg',
    });

    const response = await api.post('/nukkad/api/qr/v1/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log(' Upload Success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' QR Upload Error:', error);
    throw new Error('QR Upload failed');
  }
};

// 📥 Get all uploaded QR images
export const fetchPaymentQRs = async (token) => {
  console.log('📥 Fetching Payment QRs');
  try {
    const response = await api.get('/nukkad/api/qr/v1/getAll/qrCodes', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(' Payment QRs Fetch Success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Payment QRs Fetch Error:', error);
    throw new Error('Payment QRs Fetch failed');
  }
};

// 🗑️ Delete QR by ID
export const deletePaymentQR = async (qrId, token) => {
  console.log('🗑️ Deleting Payment QR with ID:', qrId);
  try {
    const response = await api.delete(`/nukkad/api/qr/v1/delete/${qrId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(' Payment QR Delete Success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Payment QR Delete Error:', error);
    throw new Error('Payment QR Delete failed');
  }
};

// 🔄 Update QR image by ID
export const updatePaymentQR = async (qrId, file, token) => {
  console.log('✏️ Updating Payment QR with ID:', qrId, file);
  try {
    const formData = new FormData();
    formData.append('qrImage', {
      uri: file.uri,
      name: file.fileName || 'updated_qr.jpg',
      type: file.type || 'image/jpeg',
    });

    const response = await api.put(
      `/nukkad/api/qr/v1/update/${qrId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    console.log(' Payment QR Update Success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Payment QR Update Error:', error);
    throw new Error('Payment QR Update failed');
  }
};

// ⭐ Mark a QR as default
export const setDefaultPaymentQR = async (qrId, token) => {
  console.log('🔧 Setting Default Payment QR with ID:', qrId);
  try {
    const response = await api.post(
      `/nukkad/api/qr/v1/${qrId}/default`,
      {}, // empty body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    console.log(' Default Payment QR Set Success:', response.data);
    return response.data;
  } catch (error) {
    console.error(' Default Payment QR Set Error:', error);
    throw new Error('Setting Default Payment QR failed');
  }
};
