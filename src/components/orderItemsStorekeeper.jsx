import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
} from 'react-native';

const OrderItem = ({
  item,
  price,
  isEditable,
  onPriceChange,
  outOfStock,
  onToggleOutOfStock,
}) => {
  const {
    productImage,
    productName,
    selectedQty,
    selectedUnit,
    productPrice,
    itemId,
    productId,
  } = item;

  const id = itemId || productId;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: productImage }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name}>{productName}</Text>
        <Text style={styles.quantity}>
          {selectedQty} {selectedUnit}
        </Text>

        {isEditable ? (
          <TextInput
            style={styles.input}
            value={price || ''}
            onChangeText={value => onPriceChange(id, value)}
            placeholder="Enter Price"
            keyboardType="numeric"
          />
        ) : (
          <Text style={styles.price}>₹{price || productPrice}</Text>
        )}
      </View>

      {isEditable && (
        <TouchableOpacity
          onPress={() => onToggleOutOfStock(id)}
          style={styles.stockButton}
        >
          <Text
            style={[
              styles.stockText,
              outOfStock ? styles.outText : styles.inText,
            ]}
          >
            {outOfStock ? 'Out' : 'In'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 1, height: 2 },
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  quantity: {
    color: '#555',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  price: {
    marginTop: 4,
    color: '#333',
    fontWeight: '500',
  },
  stockButton: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  outText: {
    color: 'red',
  },
  inText: {
    color: 'green',
  },
});

export default memo(OrderItem);
