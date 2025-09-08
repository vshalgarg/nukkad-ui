import React, { useEffect, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { View, StyleSheet, Dimensions, Keyboard } from 'react-native';
import { City } from 'country-state-city';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

const INDIA_COUNTRY_CODE = 'IN';
const SCREEN_WIDTH = Dimensions.get('screen').width;

const CityDropdown = ({
  selectedCity, // Full city name e.g. 'Dehradun'
  onSelectCity,
  selectedState, // Full state name required to get cities
  error,
  openDropdown,
  setOpenDropdown,
  dropdownKey,
  countryCode = INDIA_COUNTRY_CODE,
}) => {
  const [value, setValue] = useState(selectedCity || null);
  const [items, setItems] = useState([]);

  const isOpen = openDropdown === dropdownKey;

  useEffect(() => {
    if (!selectedState) {
      setItems([]);
      return;
    }

    // Get state's ISO code from full name
    const { State } = require('country-state-city');
    const safeSelectedState = (selectedState ?? '').toString().toLowerCase();

    const state = State.getStatesOfCountry(countryCode).find(
      st => st.name.toLowerCase() === safeSelectedState,
    );

    if (!state) {
      setItems([]);
      return;
    }

    const cities = City.getCitiesOfState(countryCode, state.isoCode);
    const mappedCities = cities.map(city => ({
      label: city.name,
      value: city.name,
    }));

    setItems(mappedCities);
  }, [selectedState, countryCode]);

  useEffect(() => {
    setValue(selectedCity || null);
  }, [selectedCity]);

  const handleSetOpen = open => {
    if (open) {
      setOpenDropdown(dropdownKey);
      Keyboard.dismiss();
    } else {
      setOpenDropdown(null);
    }
  };

  return (
    <View style={{ zIndex: isOpen ? 1000 : 1 }}>
      <DropDownPicker
        open={isOpen}
        value={value}
        items={items}
        setOpen={handleSetOpen}
        setValue={val => {
          setValue(val);
          onSelectCity(val);
        }}
        setItems={setItems}
        placeholder="Select City"
        listMode="SCROLLVIEW"
        scrollViewProps={{ nestedScrollEnabled: true }}
        style={[
          styles.dropdown,
          error
            ? { borderColor: Colors.reject, borderWidth: 1.5 }
            : { borderColor: Colors.secondary },
          isOpen
            ? {
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 30,
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
              }
            : { borderRadius: 50 },
          { paddingHorizontal: 27, paddingVertical: 10 },
        ]}
        dropDownContainerStyle={[
          styles.dropDownContainer,
          error
            ? { borderColor: Colors.reject }
            : { borderColor: Colors.secondary },
          {
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          },
          { paddingHorizontal: 15, maxHeight: 170 },
        ]}
        textStyle={{ fontSize: Fonts.sizes.base }}
        labelStyle={{ fontSize: Fonts.sizes.base }}
        disabled={!selectedState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'white',
    borderWidth: 1,
    zIndex: 100,
  },
  dropDownContainer: {
    width: SCREEN_WIDTH * 0.75,
    backgroundColor: 'white',
    borderWidth: 1,
  },
});

export default CityDropdown;
