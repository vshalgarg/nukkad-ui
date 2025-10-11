import { View, TextInput, TouchableOpacity } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import Colors from '../styles/colors';
import strings from '../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import Fonts from '../styles/font';
import { SearchContext } from '../contexts/searchContext';

const SearchContainer = ({
  query,
  onSearchSubmit,
  autoSearchOnThreeLetters = false,
}) => {
  const { queryInput, setQueryInput } = useContext(SearchContext);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Sync incoming query prop into context state
  useEffect(() => {
    setQueryInput(query || '');
  }, [query]);

  // If autoSearchOnThreeLetters is enabled, trigger search automatically with debounce
  useEffect(() => {
    if (!autoSearchOnThreeLetters) return;

    if (debounceTimeout) clearTimeout(debounceTimeout);

    if (queryInput.length >= 3) {
      const timeout = setTimeout(() => {
        onSearchSubmit?.(queryInput);
      }, 500); // 500ms debounce

      setDebounceTimeout(timeout);
    } else if (queryInput.length === 0) {
      onSearchSubmit?.('');
    }

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [queryInput, autoSearchOnThreeLetters]);

  const handleClear = () => {
    setQueryInput('');
    onSearchSubmit?.('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.iconContainerOne}>
          <Entypo
            name="magnifying-glass"
            size={20}
            color={Colors.secondaryText}
            style={styles.icon}
          />
        </View>

        <TextInput
          style={styles.queryInput}
          placeholder={strings.searchPlaceholder}
          placeholderTextColor={Colors.secondaryText}
          value={queryInput}
          onChangeText={setQueryInput}
          onSubmitEditing={() => {
            onSearchSubmit?.(queryInput);
          }}
          maxLength={25}
          returnKeyType="search"
        />
        <View style={styles.iconContainerTwo}>
          {queryInput.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.icon}>
              <Entypo name="cross" size={20} color={Colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: '5@vs',
    paddingHorizontal: '20@s',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'blue',
  },
  innerContainer: {
    width: '100%',
    borderWidth: 0.5,
    position: 'relative',
    borderRadius: '50@s',
    flexDirection: 'row',
    marginVertical: '10@vs',
    height: '40@vs',
    alignItems: 'center',
    // backgroundColor: 'white',
  },
  iconContainerOne: {
    width: '12%',
    justifyContent: 'flex-end',
    alignItems: 'center',

    // backgroundColor: 'yellow',
  },
  iconContainerTwo: {
    width: '12%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // backgroundColor: 'yellow',
  },
  queryInput: {
    width: '75%',
    // backgroundColor: 'red',
    // paddingInline: '4@s',
    textAlignVertical: 'center',
    color: Colors.secondary,
    fontSize: Fonts.sizes.sm,
  },
});

export default React.memo(SearchContainer);
