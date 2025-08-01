import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Entypo from 'react-native-vector-icons/Entypo';
import Colors from '../styles/colors';
import { useSafeRouter } from '../hooks/useSafeRouter';
import strings from '../constants/string';

const SearchContainer = ({ query, onSearchSubmit }) => {
  const { safePush } = useSafeRouter();
  const [input, setInput] = useState(query || '');

  useEffect(() => {
    setInput(query || '');
  }, [query]);
  const handleClear = () => {
    setInput('');
    if (onSearchSubmit) onSearchSubmit('');
    safePush('CustomerDashboard');
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
          style={styles.input}
          placeholder={`${strings.searchPlaceholder}`}
          placeholderTextColor={Colors.secondaryText}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => {
            if (onSearchSubmit) onSearchSubmit(input);
          }}
          returnKeyType="search"
        />
        {input && (
          <TouchableOpacity onPress={handleClear}>
            <Entypo name="cross" size={20} color={Colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
    paddingHorizontal: 20,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: '95%',
    borderWidth: 0.5,
    position: 'relative',
    borderRadius: 50,
    flexDirection: 'row',
    marginVertical: 10,
    height: 50,
    alignItems: 'center',
  },
  icon: {
    marginLeft: '5%',
  },
  input: {
    width: '80%',
    backgroundColor: Colors.white,
    color: Colors.secondary,
  },
});

export default SearchContainer;
