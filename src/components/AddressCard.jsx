import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '../styles/colors.js';
import Fonts from '../styles/font.js';

const { width } = Dimensions.get('window');

const AddressCard = ({
  item,
  onEdit,
  onDelete,
  onSelect,
  onMarkDefault,
  isSelected,
  hideDelete = false,
  source = 'sidebar', // 'cart' | 'sidebar' | 'minimal'
  showChangeAddress = false,
}) => {
  const allowActions = source === 'sidebar';

  return (
    <Pressable
      onPress={onSelect}
      style={[styles.card, isSelected && styles.selectedCard]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.infoContainer}>
          {item.name && (
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name}
            </Text>
          )}

          <View style={styles.addressLines}>
            <Text style={styles.secondaryText}>
              {[item.addressLine1, item.addressLine2, item.landmark]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          <Text style={styles.cityLine} numberOfLines={1}>
            {item.city}, {item.state} - {item.pincode}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          {showChangeAddress && (
            <Pressable style={styles.changeAddressBtn} onPress={onSelect}>
              <Text style={styles.changeAddressText}>Change Address</Text>
            </Pressable>
          )}

          {allowActions && (
            <View style={styles.btnContainer}>
              <View style={styles.editDeleteRow}>
                <Pressable
                  style={[styles.editButton, styles.primaryButton]}
                  onPress={() => onEdit(item)}
                >
                  <FontAwesome name="edit" size={24} color={Colors.primary} />
                </Pressable>

                {!hideDelete && !item.isDefault && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => onDelete(item)}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={24}
                      color={Colors.secondary}
                    />
                  </Pressable>
                )}
              </View>

              {!item.isDefault && (
                <Pressable
                  onPress={() => onMarkDefault?.(item.id)}
                  style={styles.defaultBtn}
                >
                  <Text style={styles.defaultBtnText}>Mark as Default</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderColor: Colors.borderColor,
    borderWidth: 1,
    elevation: 2,
    padding: 14,
    position: 'relative',
    height: 110,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  nameText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  addressLines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
  },
  cityLine: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  btnContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  editDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 100,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  primaryButton: {
    paddingVertical: 4,
  },
  deleteButton: {
    paddingVertical: 4,
  },
  defaultBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  defaultBtnText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  changeAddressBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  changeAddressText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Fonts.sizes.sm,
  },
});

export default AddressCard;
