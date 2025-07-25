import React from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

const ConnectPopup = ({ onClose, visible, phone, style, position }) => {
  if (!visible) return null;

  const phoneNumber = phone || '9999999999';

  const handleCall = () => {
    onClose?.();
    Linking.openURL(`tel:${phoneNumber}`).catch(err =>
      console.error('Call error:', err),
    );
  };

  const handleWhatsApp = () => {
    onClose?.();
    const message = "Hello, I'm contacting you regarding your order.";
    Linking.openURL(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
    ).catch(err => console.error('WhatsApp error:', err));
  };

  return (
    <View style={styles.absoluteFill}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.popupMenu,
          styles.popup,
          { top: position?.y, left: position?.x },
        ]}
      >
        <Pressable style={styles.popupItem} onPress={handleCall}>
          <View style={styles.row}>
            <Text style={styles.popupText}>Call</Text>
            <FontAwesome5 name="phone" size={15} color={Colors.secondary} />
          </View>
        </Pressable>
        <Pressable style={styles.popupItem} onPress={handleWhatsApp}>
          <View style={styles.row}>
            <Text style={styles.popupText}>WhatsApp</Text>
            <FontAwesome5 name="whatsapp" size={18} color={Colors.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default ConnectPopup;

const styles = StyleSheet.create({
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  popupMenu: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    elevation: 5,
    width: 150,
  },
  popupItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  popupText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
