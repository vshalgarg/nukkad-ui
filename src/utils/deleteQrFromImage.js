// // utils/decodeQrFromImage.js
// import { QRreader } from 'react-native-qr-decode-image-camera';

// export async function decodeQrFromImage({ uri, base64 }) {
//   try {
//     if (!uri && !base64) {
//       console.log('No image data provided');
//       return null;
//     }

//     let imagePath = uri;

//     if (!imagePath && base64) {
//       imagePath = base64; 
//     }

//     const result = await QRreader(imagePath);
//     console.log('QR Decoded:', result);

//     return result || null; 
//   } catch (error) {
//     console.error('QR decode error:', error);
//     return null;
//   }
// }
