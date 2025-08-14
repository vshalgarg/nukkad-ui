import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import Colors from '../styles/colors';
import { useSafeRouter } from '../hooks/useSafeRouter';
import strings from '../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import Fonts from '../styles/font';
import { SearchContext } from '../contexts/searchContext';

const SearchContainer = ({ query, onSearchSubmit }) => {
  const { safePush } = useSafeRouter();
  const { queryInput, setQueryInput } = useContext(SearchContext);

  useEffect(() => {
    setQueryInput(query || '');
  }, [query]);
  const handleClear = () => {
    setQueryInput('');
    if (onSearchSubmit) onSearchSubmit('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Entypo
          name="magnifying-glass"
          size={20}
          color={Colors.secondaryText}
          style={styles.icon}
        />

        <TextInput
          style={styles.queryInput}
          placeholder={`${strings.searchPlaceholder}`}
          placeholderTextColor={Colors.secondaryText}
          value={queryInput}
          onChangeText={setQueryInput}
          onSubmitEditing={() => {
            if (onSearchSubmit) onSearchSubmit(queryInput);
          }}
          returnKeyType="search"
        />
        {queryInput && (
          <TouchableOpacity onPress={handleClear}>
            <Entypo name="cross" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>
        )}
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
  },
  innerContainer: {
    width: '95%',
    borderWidth: 0.5,
    position: 'relative',
    borderRadius: '50@s',
    flexDirection: 'row',
    marginVertical: '10@vs',
    height: '40@vs',
    alignItems: 'center',
  },
  icon: {
    marginLeft: '5%',
  },
  queryInput: {
    width: '80%',
    backgroundColor: Colors.white,
    color: Colors.secondary,
    fontSize: Fonts.sizes.sm,
  },
});

export default React.memo(SearchContainer);
