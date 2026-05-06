import React, { useEffect, useRef } from 'react';
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

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const vm = useHome({ navigation });
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    vm.setSearchInputRef(inputRef.current);
  }, [vm]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
  });

  return (
    <View style={styles.container}>
      <HomeSearchBar
        ref={inputRef}
        query={vm.searchQuery}
        isSearching={vm.isSearching}
        showHelperText={vm.showHelperText}
        onChangeQuery={vm.setSearchQuery}
        onClear={vm.clearSearch}
        onLayoutHeight={vm.setSearchBarHeight}
      />
      <HomeSearchResults
        visible={vm.showResults}
        isSearching={vm.isSearching}
        searchQuery={vm.searchQuery}
        top={vm.searchBarHeight + 8}
        results={vm.searchResults}
        onClose={() => vm.setShowResults(false)}
        onSelect={vm.onSelectLocation}
      />
      <HomeMapSection
        center={vm.mapCenter}
        zoom={vm.mapZoom}
        cardHeight={vm.cardHeight}
        searchBarHeight={vm.searchBarHeight}
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
      <HomeBottomCard
        destination={vm.selectedDestination}
        isMinimized={vm.isMinimized}
        onToggleMinimized={vm.toggleMinimized}
        onRequestTrip={vm.requestTrip}
        onLayoutHeight={vm.setCardHeight}
      />
    </View>
  );
};
