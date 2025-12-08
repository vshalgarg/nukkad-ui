import React, { useCallback, useRef } from 'react';
import { Animated, Dimensions, Image, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScaledSheet } from 'react-native-size-matters';

const { width: screenWidth } = Dimensions.get('window');

// Layout config
const peekPercent = 0.05;
const gapPercent = 0.025;
const itemWidth = screenWidth * 0.85;
const sidePeek = screenWidth * peekPercent;
const sideGap = screenWidth * gapPercent;
const fullItemSpace = itemWidth + sideGap * 2;

// Backend like data (ONLY IMAGE)
const originalSlides = [
  { id: '1', image: 'https://picsum.photos/600/400' },
  { id: '2', image: 'https://picsum.photos/601/400' },
  { id: '3', image: 'https://picsum.photos/602/400' },
];

// Loop slides
const slides = [
  originalSlides[originalSlides.length - 1],
  ...originalSlides,
  originalSlides[0],
];

const AutoSlider = () => {
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(fullItemSpace)).current;
  const indexRef = useRef(1);
  const timerRef = useRef(null);

  const scrollToIndex = (index, animated = true) => {
    scrollViewRef.current?.scrollTo({
      x: index * fullItemSpace,
      animated,
    });
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    timerRef.current = setInterval(() => {
      indexRef.current += 1;
      scrollToIndex(indexRef.current);
    }, 3500);
  };

  const stopAutoScroll = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleScrollEnd = e => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / fullItemSpace);

    // Fake first & last for infinite loop
    if (index === 0) {
      indexRef.current = originalSlides.length;
      setTimeout(() => scrollToIndex(indexRef.current, false), 20);
    } else if (index === slides.length - 1) {
      indexRef.current = 1;
      setTimeout(() => scrollToIndex(indexRef.current, false), 20);
    } else {
      indexRef.current = index;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const timeout = setTimeout(() => {
        scrollToIndex(indexRef.current, false);
        startAutoScroll();
      }, 100);

      return () => {
        clearTimeout(timeout);
        stopAutoScroll();
      };
    }, []),
  );

  return (
    <View style={{ height: 220 }}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={fullItemSpace}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: sidePeek }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {slides.map((item, index) => (
          <View
            key={index.toString()}
            style={[
              styles.slideContainer,
              {
                width: itemWidth,
                marginHorizontal: sideGap,
              },
            ]}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.fullImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* ----------- INDICATOR DOTS ----------- */}
      <View style={styles.indicatorContainer}>
        {originalSlides.map((_, i) => {
          const inputRange = [
            (i + 1 - 1) * fullItemSpace,
            (i + 1) * fullItemSpace,
            (i + 1 + 1) * fullItemSpace,
          ];

          const width = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.indicatorDot,
                {
                  width,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

export default React.memo(AutoSlider);

// ---------------- STYLES -----------------

const styles = ScaledSheet.create({
  slideContainer: {
    borderRadius: '16@s',
    overflow: 'hidden',
    height: '150@vs',
    elevation: 3,
    backgroundColor: '#eee',
  },

  fullImage: {
    width: '100%',
    height: '100%',
  },

  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: '8@vs',
  },

  indicatorDot: {
    height: '4@vs',
    backgroundColor: '#3B82F6',
    borderRadius: '4@s',
    marginHorizontal: '4@s',
  },
});
