import React from 'react';
import { Pressable, StyleSheet, View, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import textStyles from '../styles/textStyles';
import Colors from '../styles/colors';

const screenWidth = Dimensions.get('window').width;

const BackButton = ({
  title,
  onPress,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CustomerDashboard'); // fallback
    }
  };

  return (
    <View style={[innerStyle.container]}>
      {/* Back arrow with 5% left margin */}
      <View style={innerStyle.backIconWrapper}>
        <Pressable onPress={handlePress} style={innerStyle.backIconWrapper}>
          <Entypo name="chevron-left" size={25} color={Colors.secondary} />
        </Pressable>
      </View>

      {/* Title centered absolutely */}
      <Text style={[innerStyle.title, textStyles.subheading]}>{title}</Text>
    </View>
  );
};

export default BackButton;

const innerStyle = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    position: 'relative',
    zIndex: 100,
  },
  backIconWrapper: {
    marginLeft: '1%',
    zIndex: 10,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    marginLeft:-25,
    zIndex: 1,
  },
});
