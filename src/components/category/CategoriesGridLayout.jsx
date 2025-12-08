import { FlatList, View } from 'react-native';
import CategoryCard from './CategoryCard';
import React from 'react';
import { ScaledSheet } from 'react-native-size-matters';

const numColumns = 4;
const spacing = 10;

const CategoryGridLayout = ({ categories = [], onPressCategory }) => {
  return (
    <View style={styles.categoryContainer}>
      <FlatList
        data={categories}
        keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <CategoryCard category={item} onPress={onPressCategory} />
          </View>
        )}
      />
    </View>
  );
};

const styles = ScaledSheet.create({
  categoryContainer: {
    flex: 1,
    padding:'12@s'
  },

  listContainer: {
    paddingHorizontal: spacing,
    paddingTop: spacing,
  },

  gridItem: {
    flex: 1, // ✅ auto equal width
    maxWidth: '25%', // ✅ 4 columns (100 / 4)
    marginHorizontal: spacing/4,
    marginBottom: spacing,
  },
});

export default React.memo(CategoryGridLayout);
