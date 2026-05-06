import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';
import { tp } from '@/i18n/profile';
import { ProfileHeaderCard } from '@/components/organisms/profile/ProfileHeaderCard';
import { ProfileRatingStarsCard } from '@/components/molecules/profile/ProfileRatingStarsCard';
import { ProfilePersonalInfoSection } from '@/components/organisms/profile/ProfilePersonalInfoSection';
import { ProfileSettingsGroups } from '@/components/organisms/profile/ProfileSettingsGroups';
import { ProfileDangerZone } from '@/components/molecules/profile/ProfileDangerZone';
import { ProfileLogoutDialog } from '@/components/molecules/profile/ProfileLogoutDialog';
import { useProfileScreen } from '@/hooks/profile/useProfileScreen';

export const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const vm = useProfileScreen();

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
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl + insets.bottom,
    },
    screenIntro: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    screenTitle: { ...typography.display, color: colors.textPrimary },
    screenSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.handleRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.screenIntro}>
          <Text style={styles.screenTitle}>{tp('screenTitle')}</Text>
          <Text style={styles.screenSubtitle}>{tp('screenSubtitle')}</Text>
        </View>
        <ProfileHeaderCard
          userName={vm.userName}
          email={vm.emailDisplay}
          accountType={vm.accountType}
          profilePhotoUrl={vm.profilePhotoUrl}
          isUploadingPhoto={vm.isUploadingPhoto}
          isDriverAccount={vm.userIsDriver}
          onEditPhoto={vm.handlePhotoUpload}
        />
        {vm.profileRatingUi ? (
          <ProfileRatingStarsCard
            ratingTenScale={vm.profileRatingUi.ratingTenScale}
            displayValue={vm.profileRatingUi.displayValue}
            totalRatings={vm.profileRatingUi.totalRatings}
          />
        ) : null}
        <ProfilePersonalInfoSection
          isLoading={vm.isLoading}
          isEditing={vm.isEditingPersonal}
          onPressEditSave={vm.onPressEditSave}
          draftName={vm.draftName}
          onChangeDraftName={vm.setDraftName}
          draftEmail={vm.draftEmail}
          onChangeDraftEmail={vm.setDraftEmail}
          draftPhone={vm.draftPhone}
          onChangeDraftPhone={vm.setDraftPhone}
          draftBirthDate={vm.draftBirthDate}
          onChangeDraftBirthDate={vm.setDraftBirthDate}
          nameDisplay={vm.nameDisplay}
          emailDisplay={vm.emailDisplay}
          emailVerified={vm.emailVerified}
          birthDisplay={vm.birthDisplay}
          cpfLabel={vm.cpfLabel}
          phoneLabel={vm.phoneLabel}
          cpfShown={vm.cpfShown}
          phoneShown={vm.phoneShown}
          revealedCpf={vm.revealedCpf}
          revealedPhone={vm.revealedPhone}
          onToggleReveal={vm.onToggleReveal}
          onPressVerifyEmail={vm.onVerifyEmail}
          showCnhUpload={vm.showCnhUpload}
          isUploadingCNH={vm.isUploadingCNH}
          onUploadCnh={vm.handleUploadCnh}
          driverRows={vm.driverRows}
        />
        <View>
          <ProfileSettingsGroups groups={vm.settingsGroups} onRowPress={vm.onSettingsRow} />
        </View>
        <ProfileDangerZone
          onLogoutPress={() => vm.setLogoutDialogVisible(true)}
          onDeleteAccountPress={vm.onDeleteAccount}
          showDeleteAccount={vm.showDeleteAccount}
        />
      </ScrollView>
      <ProfileLogoutDialog
        visible={vm.logoutDialogVisible}
        onDismiss={() => vm.setLogoutDialogVisible(false)}
        onConfirm={vm.onConfirmLogout}
      />
    </SafeAreaView>
  );
};
