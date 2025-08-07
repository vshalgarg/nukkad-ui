import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useDispatch, useSelector } from 'react-redux';
import { updateCartItemQuantity, addToCart } from '../store/cartSlice';
import Fonts from '../styles/font';
import Colors from '../styles/colors';
import { useAuth } from '../contexts/authContext';
import { addToCartAPI, updateCartAPI } from '../services/customer/cartService';
import { showToast } from '../utils/toastUtils';
import { ScaledSheet } from 'react-native-size-matters';

const { width } = Dimensions.get('window');

const ProductCard = ({ product, isDropdownOpen, setDropdownOpen }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const { token } = useAuth();

  const [selectedUnit, setSelectedUnit] = useState(
    cartItem?.selectedUnit || (product.unit || [])[0] || null,
  );
  const [amount, setAmount] = useState(
    cartItem?.product?.amount?.toString() || '',
  );
  const [imageError, setImageError] = useState(false);
  const placeholderImageUrl = require('../../assets/images/itemNotFound.jpg');

  const units = product.unit || [];
  const unitOptions = units.map(q => ({ label: q.trim(), value: q }));

 useEffect(() => {
   if (cartItem) {
     const newAmount = cartItem.product.amount?.toString() || '';
     const newUnit = cartItem.selectedUnit || product.unit?.[0] || '';

     // Only update if changed (to avoid cursor jump issues)
     if (amount !== newAmount) setAmount(newAmount);
     if (selectedUnit !== newUnit) setSelectedUnit(newUnit);
   }
 }, [cartItem?.product.amount, cartItem?.selectedUnit]);


  const isValidAmount =
    amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const isInCart = !!cartItem;

  const isRecentlyAdded =
    isInCart &&
    cartItem.selectedUnit === selectedUnit &&
    cartItem.product.amount?.toString() === amount;

  const isModifiedSinceInCart =
    (isInCart &&
      (cartItem.product?.selectedUnit !== selectedUnit ||
        cartItem.product.amount?.toString() !== amount)) ||
    !isInCart;

  const isReadyToSubmit = isValidAmount && selectedUnit && isModifiedSinceInCart;

  const handleAddToCart = async () => {
    Keyboard.dismiss();
    const cartQuantity = amount;
    const validAmount = cartQuantity.toString();

    if (isNaN(cartQuantity) || cartQuantity <= 0) return;

    try {
      const itemId = product.id;
      const isPkt = selectedUnit?.toLowerCase() === 'pkt';
      const itemCount = isPkt ? Math.round(cartQuantity) : 1;

      if (isInCart && itemId) {
        // ✅ Update cart
        await updateCartAPI(itemId, cartQuantity, selectedUnit, token);

        dispatch(
          updateCartItemQuantity({
            itemId,
            amount: validAmount,
            selectedUnit,
            itemCount,
          }),
        );
        setAmount(validAmount);
        setSelectedUnit(selectedUnit);
      } else {
        // ➕ Add new item
        const response = await addToCartAPI(
          itemId,
          cartQuantity,
          selectedUnit,
          token,
        );

        const newItemId = response?.itemIds?.[0] || response?.id || itemId;

        const newItem = {
          itemId: newItemId,
          product: { ...product, selectedUnit, amount: validAmount },
          selectedUnit,
          quantity: itemCount,
        };

        dispatch(addToCart(newItem));
      }

      showToast('success', 'Added to cart');
    } catch (err) {
      console.error('Add to cart failed:', err.message || err);
      showToast('error', 'Failed to add item to cart');
    }
  };

  useEffect(() => {
    setImageError(false);
  }, [product.image]);

  return (
    <View style={[styles.card, isDropdownOpen && { zIndex: 2000 }]}>
      <View style={styles.imageContainer}>
        <Image
          style={styles.image}
          source={
            imageError || !product.imageUrls?.[0]
              ? placeholderImageUrl
              : { uri: product.image || product.imageUrls?.[0] }
          }
          onError={() => setImageError(true)}
        />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {product.title || product.name}
      </Text>

      <View style={styles.row}>
        <TextInput
          value={amount !== undefined && amount !== null ? String(amount) : ''}
          onChangeText={setAmount}
          placeholder="Qty."
          keyboardType="numeric"
          maxLength={4}
          style={styles.textInput}
        />
        <DropDownPicker
          open={isDropdownOpen}
          value={selectedUnit}
          items={unitOptions}
          setOpen={setDropdownOpen}
          ArrowUpIconComponent={() => null}
          ArrowDownIconComponent={() => null}
          setValue={setSelectedUnit}
          style={styles.dropdown}
          placeholder={selectedUnit}
          containerStyle={styles.dropdownContainer}
          dropDownContainerStyle={styles.dropdownBox}
          textStyle={styles.text}
          placeholderStyle={styles.placeholder}
          listMode="SCROLLVIEW"
          TickIconComponent={() => null}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          (!isModifiedSinceInCart || isRecentlyAdded) && styles.buttonDisabled,
          (!isModifiedSinceInCart || isRecentlyAdded) && styles.buttonAdded,
        ]}
        onPress={handleAddToCart}
        disabled={!isReadyToSubmit}
      >
        <Text
          style={[
            styles.buttonText,
            (!isModifiedSinceInCart || isRecentlyAdded) && {
              color: Colors.primary,
              borderColor: Colors.primary,
            },
          ]}
        >
          {!isModifiedSinceInCart || isRecentlyAdded ? 'Added' : 'Add to Cart'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = ScaledSheet.create({
  card: {
    padding: width < 360 ? '8@s' : '10@s',
    backgroundColor: Colors.white,
    borderRadius: '10@s',
    elevation: 3,
    alignItems: 'center',
    width: width > 768 ? '30%' : '48%',
    height: width < 360 ? '210@vs' : '230@vs',
    marginBottom: '20@vs',
    justifyContent: 'space-around',
  },
  imageContainer: {
    width: width < 360 ? '90@s' : '130@s',
    height: width < 360 ? '70@vs' : '90@vs',
    borderRadius: '8@s',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  title: {
    fontSize: width < 360 ? Fonts.sizes.sm : Fonts.sizes.base,
    fontWeight: '600',
    alignSelf: 'flex-start',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5@s',
    gap: '5@s',
    width: '100%',
  },
  dropdownContainer: {
    width: '50%',
  },
  dropdown: {
    borderColor: Colors.borderColor,
    borderRadius: '10@s',
    minHeight: '35@vs',
  },
  dropdownBox: {
    borderColor: Colors.borderColor,
    justifyContent: 'center',
  },
  text: {
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: Fonts.sizes.sm,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: '10@s',
    paddingHorizontal: '10@s',
    paddingVertical: Platform.OS === 'android' ? '4@vs' : '6@vs',
    width: '50%',
    height: '35@vs',
    fontSize: Fonts.sizes.sm,
  },
  button: {
    marginTop: '5@vs',
    width: '100%',
    paddingVertical: '8@vs',
    borderRadius: '50@s',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: Fonts.sizes.sm,
  },
  buttonAdded: {
    borderColor: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});


export default ProductCard;
