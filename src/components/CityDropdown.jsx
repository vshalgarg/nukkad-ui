import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { ScaledSheet } from 'react-native-size-matters';
import statesData from '../State_City Data/State_city.json';

const SCREEN_WIDTH = Dimensions.get('screen').width;

const CityDropdown = ({
  selectedState,
  selectedCity,
  onSelectCity,
  error,
  openDropdown,
  setOpenDropdown,
  dropdownKey,
}) => {
  const [value, setValue] = useState(selectedCity || null);
  const isOpen = openDropdown === dropdownKey;

  const items = useMemo(() => {
    if (!selectedState) return [];
    const state = statesData.states.find(s => s.name === selectedState);
    if (!state || !Array.isArray(state.cities)) return [];
    return state.cities.map(city => ({ label: city, value: city }));
  }, [selectedState]);

  useEffect(() => {
    if (selectedCity) {
      const exists = items.some(i => i.value === selectedCity);
      setValue(exists ? selectedCity : null);
    } else {
      setValue(null);
    }
  }, [selectedCity, items]);

  const handleOpen = useCallback(
    o => {
      Keyboard.dismiss();
      setOpenDropdown(o ? dropdownKey : null);
    },
    [dropdownKey, setOpenDropdown],
  );

  const handleValueChange = useCallback(
    val => {
      setValue(val);
      onSelectCity(val);
    },
    [onSelectCity],
  );
  const listMode = Platform.OS === 'android' ? 'SCROLLVIEW' : 'MODAL';

  return (
    <DropDownPicker
      open={isOpen}
      value={value}
      items={items}
      setOpen={handleOpen}
      setValue={handleValueChange}
      listMode={listMode}
      openAnimationDuration={0}
      closeAnimationDuration={0}
      scrollViewProps={{
        nestedScrollEnabled: true,
        keyboardShouldPersistTaps: 'handled',
      }}
      placeholder={
        !selectedState ? 'Select a State first' : value ? value : 'Select City'
      }
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

export default React.memo(CityDropdown);
