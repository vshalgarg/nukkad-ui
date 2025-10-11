import { Dimensions, FlatList, View } from 'react-native';
import CategoryCard from './CategoryCard';
import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';

const numColumns = 4;
const screenWidth = Dimensions.get('window').width;
const spacing = 10;
const itemWidth = (screenWidth - spacing * (numColumns + 1)) / numColumns;

const CategoryGridLayout = ({ categories, onPressCategory }) => {
  return (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        keyExtractor={item => item.id.toString()}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{
          justifyContent: 'space-between', // ✅ evenly space each row
          paddingHorizontal: spacing,
        }}
        contentContainerStyle={{
          paddingVertical: spacing,
        }}
        renderItem={({ item }) => (
          <View style={[styles.gridItem, { width: itemWidth }]}>
            <CategoryCard category={item} onPress={onPressCategory} />
          </View>
        )}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  categoryContainer: {
    marginTop: '10@vs',
  },
  gridItem: {
    marginTop: '3@vs',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});

export default React.memo(CategoryGridLayout);
