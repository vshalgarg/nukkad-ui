// No change in imports
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Pressable,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { showToast } from '../../utils/toastUtils';

import BackButton from '../../components/BackButton';
import CustomButton from '../../components/CustomButton';
import Colors from '../../styles/colors';
import Fonts from '../../styles/font';
import { rateStore } from '../../services/customer/ratingService';
import { useAuth } from '../../contexts/authContext';

// ✅ SVG for success modal
import TickIcon from '../../../assets/images/review.svg';
import { useStore } from '../../contexts/storeContext';
import strings from '../../constants/string';
import textStyles from '../../styles/textStyles';

const RateStore = () => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const feedbackRef = useRef(null);
  const navigation = useNavigation();

  const handleStarPress = value => setRating(value);

  const { token } = useAuth();
  const { storeData } = useStore();
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const storeName = storeData?.storeName;
  const handleSubmitReview = async () => {
    if (rating === 0) {
      showToast('error', strings.provideRatingAndFeedback);
      return;
    }

    // ❗️Check if store info is available
    const storeKeeperId = storeData?.storekeeperId || storeData?.id;
    if (!storeKeeperId) {
      showToast('error', strings.noStoresFound, strings.noStoresFound2);

      return;
    }

    try {
      await rateStore(
        {
          storeKeeperId,
          review: feedback,
          rating,
        },
        token,
      );

      Keyboard.dismiss();
      feedbackRef.current?.blur();
      setShowThankYou(true);
    } catch (error) {
      showToast('error', strings.failedToSubmitRating, error.message);
    }
  };

  const handleDone = () => {
    setShowThankYou(false);
    feedbackRef.current?.blur();
    navigation.navigate('CustomerDashboard');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.pageContainer}>
        <BackButton
          title={strings.rateStore}
          backgroundColor={Colors.backbuttonColor}
        />
        <View style={styles.container}>
          {storeName ? (
            <Text
              style={[
                textStyles.heading,
                {
                  textAlign: 'center',
                  marginVertical: 25,
                  color: Colors.secondary,
                },
              ]}
            >
              Store: {storeName}
            </Text>
          ) : (
            <Text
              style={[
                textStyles.heading,
                {
                  textAlign: 'center',
                  marginVertical: 25,
                  color: Colors.secondary,
                },
              ]}
            >
              Please add or select an address.
            </Text>
          )}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map(value => (
              <TouchableOpacity
                key={value}
                style={styles.starButton}
                onPress={() => handleStarPress(value)}
              >
                <Ionicons
                  name="star"
                  size={40}
                  color={value <= rating ? Colors.primary : Colors.disabledText}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            ref={feedbackRef}
            style={styles.textArea}
            placeholder={strings.feedbackPlaceholder}
            multiline
            value={feedback}
            onChangeText={setFeedback}
          />

          <Text style={styles.wordCount}>
            {feedback.length} {strings.characters}
          </Text>
        </View>
        {!isKeyboardVisible && (
          <View style={styles.btnContainer}>
            <CustomButton
              title={strings.submitReview}
              onPress={handleSubmitReview}
            />
          </View>
        )}

        <Modal transparent visible={showThankYou} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <TickIcon width={80} height={80} />
              <Text style={styles.modalTitle}>{strings.thankyou}</Text>
              <Text style={styles.modalMessage}>
                {strings.appriciateFeedback}
              </Text>
              <CustomButton title={strings.done} onPress={handleDone} />
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RateStore;

const screenHeight = Dimensions.get('screen').height;

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: screenHeight * 0.1,
  },
  heading: {
    fontSize: Fonts.sizes.lg + 2,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  starButton: {
    padding: 5,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 10,
    padding: 12,
    fontSize: Fonts.sizes.base,
    textAlignVertical: 'top',
    height: 160,
    backgroundColor: Colors.white,
  },
  wordCount: {
    textAlign: 'right',
    marginVertical: 8,
    fontSize: 12,
    color: Colors.secondaryText,
  },
  btnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: '10',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: Colors.white,
    padding: 30,
    borderRadius: 16,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  modalTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginVertical: 15,
  },
  modalMessage: {
    fontSize: Fonts.sizes.base,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
});
