import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import textStyles from '../../styles/textStyles';
import Colors from '../../styles/colors';

const CategoryCard = ({ category, onPress }) => {
  return (
    <Pressable style={styles.card} onPress={() => onPress(category)}>
      <Image source={{ uri: category.imageUrl }} style={styles.image} />
      <Text style={[styles.name, textStyles.caption]}>
        {category.name
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: 130,
    alignItems: 'center',
    borderRadius: 8,
    padding: 5,
  },
  image: {
    borderRadius: 5,
    width: 75,
    height: 75,
    marginBottom: 8,
    objectFit: 'cover',
    backgroundColor: '#fff',

    elevation: 3,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  name: {
    textAlign: 'center',
    color: Colors.secondary,
  },
});

export default CategoryCard;
