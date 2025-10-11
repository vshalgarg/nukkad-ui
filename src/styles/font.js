import { moderateScale } from 'react-native-size-matters';

const Fonts = {
  sizes: {
    xxs: moderateScale(10),
    xs: moderateScale(12),
    sm: moderateScale(14),
    base: moderateScale(16),
    lg: moderateScale(18),
    xl: moderateScale(20),
    xxl: moderateScale(24),
  },
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    bold: '600',
  },
  styles: {
    normal: 'normal',
    italic: 'italic',
  },
};

export default Fonts;
