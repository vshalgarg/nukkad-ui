import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  PermissionsAndroid,
  Text,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../styles/colors'; 
import { ScaledSheet } from 'react-native-size-matters';

const MAX_IMAGES = 4;

const StoreImageUploader = ({ images, setImages, editable = true }) => {
  const [picking, setPicking] = useState(false);

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

    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 800,
      quality: 0.7,
      selectionLimit: 1,
    });

    if (result?.assets?.length > 0) {
      const selected = result.assets[0];
      setImages(prev => {
        const updated = [...prev];
        updated[index] = selected;
        return updated;
      });
    }

    setPicking(false);
  };

  const removeImage = index => {
    Alert.alert('Remove Image', 'Do you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => {
          setImages(prev => {
            const updated = [...prev];
            updated[index] = null;
            return updated;
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map(index => {
        const img = images[index];

        return (
          <TouchableOpacity
            key={index}
            onPress={() => editable && !img && pickImage(index)}
            activeOpacity={0.8}
            style={{ position: 'relative', marginBottom: 10 }}
            disabled={!editable && !img}
          >
            {img ? (
              <View>
                <Image source={{ uri: img.uri }} style={styles.image} />
                {editable && (
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
                <Text style={{ color: '#888', fontSize: 20 }}>+</Text>
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
  plusText: {
    color: '#888',
    fontSize: '20@s',
  },
});

export default StoreImageUploader;
                                                                                                      