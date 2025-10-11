import React, { useState } from 'react';
import { Image as CompressorImage } from 'react-native-compressor';
import RNFS from 'react-native-fs';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Text,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../styles/colors';
import { ScaledSheet } from 'react-native-size-matters';
import {
  deleteImageAsync,
  uploadImageAsync,
} from '../services/firebase/firebaseConfig';
import { useDialog } from '../contexts/DialogContext';
const MAX_IMAGES = 4;

const StoreImageUploader = ({ images, setImages, editable = true }) => {
  const [picking, setPicking] = useState(false);
  const { showDialog } = useDialog();
  const requestGalleryPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  const pickImage = async index => {
    if (picking) return;
    setPicking(true);

    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      setPicking(false);
      return;
    }
    console.time('compress1');
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    console.timeEnd('compress1');
    if (result?.assets?.length > 0) {
      const selected = result.assets[0];
      const fileName = `store_${Date.now()}_${
        selected.fileName || 'image.jpg'
      }`;

      // 🔹 Place new image in the **first empty slot** (not necessarily the tapped index)
      setImages(prev => {
        const updated = prev.filter(Boolean); // remove nulls
        updated.push({
          uri: selected.uri,
          status: 'uploading',
          remoteUrl: null,
          fileName,
        });

        // keep max 4 slots
        while (updated.length < MAX_IMAGES) {
          updated.push(null);
        }
        return updated.slice(0, MAX_IMAGES);
      });

      try {
        const originalStat = await RNFS.stat(selected.uri);
        let compressedUri = selected.uri;

        if (originalStat.size >= 200 * 1024) {
          console.time('compress');
          compressedUri = await CompressorImage.compress(selected.uri, {
            compressionMethod: 'auto',
            quality: 0.6,
          });
          console.timeEnd('compress');
        }
        const compressedStat = await RNFS.stat(compressedUri);
        console.log('Compressed size (KB):', compressedStat.size / 1024);
        console.time('upload');
        console.log(`compressedUri" ${compressedUri} fileName:${fileName}`)
        const downloadUrl = await uploadImageAsync(compressedUri, fileName);
        console.timeEnd('upload');

        setImages(prev => {
          const updated = [...prev];
          updated[index] = {
            uri: compressedUri,
            status: 'uploaded',
            remoteUrl: downloadUrl,
            fileName,
          };
          return updated;
        });
      } catch (err) {
        console.error('Upload failed:', err);
        Alert.alert('Upload failed', 'Please try again');
        setImages(prev => {
          const updated = prev.filter(img => img?.fileName !== fileName);
          while (updated.length < MAX_IMAGES) {
            updated.push(null);
          }
          return updated;
        });
      }
    }

    setPicking(false);
  };
  const removeImage = async index => {
    const img = images[index];
    if (!img || img.status === 'uploading') return;
    console.log('image', img);
    showDialog({
      title: 'Remove',
      message: 'Do you want to remove this image?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onCancel: () => {
        console.log('Remove pic cancelled');
      },
      onConfirm: async () => {
        try {
          if (img.fileName) {
            await deleteImageAsync(img.fileName);
          }
        } catch (err) {
          console.warn('Failed to delete from storage', err);
        }
        setImages(prev => {
          const updated = [...prev];
          updated[index] = null;
          return updated;
        });
      },
    });
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map(index => {
        const img = images[index];

        return (
          <TouchableOpacity
            key={index}
            onPress={() =>
              editable &&
              (!img || img.status !== 'uploading') &&
              pickImage(index)
            }
            activeOpacity={0.8}
            style={{ position: 'relative', marginBottom: 10 }}
            disabled={!editable && !img}
          >
            {img ? (
              <View>
                {/* Always show local URI to avoid flicker */}
                <Image source={{ uri: img.uri }} style={styles.image} />

                {/* Loader overlay while uploading */}
                {img.status === 'uploading' && (
                  <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}

                {/* Remove button only when editable and not uploading */}
                {editable && img.status !== 'uploading' && (
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="x" size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={[styles.image, styles.emptyImage]}>
                <Text style={styles.plusText}>+</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBlock: '10@vs',
  },
  image: {
    width: '60@s',
    height: '60@s',
    borderRadius: '10@s',
    resizeMode: 'cover',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    backgroundColor: Colors.backbuttonColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    position: 'absolute',
    top: '-8@s',
    right: '-8@s',
    backgroundColor: Colors.reject || '#ff4444',
    borderRadius: '12@s',
    padding: '4@s',
    zIndex: 10,
    elevation: 3,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  plusText: {
    color: '#888',
    fontSize: '20@s',
  },
});

export default StoreImageUploader;
