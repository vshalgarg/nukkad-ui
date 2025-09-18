// components/CityDropdown.jsx
import React, { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { ScaledSheet } from 'react-native-size-matters';

const SCREEN_WIDTH = Dimensions.get('screen').width;

const CityDropdown = ({
  selectedState,
  selectedCity, // 👈 comes from address
  onSelectCity,
  error,
  openDropdown,
  setOpenDropdown,
  dropdownKey,
}) => {
  const [value, setValue] = useState(selectedCity || null); // ✅ immediate show
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const isOpen = openDropdown === dropdownKey;

  const fetchCities = async () => {
    if (!selectedState) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        'https://countriesnow.space/api/v0.1/countries/state/cities',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: 'India', state: selectedState }),
        },
      );
      const data = await res.json();

      if (data?.data) {
        const mappedCities = data.data.map(c => ({
          label: c,
          value: c,
        }));

        setItems(mappedCities);

        // ✅ keep selectedCity if it's valid in fetched list
        if (selectedCity) {
          const exists = mappedCities.find(i => i.value === selectedCity);
          if (!exists) {
            setValue(null); // reset if invalid
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 👇 show saved city immediately
    if (selectedCity) {
      setValue(selectedCity);
    }
    // then fetch list in background
    fetchCities();
  }, [selectedState, selectedCity]);

  return (
    <DropDownPicker
      open={isOpen}
      value={value}
      items={items}
      setOpen={o => {
        if (o) {
          Keyboard.dismiss(); // 👈 close keyboard
          setOpenDropdown(dropdownKey);
        } else {
          setOpenDropdown(null);
        }
      }}
      setValue={val => {
        setValue(val);
        onSelectCity(val);
      }}
      setItems={setItems}
      listMode="SCROLLVIEW"
      scrollViewProps={{
        nestedScrollEnabled: true,
        keyboardShouldPersistTaps: 'handled',
      }}
      placeholder={
        !selectedState
          ? 'Select a State first'
          : value
          ? value // 👈 show saved value first
          : loading
          ? 'Loading cities...'
          : 'Select City'
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
