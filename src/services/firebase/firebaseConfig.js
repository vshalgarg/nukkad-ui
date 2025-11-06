import storage from '@react-native-firebase/storage';

/**
 * Upload local file to Firebase Storage and return download URL
 * @param {string} filePath - file:// URI
 * @param {string} fileName - name to save in storage
 */
export const uploadImageAsync = async (filePath, fileName) => {
  try {
    console.log('Current Firebase bucket:', storage().ref().bucket);
    console.log(' Uploading:', fileName, filePath);

    //Correct way: use storage.ref directly
    const storageRef = storage().ref(`profile_images/${fileName}`);

    // Upload local file
    const task = storageRef.putFile(filePath);

    // Track progress
    task.on('state_changed', snapshot => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log(`Progress: ${progress.toFixed(2)}%`);
    });

    await task;

    const downloadURL = await storageRef.getDownloadURL();
    console.log('Upload complete. URL:', downloadURL);

    return downloadURL;
  } catch (err) {
    console.error('Firebase Upload Error:', err);
    throw err;
  }
};


export const deleteImageAsync = async fileName => {
  console.log(fileName);
  try {
    console.log(' Deleting:', fileName);

    const storageRef = storage().ref(`profile_images/${fileName}`);

    await storageRef.delete();

    console.log(' Image deleted successfully');
    return true;
  } catch (err) {
    console.log(err);

    if (err.code === 'storage/object-not-found') {
      console.warn('File not found in storage');
    } else {
      console.error('Firebase Delete Error:', err);
    }
    throw err;
  }
};
