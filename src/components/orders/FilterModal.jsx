import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import DropDownPicker from 'react-native-dropdown-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { ScaledSheet } from 'react-native-size-matters';

const FilterModal = ({
  visible,
  onClose,
  dateFrom,
  onApplyFilter,
  dateTo,
  setDateFrom,
  setDateTo,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  selectedStatus,
  setSelectedStatus,
  showDatePicker,
  setShowDatePicker,
  activePicker,
  setActivePicker,
  setFilterModalVisible,
}) => {
  const formatDate = date => {
    if (!date || isNaN(new Date(date))) return 'Select';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const screenWidth = Dimensions.get('window').width;

  const [iosDatePickerModalVisible, setIosDatePickerModalVisible] =
    useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const [open, setOpen] = useState(false);

  const [statusItems, setStatusItems] = useState([
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ]);

  const openDatePicker = pickerType => {
    setActivePicker(pickerType);
    if (Platform.OS === 'ios') {
      setTempDate(
        pickerType === 'from' ? dateFrom || new Date() : dateTo || new Date(),
      );
      setFilterModalVisible(false);
      setIosDatePickerModalVisible(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDateChangeAndroid = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type !== 'set') return;

    if (activePicker === 'from') {
      setDateFrom(selectedDate);
      if (dateTo && selectedDate > dateTo) setDateTo(null);
    } else {
      if (dateFrom && selectedDate < dateFrom) {
        Alert.alert('Invalid Date', "'To' date cannot be before 'From' date.");
        return;
      }
      if (selectedDate > new Date()) {
        Alert.alert('Invalid Date', "'To' date cannot be in the future.");
        return;
      }
      setDateTo(selectedDate);
    }
  };

  const handleIosDateConfirm = () => {
    if (activePicker === 'from') {
      setDateFrom(tempDate);
      if (dateTo && tempDate > dateTo) setDateTo(null);
    } else {
      if (dateFrom && tempDate < dateFrom) {
        Alert.alert('Invalid Date', "'To' date cannot be before 'From' date.");
        return;
      }
      if (tempDate > new Date()) {
        Alert.alert('Invalid Date', "'To' date cannot be in the future.");
        return;
      }
      setDateTo(tempDate);
    }
    setIosDatePickerModalVisible(false);
    setFilterModalVisible(true);
  };

  const handleIosDateCancel = () => {
    setIosDatePickerModalVisible(false);
    setFilterModalVisible(true);
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setMaxPrice('');
    setMinPrice('');
    setSelectedStatus('');
  };

  const applyFilter = () => {
    if (dateFrom && dateTo && dateTo < dateFrom) {
      Alert.alert('Invalid Date', "'To' date must be after 'From' date.");
      return;
    }
    if (dateTo && dateTo > new Date()) {
      Alert.alert('Invalid Date', "'To' date cannot be in the future.");
      return;
    }

    const noFilter =
      !dateFrom && !dateTo && !minPrice && !maxPrice && !selectedStatus;

    if (typeof onApplyFilter === 'function') {
      onApplyFilter(noFilter); // pass info whether filters exist
    }

    setFilterModalVisible(false);
  };

  const CustomMarker = ({ currentValue }) => (
    <View style={styles.markerContainer}>
      <Text numberOfLines={1} style={styles.labelText}>
        ₹{currentValue}
      </Text>
      <View style={styles.marker} />
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.title}>Filter Orders</Text>
              <TouchableOpacity onPress={handleClearFilter}>
                <Text style={styles.subtitle}>Clear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.dateSelect}
              onPress={() => openDatePicker('from')}
            >
              <Text style={styles.dateLabel}>From: {formatDate(dateFrom)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateSelect}
              onPress={() => openDatePicker('to')}
            >
              <Text style={styles.dateLabel}>To: {formatDate(dateTo)}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={[styles.statusRow, { marginBottom: open ? 10 : 0 }]}>
              <DropDownPicker
                open={open}
                value={selectedStatus}
                items={statusItems}
                setOpen={setOpen}
                setValue={setSelectedStatus}
                setItems={setStatusItems}
                placeholder="Select a status"
                dropDownDirection="BOTTOM"
                style={{
                  borderColor: Colors.borderColor,
                  marginBottom: open ? 180 : 20,
                }}
                dropDownContainerStyle={{ borderColor: Colors.borderColor }}
                textStyle={{
                  color: Colors.secondary,
                  fontSize: Fonts.sizes.base,
                }}
                zIndex={1000}
              />
            </View>

            {(selectedStatus === 'DISPATCHED' ||
              selectedStatus === 'DELIVERED') && (
              <>
                <Text style={styles.sectionTitle}>Price Range</Text>
                <View style={styles.sliderContainer}>
                  <MultiSlider
                    values={[Number(minPrice) || 0, Number(maxPrice) || 5000]}
                    min={0}
                    max={5000}
                    sliderLength={screenWidth - 70}
                    customMarker={e => (
                      <CustomMarker currentValue={e.currentValue} />
                    )}
                    step={500}
                    onValuesChangeFinish={([min, max]) => {
                      setMinPrice(min.toString());
                      setMaxPrice(max.toString());
                    }}
                    selectedStyle={{ backgroundColor: Colors.primary }}
                    markerStyle={{
                      backgroundColor: Colors.primary,
                      height: 20,
                      width: 20,
                    }}
                  />
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  onClose();
                  handleClearFilter();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={applyFilter}>
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {Platform.OS !== 'ios' && showDatePicker && (
        <DateTimePicker
          value={
            activePicker === 'from'
              ? dateFrom || new Date()
              : dateTo || new Date()
          }
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleDateChangeAndroid}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={iosDatePickerModalVisible}
          transparent
          animationType="none"
          onRequestClose={handleIosDateCancel}
        >
          <View style={styles.overlay}>
            <View
              style={[
                styles.container,
                {
                  borderRadius: 0,
                  marginTop: 'auto',
                  justifyContent: 'center',
                },
              ]}
            >
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  if (selectedDate) setTempDate(selectedDate);
                }}
                style={{ backgroundColor: 'white' }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  justifyContent: 'space-around',
                  paddingVertical: 10,
                }}
              >
                <TouchableOpacity
                  onPress={handleIosDateCancel}
                  style={{ padding: 10 }}
                >
                  <Text style={{ color: Colors.secondary, fontSize: 18 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleIosDateConfirm}
                  style={{ padding: 10 }}
                >
                  <Text
                    style={{
                      color: Colors.primary,
                      fontSize: 18,
                      fontWeight: 'bold',
                    }}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default FilterModal;

const styles = ScaledSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    padding: '20@s',
    elevation: 10,
  },

  container: {
    backgroundColor: Colors.white,
    flexDirection: 'column',
    alignItems: 'center',
    elevation: 10,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: '16@vs',
  },
  subtitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    marginBottom: '16@vs',
    color: Colors.secondary,
  },
  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '10@vs',
    marginBottom: '10@vs',
  },

  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -Fonts.sizes.sm,
    width: 55,
  },
  marker: {
    backgroundColor: Colors.primary,
    height: '15@s',
    width: '15@s',
    borderRadius: '10@s',
  },
  labelText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    flexShrink: 1,
  },

  dateSelect: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    padding: '14@s',
    borderRadius: '10@s',
    marginBottom: '12@vs',
  },
  dateLabel: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
  },
  sectionTitle: {
    marginTop: '16@vs',
    marginBottom: '10@vs',
    fontWeight: 'bold',
    fontSize: Fonts.sizes.base,
    color: Colors.secondary,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8@s',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: '20@vs',
  },
  modalBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: '12@s',
    borderRadius: '10@s',
    alignItems: 'center',
    marginLeft: '10@s',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Colors.secondaryText,
    padding: '12@s',
    borderRadius: '10@s',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});
