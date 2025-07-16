import { View, TextInput, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import Entypo from 'react-native-vector-icons/Entypo';
import Colors from "../styles/colors";

const SearchContainer = ({ query, onSearchSubmit }) => {
  const [input, setInput] = useState(query || "");

  useEffect(() => {
    setInput(query || "");
  }, [query]);

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
        placeholder="Search here for anything you want..."
        placeholderTextColor={Colors.secondaryText}
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => {
          if (onSearchSubmit) onSearchSubmit(input);
        }}
        returnKeyType="search"
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
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
    height:50,
    alignItems: 'center'  },
  icon: {
    marginLeft: '5%',
  },
  input: {
    width:"85%",
    borderRadius: 999,
    backgroundColor: Colors.bgClr,
    color: Colors.secondary,
  },
});

export default SearchContainer;
