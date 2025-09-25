// components/ConfirmDialog.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../src/styles/colors';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  cancel,
  confirm,
}) => {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Title */}

          {title ? <Text style={styles.title}>{title}</Text> : null}
          {/* Message */}
          {typeof message === 'string' ? (
            <Text style={styles.message}>{message}</Text>
          ) : (
            message
          )}
        </View>
        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.actionBtn, styles.cancelBtn]}
          >
            <Text style={styles.cancelText}>{cancel ? cancel : 'Skip'}</Text>
          </TouchableOpacity>
          {confirm ? (
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.actionBtn, styles.confirmBtn]}
            >
              <Text style={styles.confirmText}>
                {confirm ? confirm : 'Add'}
              </Text>
            </TouchableOpacity>
          ) : undefined}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: '#fff',
    // backgroundColor: "#5d1a1aff",
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    gap: 10,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 50,
    alignItems: 'center',
    // marginHorizontal: 5,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
  },
  cancelBtn: {
    backgroundColor: Colors.secondaryText,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default ConfirmDialog;
