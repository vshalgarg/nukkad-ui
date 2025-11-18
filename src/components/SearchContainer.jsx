import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  Keyboard,
  Pressable,
} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../styles/colors';
import strings from '../constants/string';
import { ScaledSheet } from 'react-native-size-matters';
import Fonts from '../styles/font';
import { SearchContext } from '../contexts/searchContext';
import { useFocusEffect } from '@react-navigation/native';

const RECENT_KEY = '@recent_searches';
const MAX_RECENTS = 5;

const SearchContainer = ({
  query,
  onSearchSubmit,
  autoSearchOnThreeLetters = false,
}) => {
  const { queryInput, setQueryInput } = useContext(SearchContext);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const [recentSearches, setRecentSearches] = useState([]);
  const [visibleSuggestions, setVisibleSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    setQueryInput(query || '');
  }, [query]);

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(RECENT_KEY);
          const parsed = raw ? JSON.parse(raw) : [];
          setRecentSearches(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.warn('Failed to load recent searches', e);
        }
      })();

      return () => {
        setFocused(false);
        setVisibleSuggestions([]);
      };
    }, []),
  );

  useEffect(() => {
    if (!focused) {
      setVisibleSuggestions([]);
      return;
    }

    const q = (queryInput || '').trim().toLowerCase();

    if (q === '') {
      setVisibleSuggestions(recentSearches);
    } else {
      const filtered = recentSearches.filter(r => r.toLowerCase().includes(q));
      setVisibleSuggestions(filtered);
    }
  }, [focused, queryInput, recentSearches]);

  useEffect(() => {
    if (!autoSearchOnThreeLetters) return;

    if (debounceTimeout) clearTimeout(debounceTimeout);

    if (queryInput.length >= 3) {
      const timeout = setTimeout(() => {
        handleSubmit(queryInput);
      }, 500);

      setDebounceTimeout(timeout);
    } else if (queryInput.length === 0) {
      onSearchSubmit?.('');
    }

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [queryInput, autoSearchOnThreeLetters]);

  const saveRecent = async term => {
    try {
      const t = term.trim();
      if (!t) return;

      const prev = JSON.parse(await AsyncStorage.getItem(RECENT_KEY)) || [];

      const updated = [t, ...prev.filter(item => item !== t)];

      const sliced = updated.slice(0, MAX_RECENTS);

      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(sliced));

      setRecentSearches(sliced);
    } catch (e) {
      console.warn('Failed to save recent search', e);
    }
  };

  const removeRecent = async term => {
    try {
      const updated = recentSearches.filter(r => r !== term);

      setRecentSearches(updated);
      setVisibleSuggestions(updated);

      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Remove failed', e);
    }
  };

  const clearAllRecents = async () => {
    try {
      setRecentSearches([]);
      setVisibleSuggestions([]);
      await AsyncStorage.removeItem(RECENT_KEY);
    } catch (e) {
      console.warn('Clear all failed', e);
    }
  };

  const handleClear = () => {
    setQueryInput('');
    onSearchSubmit?.('');
    Keyboard.dismiss();
  };

  const handleSubmit = text => {
    const value = (text ?? queryInput ?? '').trim();

    setQueryInput(value);
    onSearchSubmit?.(value);
    saveRecent(value);

    setFocused(false);
  };

  const onSelectSuggestion = text => {
    setQueryInput(text);
    onSearchSubmit?.(text);
    saveRecent(text);
    setFocused(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.iconContainerOne}>
          <Entypo
            name="magnifying-glass"
            size={20}
            color={Colors.secondaryText}
            style={styles.icon}
          />
        </View>

        <TextInput
          ref={inputRef}
          style={styles.queryInput}
          placeholder={strings.searchPlaceholder}
          placeholderTextColor={Colors.secondaryText}
          value={queryInput}
          onChangeText={setQueryInput}
          onSubmitEditing={() => handleSubmit(queryInput)}
          maxLength={25}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
        />
        <View style={styles.iconContainerTwo}>
          {queryInput.length > 0 && (
            <TouchableOpacity onPressIn={handleClear} style={styles.icon}>
              <Entypo name="cross" size={20} color={Colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {focused && visibleSuggestions.length > 0 && (
        <View style={styles.suggestionsWrap}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsTitle}>Recent searches</Text>
            <Pressable onPress={clearAllRecents} hitSlop={8}>
              <Text style={styles.clearAllText}>Clear</Text>
            </Pressable>
          </View>

          <FlatList
            keyboardShouldPersistTaps="handled"
            data={visibleSuggestions}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <View style={styles.suggestionRow}>
                <TouchableOpacity
                  style={styles.suggestionTouch}
                  onPressIn={() => onSelectSuggestion(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPressIn={() => removeRecent(item)}
                >
                  <Entypo name="cross" size={16} color={Colors.secondaryText} />
                </TouchableOpacity>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </View>
      )}
    </View>
  );
};

const styles = ScaledSheet.create({
  container: {
    marginBottom: '5@vs',
    paddingHorizontal: '20@s',
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  innerContainer: {
    width: '100%',
    borderWidth: 0.5,
    position: 'relative',
    borderRadius: '50@s',
    flexDirection: 'row',
    marginVertical: '10@vs',
    height: '40@vs',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: '8@s',
  },
  iconContainerOne: {
    width: '12%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  iconContainerTwo: {
    width: '12%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  queryInput: {
    width: '75%',
    textAlignVertical: 'center',
    color: Colors.secondary,
    fontSize: Fonts.sizes.sm,
  },

  suggestionsWrap: {
    position: 'absolute',
    top: '60@vs',
    left: '20@s',
    right: '20@s',
    zIndex: 9,
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#e5e5e5',
    paddingVertical: 6,
    maxHeight: 300,
  },

  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 6,
  },
  suggestionsTitle: {
    fontSize: Fonts.sizes.xs,
    color: Colors.secondaryText,
  },
  clearAllText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  suggestionTouch: {
    flex: 1,
  },
  suggestionText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  removeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  sep: {
    height: 0.5,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
});

export default React.memo(SearchContainer);
