import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../styles/colors.js';
import Fonts from '../styles/font.js'; // Adjust path if necessary

const NoInternetScreen = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>
        Please check your network and try again.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white', // Match ProductPage background
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: 'bold',
    color: Colors.secondary, // Match ProductPage innerStyle.noInternetText
    marginBottom: 10,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    color: Colors.secondaryText, // Match ProductPage innerStyle.noInternetSubText
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary, // Match ProductPage innerStyle.retryButton
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  retryText: {
    color: Colors.white, // Match ProductPage innerStyle.retryText
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
});

export default NoInternetScreen;
