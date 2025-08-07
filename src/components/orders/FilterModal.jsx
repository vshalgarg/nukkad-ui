import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import DropDownPicker from 'react-native-dropdown-picker';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import {
  fetchOrderHistory,
} from '../../services/common/OrderHistoryService';
import { useAuth } from '../../contexts/authContext';
import strings from '../../constants/string';
import { ScaledSheet } from 'react-native-size-matters';

const FilterModal = ({
  visible,
  setOrders,
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
  const { token } = useAuth();
  const handleClearFilter = async () => {
    try {
      setDateFrom('');
      setDateTo('');
      setMaxPrice('');
      setMinPrice('');
      setSelectedStatus('');
    } catch (err) {
      console.error('Failed to clear filter:', err);
      Alert.alert('Error', 'Something went wrong while clearing filters.');
    }
  };
  const [open, setOpen] = useState(false);

  const [statusItems, setStatusItems] = useState([
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event.type !== 'set') return;

    const today = new Date();
    const maxToDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    if (activePicker === 'from') {
      setDateFrom(selectedDate);
      if (dateTo && selectedDate > dateTo) setDateTo(null);
    } else {
      if (dateFrom && selectedDate < dateFrom) {
        Alert.alert('Invalid Date', "'To' date cannot be before 'From' date.");
        return;
      }
      if (selectedDate > maxToDate) {
        Alert.alert('Invalid Date', "'To' date cannot be in the future.");
        return;
      }
      setDateTo(selectedDate);
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const applyFilter = () => {
    const today = new Date();
    const maxToDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    if (dateFrom && dateTo && dateTo < dateFrom) {
      Alert.alert('Invalid Date', "'To' date must be after 'From' date.");
      return;
    }

    if (dateTo && dateTo > maxToDate) {
      Alert.alert('Invalid Date', "'To' date cannot be in the future.");
      return;
    }

    setFilterModalVisible(false);
    if (typeof onApplyFilter === 'function') {
      onApplyFilter();
    }
  };

  const CustomMarker = ({ currentValue }) => (
    <View style={styles.markerContainer}>
      <Text style={styles.labelText}>₹{currentValue}</Text>
      <View style={styles.marker} />
    </View>
  );
  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={styles.title}>{strings.filterOrders}</Text>
              {applyFilter && (
                <TouchableOpacity onPress={handleClearFilter}>
                  <Text style={styles.subtitle}>{strings.clear}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.dateSelect}
              onPress={() => {
                setActivePicker('from');
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.dateLabel}>From: {formatDate(dateFrom)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateSelect}
              onPress={() => {
                setActivePicker('to');
                setShowDatePicker(true);
              }}
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
                dropDownContainerStyle={{
                  borderColor: Colors.borderColor,
                }}
                textStyle={{
                  color: Colors.secondary,
                  fontSize: Fonts.sizes.base,
                }}
                zIndex={1000}
              />
            </View>
            {selectedStatus === 'DISPATCHED' ||
            selectedStatus === 'DELIVERED' ? (
              <>
                <Text style={styles.sectionTitle}>{strings.priceRange}</Text>

                <MultiSlider
                  values={[Number(minPrice) || 0, Number(maxPrice) || 5000]}
                  min={0}
                  max={5000}
                  sliderLength={screenWidth - 50}
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
              </>
            ) : (
              <View />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.buttonText}>{strings.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={applyFilter}>
                <Text style={styles.buttonText}>{strings.apply}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={
            activePicker === 'from'
              ? dateFrom || new Date()
              : dateTo || new Date()
          }
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
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
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: '20@s',
    borderTopRightRadius: '20@s',
    padding: '20@s',
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
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '-20@vs',
  },
  labelText: {
    marginBottom: '4@vs',
    fontSize: '12@s',
    fontWeight: '500',
    color: '#333',
  },
  marker: {
    backgroundColor: Colors.primary,
    height: '20@s',
    width: '20@s',
    borderRadius: '10@s',
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
  statusBtn: {
    paddingVertical: '8@vs',
    paddingHorizontal: '14@s',
    borderRadius: '8@s',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginRight: '8@s',
    marginBottom: '8@vs',
  },
  statusText: {
    color: Colors.secondary,
    fontSize: Fonts.sizes.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: '10@vs',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '8@s',
    padding: '8@s',
    width: '80@s',
    textAlign: 'center',
    backgroundColor: '#fff',
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
