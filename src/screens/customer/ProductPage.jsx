import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import AllProduct from '../../components/AllProduct.jsx';
import SearchContainer from '../../components/SearchContainer.jsx';
import UserToolbar from '../../components/UserToolbar.jsx';
import { searchProducts } from '../../services/customer/searchService.js';
import { getProductsByCategory } from '../../services/customer/getProductsByCategorySerivce.js';
import Colors from '../../styles/colors.js';
import styles from '../../styles/globalStyles.js';
import { useSafeRouter } from '../../hooks/useSafeRouter.js';
import Fonts from '../../styles/font.js';
import useBackHandlerControl from '../../hooks/useBackHandlerControl.jsx';

const ProductPage = () => {
  useBackHandlerControl({ confirmBack: false });
  const navigation = useNavigation();
  const route = useRoute();
  const { safePush } = useSafeRouter();
  const search = route?.params?.search || '';
  const categoryId = route?.params?.categoryId;
  const categoryName = route?.params?.categoryName;
  const [searchQuery, setSearchQuery] = useState(search);
  const [groupedResults, setGroupedResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  const renderCategory = useCallback(({ item: category }) => (
    <AllProduct
      products={category.items}
      style={{ marginVertical: 10, paddingHorizontal: 10 }}
    />
  ), []);

  const renderEmpty = useCallback(() => (
    !searching && (
      <Text style={{
        textAlign: 'center',
        marginTop: 40,
        color: Colors.secondaryText
      }}>
        No items found.
      </Text>
    )
  ), [searching]);

  const renderFooter = useCallback(() => (
    loadingMore && (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    )
  ), [loadingMore]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const cartItems = useSelector(state => state.cart.items);
  const totalItems = cartItems.reduce((total, item) => {
    const isPacket = item.product.selectedUnit?.toLowerCase() === 'pkt';
    return total + (isPacket ? parseInt(item.product.amount) || 0 : 1);
  }, 0);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryProducts(0);
    }
  }, [categoryId]);

  useEffect(() => {
    if (search && !categoryId) {
      setSearchQuery(search);
      handleSearch(search);
    }
  }, [search, categoryId]);

  const loadMoreProducts = async () => {
    if (currentPage >= totalPages - 1 || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;

      if (categoryId) {
        const { items, total } = await getProductsByCategory(categoryId, nextPage, PAGE_SIZE);
        if (items?.length) {
          setGroupedResults(prev => {
            // Create a deep copy to ensure state updates
            const newState = JSON.parse(JSON.stringify(prev));
            if (newState.length > 0) {
              // Filter out any potential duplicates
              const existingIds = new Set(newState[0].items.map(item => item.id));
              const filteredItems = items.filter(item => !existingIds.has(item.id));
              newState[0].items = [...newState[0].items, ...filteredItems];
            }
            return newState;
          });
          setCurrentPage(nextPage);
          setTotalPages(Math.ceil(total / PAGE_SIZE));
        }
      } else if (searchQuery) {
        const { items, total } = await searchProducts(searchQuery, nextPage, PAGE_SIZE);
        if (items?.length) {
          setGroupedResults(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (newState.length > 0) {
              const existingIds = new Set(newState[0].items.map(item => item.id));
              const filteredItems = items.filter(item => !existingIds.has(item.id));
              newState[0].items = [...newState[0].items, ...filteredItems];
            }
            return newState;
          });
          setCurrentPage(nextPage);
          setTotalPages(Math.ceil(total / PAGE_SIZE));
        }
      }
    } catch (err) {
      console.error('Error loading more products:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = async (keyword, page = 0) => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const response = await searchProducts(keyword, page, PAGE_SIZE);
      const items = response?.items || [];
      setGroupedResults([{ id: 'search', items }]);
      setTotalPages(Math.ceil(response.total / PAGE_SIZE) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ Search failed:', err.message);
      setGroupedResults([]);
    } finally {
      setSearching(false);
    }
  };

  const fetchCategoryProducts = async (page = 0) => {
    setSearching(true);
    try {
      const { items, total } = await getProductsByCategory(categoryId, page, PAGE_SIZE);
      const category = {
        id: categoryId,
        name: categoryName || 'Category',
        items,
      };
      setGroupedResults([category]);
      setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ Category fetch failed:', err.message);
      setGroupedResults([]);
    } finally {
      setSearching(false);
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (categoryId) {
        await fetchCategoryProducts(0);
      } else if (searchQuery) {
        await handleSearch(searchQuery, 0);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.pageContainer, { flex: 1, backgroundColor: 'white' }]}>
      <UserToolbar hideNotification={true} hideMenu={true} />
      <SearchContainer
        query={searchQuery}
        onSearchSubmit={newQuery => {
          setSearchQuery(newQuery);
          handleSearch(newQuery);
        }}
      />

      <FlashList
        data={groupedResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategory}
        estimatedItemSize={230}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreProducts}
        onEndReachedThreshold={0.2}
        contentContainerStyle={{
          paddingBottom: totalItems > 0 ? 100 : 20, // Space for cart banner
          paddingTop: 10,
          minHeight: keyboardVisible ? '100%' : undefined // Fix keyboard overlap
        }}

        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        drawDistance={2}
        progressViewOffset={totalItems > 0 ? 60 : 0}
        extraData={currentPage} // Ensure re-render when page changes
        refreshing={refreshing}
        onRefresh={handleRefresh}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      />

      {totalItems > 0 && !keyboardVisible && (
        <View style={innerStyle.fixedBottomBanner}>
          <Text style={innerStyle.popupText}>
            {totalItems} item{totalItems > 1 ? 's' : ''} in cart
          </Text>
          <TouchableOpacity
            style={innerStyle.goToCartButton}
            onPress={() => safePush('ShoppingCart')}
          >
            <Text style={innerStyle.goToCartText}>Go to Cart</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const innerStyle = StyleSheet.create({
  fixedBottomBanner: {
    position: 'absolute',
    bottom: 25,
    left: 15,
    right: 15,
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    borderWidth: 1.5,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    zIndex: 999,
  },
  popupText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '500',
    color: Colors.secondary,
  },
  goToCartButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
  },
  goToCartText: {
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
});

export default ProductPage;