// components/DOBPicker.js

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Platform,
  StyleSheet,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

const DatePicker = ({ dob, setDob, error }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(dob || new Date(2000, 0, 1));

  const handleConfirm = () => {
    Keyboard.dismiss();
    setDob(tempDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    setShowPicker(false);
    setTempDate(dob || new Date(2000, 0, 1));
  };

  return (
    <>
      <Pressable onPress={() => setShowPicker(true)}>
        <View>
          <Text
            style={{
              fontSize: Fonts.sizes.base,
              color: dob ? Colors.secondary : Colors.disabledText,
            }}
          >
            {dob
              ? dob.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Select Date of Birth'}
          </Text>
        </View>
      </Pressable>

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={dob || new Date(2000, 0, 1)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (event.type !== 'dismissed' && selectedDate) {
              setDob(selectedDate);
            }
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={handleCancel}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleConfirm}>
                  <Text style={styles.modalButtonText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (event.type !== 'dismissed' && selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  dobInput: {
    height: '40@vs',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 50,
    backgroundColor: Colors.white,
    marginBottom: 9,
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  modalButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: Fonts.sizes.base,
  },
});
