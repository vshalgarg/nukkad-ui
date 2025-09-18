import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Grocery from '../../assets/images/grocery-logo.svg';
import { useSafeRouter } from '../hooks/useSafeRouter';
import Colors from '../styles/colors.js';
import { useDispatch, useSelector } from 'react-redux';
import { setUserType } from './../store/userSlice.js';
import strings from '../constants/string.js';
import Fonts from '../styles/font.js';

import { ScaledSheet } from 'react-native-size-matters';
import useBackHandlerControl from '../hooks/useBackHandlerControl.jsx';

export default function HomeScreen() {
  useBackHandlerControl({ confirmBack: true });
  const { safePush } = useSafeRouter();
  const dispatch = useDispatch();
  const userType = useSelector(state => state.user.userType);

  const options = ['I AM CUSTOMER', 'I AM STOREKEEPER'];

  return (
    <View style={localStyles.pageContainer}>
      <Grocery style={localStyles.logo} />

      <Text style={localStyles.heading}>{strings.selectUserType}</Text>

      <View style={localStyles.buttonContainer}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            onPress={() => {
              dispatch(setUserType(option));
              safePush('MobileOtpScreen');
            }}
            style={[
              localStyles.button,
              {
                borderColor:
                  userType === option ? Colors.selectUser : Colors.userRoles,
                backgroundColor:
                  userType === option
                    ? Colors.selectUserBackground
                    : Colors.white,
              },
            ]}
            accessibilityLabel={`Select ${option}`}
          >
            <Text
              style={[
                localStyles.buttonText,
                {
                  color:
                    userType === option ? Colors.selectUser : Colors.secondary,
                  fontWeight: userType === option ? 'bold' : 'normal',
                },
              ]}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const localStyles = ScaledSheet.create({
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '40@s',
    backgroundColor: Colors.white,
  },
  logo: {
    marginBottom: '30@vs',
  },
  heading: {
    fontSize: Fonts.sizes.xxl,
    marginBottom: '20@vs',
    fontWeight: 'bold',
    color: Colors.secondary,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: '12@vs',
  },
  button: {
    height: '40@vs',
    borderRadius: '24@s',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '20@s',
  },
  buttonText: {
    fontSize: Fonts.sizes.base,
  },
});
