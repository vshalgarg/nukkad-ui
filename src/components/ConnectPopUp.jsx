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
import strings from '../constants/string';
import { ScaledSheet } from 'react-native-size-matters';

const ConnectPopup = ({ onClose, visible, phone, style, position }) => {
  if (!visible) return null;
  console.log(position);
  const phoneNumber = phone || '9999999999';

  const handleCall = () => {
    onClose?.();
    Linking.openURL(`tel:${phoneNumber}`).catch(err =>
      console.error('Call error:', err),
    );
  };

  const handleWhatsApp = () => {
    onClose?.();
    const message = `${strings.whatsAppMessage}`;
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
            <Text style={styles.popupText}>{strings.call}</Text>
            <FontAwesome5 name="phone" size={15} color={Colors.secondary} />
          </View>
        </Pressable>
        <Pressable style={styles.popupItem} onPress={handleWhatsApp}>
          <View style={styles.row}>
            <Text style={styles.popupText}>{strings.whatsapp}</Text>
            <FontAwesome5 name="whatsapp" size={18} color={Colors.primary} />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default ConnectPopup;
const styles = ScaledSheet.create({
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
    backgroundColor: Colors.white,
    borderRadius: '8@ms',
    borderColor: Colors.borderColor,
    borderWidth: 1,
    elevation: 5,
    width: '140@ms',
  },

  popupItem: {
    paddingHorizontal: '16@ms',
    paddingVertical: '8@ms',
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
