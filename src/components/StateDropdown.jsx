import React, { useState, useEffect } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../styles/colors';
import Fonts from '../styles/font';
import { ScaledSheet } from 'react-native-size-matters';

const SCREEN_WIDTH = Dimensions.get('screen').width;

const StateDropdown = ({
  selectedState, // 👈 comes from address
  onSelectState,
  error,
  openDropdown,
  setOpenDropdown,
  dropdownKey,
}) => {
  const [value, setValue] = useState(selectedState || null); // show immediately
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const isOpen = openDropdown === dropdownKey;

  // ✅ Fetch list in background
  const fetchStates = async () => {
    try {
      Keyboard.dismiss();
      setLoading(true);
      console.log("fetching States");
      
      const res = await fetch(
        'https://countriesnow.space/api/v0.1/countries/states',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ country: 'India' }),
        },
      );
      const data = await res.json();

      if (data?.data?.states) {
        const mappedStates = data.data.states.map(s => ({
          label: s.name,
          value: s.name,
        }));

        setItems(mappedStates);

        // 👇 Ensure selectedState stays valid in case it matches API data
        if (selectedState) {
          const exists = mappedStates.find(i => i.value === selectedState);
          if (!exists) {
            // fallback if address had invalid state
            setValue(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 👇 show whatever is in address first
    if (selectedState) {
      setValue(selectedState);
    }
    // then fetch states in background
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
      placeholder={
        value ? value : loading ? 'Loading states...' : 'Select a state'
      } // 👈 show selected first
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
