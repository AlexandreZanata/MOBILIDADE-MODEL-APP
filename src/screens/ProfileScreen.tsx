import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme';
import { ProfileHeaderCard } from '@/components/organisms/profile/ProfileHeaderCard';
import { ProfilePersonalInfoCard } from '@/components/organisms/profile/ProfilePersonalInfoCard';
import { ProfileMenuCard } from '@/components/organisms/profile/ProfileMenuCard';
import { useProfileScreen } from '@/hooks/profile/useProfileScreen';

type RootStackParamList = {
  Profile: undefined;
  History: undefined;
};

interface ProfileScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const {
    isLoading,
    isRefreshing,
    isUploadingCNH,
    isUploadingPhoto,
    userName,
    accountType,
    rating,
    profilePhotoUrl,
    personalInfo,
    menuItems,
    showCnhUpload,
    handleRefresh,
    handlePhotoUpload,
    handleUploadCnh,
    onMenuAction,
  } = useProfileScreen(navigation);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingVertical: spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} />}
      >
        <ProfileHeaderCard
          userName={userName}
          accountType={accountType}
          profilePhotoUrl={profilePhotoUrl}
          isUploadingPhoto={isUploadingPhoto}
          currentRating={rating?.currentRating}
          totalRatings={rating?.totalRatings}
          onEditPhoto={handlePhotoUpload}
        />
        <ProfilePersonalInfoCard
          items={personalInfo}
          isLoading={isLoading}
          showCnhUpload={showCnhUpload}
          isUploadingCNH={isUploadingCNH}
          onUploadCnh={handleUploadCnh}
        />
        <View>
          <ProfileMenuCard items={menuItems} onAction={onMenuAction} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

