import React, { memo, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { InputAccessoryView, Button } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

const ProductCard = ({
  product,
  isDropdownOpen,
  setDropdownOpen,
  inputAccessoryViewID,
}) => {
  const dispatch = useDispatch();
  const cartItems = useSelector(state => state.cart.items);
  const cartItem = cartItems.find(item => item.product.id === product.id);
  const { token } = useAuth();

  const [selectedUnit, setSelectedUnit] = useState(
    cartItem?.product?.selectedUnit?.toString() ||
      (product.unit || [])[0] ||
      null,
  );

  const [showAmountError, setShowAmountError] = useState(false);

  const [amount, setAmount] = useState(
    cartItem?.product?.amount?.toString() || '',
  );
  const [imageError, setImageError] = useState(false);
  const placeholderImageUrl = require('../../assets/images/itemNotFound.jpg');

  const units = product.unit || [];
  const unitOptions = units.map(q => ({ label: q.trim(), value: q }));

  // Sync local state when cartItem or product changes
  useEffect(() => {
    if (cartItem) {
      const newAmount = cartItem.product.amount?.toString() || '';
      const newUnit = cartItem.product.selectedUnit || product.unit?.[0] || '';

      if (amount !== newAmount) setAmount(newAmount);
      if (selectedUnit !== newUnit) setSelectedUnit(newUnit);
    }
  }, [cartItem?.product.amount, cartItem?.product.selectedUnit, product.id]);

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

  const handleAddToCart = async () => {
    console.log('Pressed');
    Keyboard.dismiss();
    const cartQuantity = amount;
    const validAmount = cartQuantity.toString();

    if (isNaN(cartQuantity) || cartQuantity < 1) {
      setShowAmountError(true);
      return;
    }
    setShowAmountError(false);
    const itemId = product.id;
    const isPkt = selectedUnit?.toLowerCase() === 'pkt';
    const itemCount = isPkt ? Math.round(cartQuantity) : 1;

    if (isInCart && itemId) {
      dispatch(
        updateCartItemQuantity({
          itemId,
          amount: validAmount,
          selectedUnit,
          itemCount,
        }),
      );
    } else {
      const newItem = {
        itemId,
        product: { ...product, selectedUnit, amount: validAmount },
        selectedUnit,
        quantity: itemCount,
      };
      dispatch(addToCart(newItem));
    }

    showToast('success', 'Added to cart');

    try {
      if (isInCart) {
        await updateCartAPI(itemId, cartQuantity, selectedUnit, token);
      } else {
        await addToCartAPI(itemId, cartQuantity, selectedUnit, token);
      }
    } catch (err) {
      console.error('Sync with server failed:', err.message || err);
      showToast('error', 'Failed to sync with server');
    }
  };

  useEffect(() => {
    setImageError(false);
  }, [product.image]);

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        if (isDropdownOpen) {
          setDropdownOpen(false);
        }
      }}
    >
      <View
        style={[
          styles.card,
          isDropdownOpen && { zIndex: 100, position: 'relative' },
        ]}
      >
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
            value={
              amount !== undefined && amount !== null ? String(amount) : ''
            }
            onChangeText={val => {
              setAmount(val);
              if (showAmountError && parseFloat(val) > 0) {
                setShowAmountError(false);
              }
            }}
            placeholder="Qty."
            keyboardType="number-pad"
            maxLength={4}
            inputAccessoryViewID={inputAccessoryViewID}
            style={[styles.textInput, showAmountError && styles.errorInput]}
            onFocus={() => {
              setDropdownOpen(false);
            }}
          />
          {Platform.OS === 'ios' && (
            <InputAccessoryView nativeID={inputAccessoryViewID}>
              <View
                style={{
                  backgroundColor: Colors.white,
                  padding: 10,
                  borderTopWidth: 1,
                  borderColor: Colors.borderColor,
                  alignItems: 'flex-end',
                }}
              >
                <TouchableOpacity onPress={Keyboard.dismiss}>
                  <Text
                    style={{
                      color: Colors.primary,
                      fontWeight: '600',
                      fontSize: Fonts.sizes.base,
                    }}
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </InputAccessoryView>
          )}

          <DropDownPicker
            open={isDropdownOpen}
            value={selectedUnit}
            items={unitOptions}
            setOpen={open => {
              if (unitOptions.length > 1) {
                Keyboard.dismiss();
                setDropdownOpen(open);
              }
            }}
            ArrowUpIconComponent={() =>
              isDropdownOpen ? (
                <Icon name="keyboard-arrow-up" size={15} />
              ) : null
            }
            ArrowDownIconComponent={() =>
              unitOptions.length > 1 ? (
                <Icon name="keyboard-arrow-down" size={15} />
              ) : null
            }
            setValue={setSelectedUnit}
            style={styles.dropdown}
            placeholder={selectedUnit}
            containerStyle={styles.dropdownContainer}
            dropDownContainerStyle={styles.dropdownBox}
            textStyle={styles.text}
            placeholderStyle={styles.placeholder}
            listMode="SCROLLVIEW"
            TickIconComponent={() => null}
            zIndex={1000}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!isModifiedSinceInCart || isRecentlyAdded) &&
              styles.buttonDisabled,
            (!isModifiedSinceInCart || isRecentlyAdded) && styles.buttonAdded,
          ]}
          onPress={handleAddToCart}
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
            {!isModifiedSinceInCart || isRecentlyAdded
              ? 'Added'
              : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
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
    minHeight: width < 360 ? '210@vs' : '230@vs',

    marginBottom: '5@vs',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  errorInput: {
    borderColor: 'red',
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
    minHeight: '32@vs',
  },
  dropdownBox: {
    borderColor: Colors.borderColor,
    justifyContent: 'center',
  },
  text: {
    fontSize: Fonts.sizes.sm,
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
    paddingVertical: Platform.OS === 'android' ? '2@vs' : '4@vs',
    width: '50%',
    height: '32@vs',
    fontSize: Fonts.sizes.sm,
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  accessory: {
    backgroundColor: Colors.white,
    padding: 8,
    borderTopWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'flex-end',
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

export default memo(ProductCard);
