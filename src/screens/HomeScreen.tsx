import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@/context/ThemeContext';
import { useHome } from '@/hooks/home/useHome';
import { HomeSearchBar } from '@/components/molecules/home/HomeSearchBar';
import { HomeSearchResults } from '@/components/molecules/home/HomeSearchResults';
import { HomeMapSection } from '@/components/organisms/home/HomeMapSection';
import { HomeBottomCard } from '@/components/organisms/home/HomeBottomCard';

type HomeScreenProps = {
  navigation: StackNavigationProp<Record<string, object | undefined>>;
};

/**
 * Home screen layout:
 *   1. SearchBar  — fixed at top, part of the layout flow (not absolute)
 *   2. Map area   — flex:1, fills remaining space; map controls float inside
 *   3. Bottom sheet — absolute, anchored to bottom of map area
 *   4. Search results — absolute, positioned below the search bar
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const vm = useHome({ navigation, selectedPaymentMethodId });
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    vm.setSearchInputRef(inputRef.current);
  }, [vm]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Search bar — part of the layout, not floating */}
      <HomeSearchBar
        ref={inputRef}
        query={vm.searchQuery}
        isSearching={vm.isSearching}
        showHelperText={vm.showHelperText}
        onChangeQuery={vm.setSearchQuery}
        onClear={vm.clearSearch}
        onLayoutHeight={vm.setSearchBarHeight}
      />

      {/* Map area — fills remaining space */}
      <View style={styles.mapArea}>
        <HomeMapSection
          center={vm.mapCenter}
          zoom={vm.mapZoom}
          cardHeight={vm.cardHeight}
          searchBarHeight={0}
          isCheckingActiveRide={vm.isCheckingActiveRide}
          isDriver={vm.isDriver}
          isLocating={vm.isLocating}
          userLocation={vm.userLocation}
          destination={vm.selectedDestination}
          onMapMove={vm.onMapMove}
          onRecenter={vm.onRecenter}
          onZoom={vm.setMapZoom}
          onNotifications={vm.goToNotifications}
        />

        {/* Bottom sheet — absolute inside map area */}
        <HomeBottomCard
          destination={vm.selectedDestination}
          isMinimized={vm.isMinimized}
          isLoadingCategories={vm.isLoadingCategories}
          rideCategories={vm.rideCategories}
          selectedCategoryId={vm.selectedCategoryId}
          selectedCategoryDuration={vm.selectedCategoryDuration}
          onToggleMinimized={vm.toggleMinimized}
          onSelectCategory={vm.onSelectCategory}
          onRequestTrip={vm.requestTrip}
          onLayoutHeight={vm.setCardHeight}
          onPaymentMethodChange={setSelectedPaymentMethodId}
        />

        {/* Search results — absolute, below the search bar */}
        <HomeSearchResults
          visible={vm.showResults}
          isSearching={vm.isSearching}
          searchQuery={vm.searchQuery}
          top={8}
          results={vm.searchResults}
          onClose={() => vm.setShowResults(false)}
          onSelect={vm.onSelectLocation}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  mapArea: {
    flex: 1,
  },
});
