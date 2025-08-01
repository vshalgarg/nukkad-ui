import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeRouter } from '../../hooks/useSafeRouter';

import CompleteOrderImage from '../../../assets/images/complete-order.svg';
import Design from '../../../assets/images/design.svg';
import styles from '../../styles/globalStyles';
import Fonts from '../../styles/font';
import Colors from '../../styles/colors';
import textStyles from '../../styles/textStyles';
import strings from '../../constants/string';

const PlaceOrder = () => {
  const { safePush } = useSafeRouter();

  const handleContinueShopping = () => {
    safePush('CustomerDashboard');
  };

  return (
    <View style={styles.pageContainer}>
      <Text
        style={[textStyles.heading, { textAlign: 'center', marginTop: '5%' }]}
      >
        {strings.checkout}
      </Text>
      <View style={innerStyle.container}>
        <View style={innerStyle.topImage}>
          <Design width="100%" height={100} />
        </View>
        <Text style={innerStyle.heading}>{strings.orderPlaced}</Text>
        <View style={innerStyle.image}>
          <CompleteOrderImage width={150} height={150} />
          <View style={innerStyle.textContainer}>
            <Text style={innerStyle.text}>{strings.thankyouForPurchase}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={innerStyle.btn}
          onPress={handleContinueShopping}
        >
          <Text style={innerStyle.btnText}>{strings.continueShopping}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PlaceOrder;

const innerStyle = StyleSheet.create({
  container: {
    gap: 30,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 20,
  },
  topImage: {
    alignItems: 'center',
  },
  image: {
    marginTop: 30,
    alignItems: 'center',
  },
  heading: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '600',
    textAlign: 'center',
  },
  textContainer: {
    marginTop: 20,
  },
  text: {
    textAlign: 'center',
    fontSize: Fonts.sizes.base,
    marginVertical: 2,
    lineHeight: 25,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 50,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 30,
  },
  btnText: {
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: Fonts.sizes.lg,
  },
});
