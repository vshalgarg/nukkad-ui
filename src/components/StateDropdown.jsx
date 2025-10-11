import React, { useState, useEffect } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { ScaledSheet } from 'react-native-size-matters';
import statesData from '../State_City Data/State_city.json';

const SCREEN_WIDTH = Dimensions.get('screen').width;

const StateDropdown = ({
  selectedState,
  onSelectState,
  error,
  openDropdown,
  setOpenDropdown,
  dropdownKey,
}) => {
  const [value, setValue] = useState(selectedState || null);
  const [items, setItems] = useState([]);

  const isOpen = openDropdown === dropdownKey;

  const fetchStates = () => {
    try {
      Keyboard.dismiss();
      const mapped = statesData.states.map(s => ({
        label: s.name,
        value: s.name,
      }));
      setItems(mapped);

      if (selectedState) {
        const exists = mapped.find(i => i.value === selectedState);
        if (!exists) setValue(null);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  useEffect(() => {
    if (selectedState) {
      setValue(selectedState);
    }
    fetchStates();
  }, [selectedState]);

  return (
    <DropDownPicker
      open={isOpen}
      value={value}
      items={items}
      setOpen={o => {
        if (o) {
          Keyboard.dismiss();
          setOpenDropdown(dropdownKey);
        } else {
          setOpenDropdown(null);
        }
      }}
      setValue={setValue}
      setItems={setItems}
      onSelectItem={item => onSelectState(item.value)}
      listMode="SCROLLVIEW"
      scrollViewProps={{
        nestedScrollEnabled: true,
        keyboardShouldPersistTaps: 'handled',
      }}
      maxHeight={200}
      placeholder={value ? value : 'Select a state'}
      TickIconComponent={() => null}
      style={[
        styles.dropdown,
        error
          ? { borderColor: Colors.reject, borderWidth: 1 }
          : { borderColor: Colors.secondary },
        isOpen ? styles.openDropdownStyle : styles.closedDropdownStyle,
      ]}
      dropDownContainerStyle={[
        styles.dropDownContainer,
        error
          ? { borderColor: Colors.reject }
          : { borderColor: Colors.secondary },
        { maxHeight: 170 },
        Platform.OS === 'android' ? { elevation: isOpen ? 1000 : 1 } : {},
      ]}
      textStyle={{ fontSize: Fonts.sizes.base }}
      labelStyle={{ fontSize: Fonts.sizes.base }}
    />
  );
};

const styles = ScaledSheet.create({
  dropdown: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'white',
    borderWidth: 1,
  },
  dropDownContainer: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'white',
    borderWidth: 1,
    paddingHorizontal: '13@s',
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
    borderTopLeftRadius: '30@s',
    borderTopRightRadius: '30@s',
    paddingVertical: '5@vs',
  },
  openDropdownStyle: {
    borderBottomLeftRadius: '30@s',
    borderBottomRightRadius: '30@s',
    borderTopLeftRadius: '30@s',
    borderTopRightRadius: '30@s',
    paddingHorizontal: '20@s',
    paddingVertical: '5@vs',
    zIndex: 2000,
  },
  closedDropdownStyle: {
    borderRadius: '50@s',
    paddingHorizontal: '20@s',
    paddingVertical: '10@vs',
    zIndex: 0,
  },
});

export default React.memo(StateDropdown);
