import React, { useEffect, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { View, StyleSheet, Dimensions, Keyboard } from 'react-native';
import { State } from 'country-state-city';
import Colors from '../styles/colors';
import Fonts from '../styles/font';

const INDIA_COUNTRY_CODE = 'IN';
const SCREEN_WIDTH = Dimensions.get('screen').width;

const StateDropdown = ({
  selectedState, // Full state name e.g. 'Uttarakhand'
  onSelectState, // Callback to parent
  error,
  openDropdown,
  setOpenDropdown,
  dropdownKey,
  countryCode = INDIA_COUNTRY_CODE,
}) => {
  const [value, setValue] = useState(selectedState || null);
  const [items, setItems] = useState([]);

  const isOpen = openDropdown === dropdownKey;

  useEffect(() => {
    const fetchedStates = State.getStatesOfCountry(countryCode);
    const mappedStates = fetchedStates.map(state => ({
      label: state.name,
      value: state.name, // ✅ full name
    }));
    setItems(mappedStates);
  }, [countryCode]);

  useEffect(() => {
    setValue(selectedState || null);
  }, [selectedState]);

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
          onSelectState(val);
        }}
        setItems={setItems}
        placeholder="Select State"
        listMode="SCROLLVIEW"
        TickIconComponent={() => null}
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

export default StateDropdown;
