import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../styles/colors';
import { ScaledSheet } from 'react-native-size-matters';

const CustomAlert = ({
  visible,
  title = 'Alert',
  message,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'OK',
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            {onConfirm && (
              <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
                <Text style={styles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    backgroundColor: Colors.white,
    borderRadius: '12@s',
    padding: '20@s',
    elevation: 5,
  },
  title: {
    fontSize: '18@s',
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: '8@s',
  },
  message: {
    fontSize: '16@s',
    color: Colors.secondary,
    marginBottom: '16@s',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: '12@s',
  },
  cancelBtn: {
    paddingVertical: '8@s',
    paddingHorizontal: '16@s',
    backgroundColor: Colors.borderColor,
    borderRadius: '6@s',
  },
  confirmBtn: {
    paddingVertical: '8@s',
    paddingHorizontal: '16@s',
    backgroundColor: Colors.primary,
    borderRadius: '6@s',
  },
  cancelText: {
    color: Colors.secondary,
    fontSize: '14@s',
    fontWeight: '500',
  },
  confirmText: {
    color: Colors.white,
    fontSize: '14@s',
    fontWeight: '600',
  },
});