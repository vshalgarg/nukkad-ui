import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import textStyles from '../../styles/textStyles.js';
import { getAllCategories } from '../../services/customer/categoriesService.js';
import Colors from '../../styles/colors.js';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 4 - 5;

export default function CategorySlider({ selectedCategoryId }) {
  const flatListRef = useRef(null);
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  // const [loading, setLoading] = useState(true);

const fetchCategories = async () => {
  try {
    const response = await getAllCategories();
    console.log('✅ Raw Slider Categories Response:', response);

    if (!Array.isArray(response)) {
      console.error('❌ Expected array but got:', typeof response, response);
      return;
    }

    let reordered = [...response];

    if (selectedCategoryId) {
      const selectedIndex = response.findIndex(
        cat => cat.id === selectedCategoryId,
      );
      if (selectedIndex !== -1) {
        const [selected] = reordered.splice(selectedIndex, 1);
        reordered.unshift(selected);
      }
    }

    setCategories(reordered);
  } catch (error) {
    console.error('❌ Failed to load categories:', error.message);
  }
};


  useEffect(() => {
    fetchCategories();
  }, []);

  

  const handleCategoryPress = category => {
    navigation.navigate('ProductPage', {
      categoryId: category.id,
      search: '',
    });
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedCategoryId;

    return (
      <TouchableOpacity
        onPress={() => handleCategoryPress(item)}
        style={[
          styles.category,
          { width: ITEM_WIDTH },
          isSelected && styles.selectedCategory,
        ]}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <Text
          style={[
            styles.name,
            textStyles.caption,
            isSelected && styles.selectedText,
          ]}
        >
          {item.name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
        </Text>
      </TouchableOpacity>
    );
  };

  // if (loading) {
  //   return (
  //     <ActivityIndicator
  //       size="small"
  //       color={Colors.secondary}
  //       style={{ marginTop: 20 }}
  //     />
  //   );
  // }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={categories}
        horizontal
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        contentContainerStyle={styles.flatList}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 9,
  },
  category: {
    borderWidth: 1,
    borderColor:"transparent",
    marginHorizontal: 0,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 10,
    height: 120,
  },
  selectedCategory: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  image: {
    width: 80,
    height: 60,
    resizeMode: 'cover',
    borderRadius: 5,
  },
  name: {
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    height: 36,
  },
});
