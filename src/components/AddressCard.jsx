import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Colors from '../styles/colors.js';
import Fonts from '../styles/font.js';
import strings from '../constants/string.js';
import { ScaledSheet } from 'react-native-size-matters';


const AddressCard = ({
  item,
  onEdit,
  onDelete,
  onSelect,
  onMarkDefault,
  isSelected,
  hideDelete = false,
  source = 'sidebar', 
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
            <Text style={styles.nameText} numberOfLines={2}>
              {item.name}
            </Text>
          )}

          <View style={styles.addressLines}>
            <Text style={styles.secondaryText}>
              {[item.addressLine1, item.addressLine2]
                .filter(Boolean)
                .map(line => line.trim() + ',')
                .join(' ')}
            </Text>

            <Text style={styles.secondaryText} numberOfLines={2}>
              {[item.landmark, item.city]
                .filter(Boolean)
                .map(line => line.trim() + ',')
                .join(' ')}
            </Text>

            <Text style={styles.secondaryText} numberOfLines={2}>
              {[item.state, item.pincode].filter(Boolean).join(' - ')}
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          {showChangeAddress && (
            <Pressable style={styles.changeAddressBtn} onPress={onSelect}>
              <Text style={styles.changeAddressText}>
                {strings.changeAddress}
              </Text>
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

              {!item.isDefault ? (
                <Pressable
                  onPress={() => onMarkDefault?.(item.id)}
                  style={styles.defaultBtn}
                >
                  <Text style={styles.defaultBtnText}>
                    {strings.markAsDefault}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = ScaledSheet.create({
  card: {
    marginTop: '16@vs',
    borderRadius: '12@s',
    backgroundColor: Colors.white,
    borderColor: Colors.borderColor,
    borderWidth: 2,
    elevation: 2,
    padding: '12@s',
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    padding: '12@s',
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoContainer: {
    height: '100%',
    width: '50%',
    flex: 1,
  },
  nameText: {
    fontSize: Fonts.sizes.base,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: '4@vs',
  },
  addressLines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: '4@vs',
    paddingRight: '4@s',
  },
  secondaryText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondaryText,
  },
  actionContainer: {
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  btnContainer: {
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
    alignItems: 'stretch',
  },
  editDeleteRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100@s',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: '15@s',
  },
  primaryButton: {
    paddingVertical: '4@vs',
  },
  deleteButton: {
    paddingVertical: '4@vs',
  },
  defaultBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: '20@s',
    paddingHorizontal: '10@s',
    paddingVertical: '4@vs',
    marginTop: '10@vs',
    alignSelf: 'flex-start',
  },
  defaultBtnText: {
    color: Colors.primary,
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
  },
  changeAddressBtn: {
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '20@s',
    backgroundColor: Colors.primary,
    marginTop: '4@vs',
  },
  changeAddressText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: Fonts.sizes.sm,
  },
});

export default AddressCard;
