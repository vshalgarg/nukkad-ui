import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD-Pcbhkrp7mPGERuaQihXHX1yWYd82QEY",
  authDomain: "nukkad-app-ad9c9.firebaseapp.com",
  projectId: "nukkad-app-ad9c9",
  storageBucket: "nukkad-app-ad9c9.firebasestorage.app",
  messagingSenderId: "521051283768",
  appId: "1:521051283768:web:d24bb684f359941c00e1cd",
  measurementId: "G-FCCB6H3DYF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app, "gs://nukkad-app-ad9c9.firebasestorage.app");

// -------------------------------------------------
// UPLOAD (works for products, categories, anything)
// -------------------------------------------------
export async function uploadImageToFirebase(file, path) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      null,
      reject,
      async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
    );
  });
}

// -------------------------------------------------
// DELETE ONE FILE (auto-detects folder)
// -------------------------------------------------
export async function deleteImageFromFirebase(url) {
  if (!url || typeof url !== 'string') {
    console.log('Invalid URL, skipping delete:', url);
    return false;
  }

  if (!url.includes('firebasestorage.googleapis.com')) {
    console.log('External URL – not deleting from Firebase:', url);
    return false;
  }

  try {
    const decoded = decodeURIComponent(url);
    const startIndex = decoded.indexOf('/o/');
    if (startIndex === -1) {
      console.log('Invalid Firebase URL format:', url);
      return false;
    }

    const endIndex = decoded.indexOf('?', startIndex);
    const path = decoded.substring(startIndex + 3, endIndex !== -1 ? endIndex : undefined);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('Deleted from Firebase:', path);
    return true;
  } catch (err) {
    console.warn('Failed to delete image (continuing anyway):', url, err);
    return false;
  }
}

// -------------------------------------------------
// DELETE MULTIPLE FILES
// -------------------------------------------------
export async function deleteImagesFromFirebase(urls) {
  if (!Array.isArray(urls)) return;

  for (const url of urls) {
    await deleteImageFromFirebase(url);
  }
}

export { storage, app };
