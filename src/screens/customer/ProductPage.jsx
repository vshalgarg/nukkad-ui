import React, { useCallback, useEffect, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
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
import strings from '../../constants/string.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('screen');

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

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

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

  const cartItems = useSelector(state => state.cart.items);
  const totalItemsInCart = cartItems?.length;
  const totalItems = cartItems.reduce((total, item) => {
    const isPacket = item.product.selectedUnit?.toLowerCase() === 'pkt';
    return total + (isPacket ? parseInt(item.product.amount) || 0 : 1);
  }, 0);

  const renderCategory = useCallback(
    ({ item: category }) => (
      <AllProduct
        products={category.items}
        style={{ marginVertical: 10, paddingHorizontal: 10 }}
      />
    ),
    [],
  );

  const renderEmpty = useCallback(() => {
    if (searchQuery.length > 0 && searchQuery.length < 3) {
      return (
        <View style={innerStyle.noItemContainer}>
          <Text style={styles.hintText}>
            Type at least 3 characters to search
          </Text>
        </View>
      );
    }

    return (
      !searching && (
        <View style={innerStyle.noItemContainer}>
          <Text style={styles.hintText}>
            No products found. Try searching for something else
          </Text>
        </View>
      )
    );
  }, [searching, searchQuery]);

  const renderFooter = useCallback(
    () =>
      loadingMore && (
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ),
    [loadingMore],
  );

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // ✅ Actual search logic
  const handleSearch = async (keyword, page = 0) => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const response = await searchProducts(keyword, page, PAGE_SIZE);
      const items = response?.items || [];
      if (items.length > 0) {
        setGroupedResults([{ id: 'search', items }]);
      } else {
        setGroupedResults([]);
      }
      setTotalPages(Math.ceil(response.total / PAGE_SIZE) || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error('Search failed:', err.message);
      setGroupedResults([]);
    } finally {
      setSearching(false);
    }
  };

  // ✅ Debounced search
  const debouncedSearch = useCallback(
    debounce(query => {
      if (query.length >= 3) {
        handleSearch(query);
      } else {
        setGroupedResults([]);
      }
    }, 400),
    [],
  );

  useEffect(() => {
    if (!categoryId) {
      debouncedSearch(searchQuery);
    }
  }, [searchQuery, categoryId]);

  const loadMoreProducts = async () => {
    if (currentPage >= totalPages - 1 || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      if (categoryId) {
        const { items, total } = await getProductsByCategory(
          categoryId,
          nextPage,
          PAGE_SIZE,
        );
        if (items?.length) {
          setGroupedResults(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (newState.length > 0) {
              const existingIds = new Set(
                newState[0].items.map(item => item.id),
              );
              const filteredItems = items.filter(
                item => !existingIds.has(item.id),
              );
              newState[0].items = [...newState[0].items, ...filteredItems];
            }
            return newState;
          });
          setCurrentPage(nextPage);
          setTotalPages(Math.ceil(total / PAGE_SIZE));
        }
      } else if (searchQuery.length >= 3) {
        const { items, total } = await searchProducts(
          searchQuery,
          nextPage,
          PAGE_SIZE,
        );
        if (items?.length) {
          setGroupedResults(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            if (newState.length > 0) {
              const existingIds = new Set(
                newState[0].items.map(item => item.id),
              );
              const filteredItems = items.filter(
                item => !existingIds.has(item.id),
              );
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

  const fetchCategoryProducts = async (page = 0) => {
    setSearching(true);
    try {
      const cacheKey = `products_category_${categoryId}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      const cachedData = cached ? JSON.parse(cached) : null;

      if (cachedData?.items?.length > 0) {
        setGroupedResults([cachedData]);
        setTotalPages(Math.ceil(cachedData.total / PAGE_SIZE) || 1);
        setCurrentPage(page);

        getProductsByCategory(categoryId, 0, PAGE_SIZE)
          .then(({ items, total }) => {
            if (total > cachedData.total) {
              const category = {
                id: categoryId,
                name: categoryName || 'Category',
                items,
                total,
              };
              setGroupedResults([category]);
              setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
              setCurrentPage(0);
              AsyncStorage.setItem(cacheKey, JSON.stringify(category));
            }
          })
          .catch(err =>
            console.warn('Background category fetch failed:', err.message),
          );

        setSearching(false);
        return;
      }

      const { items, total } = await getProductsByCategory(
        categoryId,
        page,
        PAGE_SIZE,
      );
      const category = {
        id: categoryId,
        name: categoryName || 'Category',
        items,
        total,
      };
      setGroupedResults([category]);
      setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
      setCurrentPage(page);
      AsyncStorage.setItem(cacheKey, JSON.stringify(category));
    } catch (err) {
      console.error('Category fetch failed:', err.message);
      setGroupedResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategoryProducts(0);
    }
  }, [categoryId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (categoryId) {
        await fetchCategoryProducts(0);
      } else if (searchQuery.length >= 3) {
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
      <UserToolbar hideNotification hideMenu />
      <SearchContainer
        query={searchQuery}
        onSearchSubmit={newQuery => {
          setSearchQuery(newQuery);
          handleSearch(newQuery);
        }}
        autoSearchOnThreeLetters={true} // enable auto search after 3 letters here
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? height * 0.069 : 10}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <FlashList
            data={groupedResults}
            keyExtractor={item => item.id.toString()}
            renderItem={renderCategory}
            estimatedItemSize={230}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.2}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: totalItems > 0 ? 100 : 20,
              paddingTop: 10,
              minHeight: keyboardVisible ? '100%' : undefined,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            drawDistance={2}
            progressViewOffset={totalItems > 0 ? 60 : 0}
            extraData={currentPage}
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {totalItems > 0 && !keyboardVisible && (
        <View style={innerStyle.fixedBottomBanner}>
          <Text style={innerStyle.popupText}>
            {strings.productCount(totalItemsInCart)}
          </Text>
          <TouchableOpacity
            style={innerStyle.goToCartButton}
            onPress={() => safePush('ShoppingCart')}
          >
            <Text style={innerStyle.goToCartText}>{strings.goToCart}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const innerStyle = StyleSheet.create({
  noItemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: height - height * 0.4,
  },
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
  hintText: {
    textAlign: 'center',
    color: Colors.secondaryText,
    fontSize: Fonts.sizes.base,
    padding: 15,
  },
});

export default ProductPage;
