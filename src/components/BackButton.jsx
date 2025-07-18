import React from 'react';
import { Pressable, StyleSheet, View, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import textStyles from '../styles/textStyles';
import Fonts from '../styles/font';
import Colors from '../styles/colors';

const screenWidth = Dimensions.get('window').width;

const BackButton = ({
  title,
  backgroundColor = Colors.backbuttonColor,
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
      <Pressable onPress={handlePress} style={innerStyle.backIconWrapper}>
        <Entypo name="chevron-left" size={24} color={Colors.secondary} />
      </Pressable>

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
    marginLeft: '5%',
    zIndex: 10,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 1,
  },
});
