import { useCallback, useMemo, useState } from 'react';
import { Alert, Appearance } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useProfileMediaActions } from '@/hooks/profile/useProfileMediaActions';
import { useTheme } from '@/context/ThemeContext';
import { isDriver } from '@/models/User';
import { API_BASE_URL } from '@/services/api';
import { getProfileImageUrl } from '@/services/profileImageCache';
import { openAppSettings } from '@/services/permissionsService';
import { profileService } from '@/services/profile/profileService';
import { requestNotificationPermissions } from '@/services/notificationService/permissions';
import { getProfileSettingsGroups } from '@/models/profile/settingsGroups';
import { maskCpfDisplay, maskPhoneDisplay } from '@/models/profile/maskSensitive';
import { tp, tProfileDriverStatus, tProfileUserType } from '@/i18n/profile';
import { ProfileDriverFieldRow, ProfileMenuAction, ProfileRating, ProfileUserType } from '@/models/profile/types';
import { formatProfileDate, isDriverStatusValue } from '@/hooks/profile/profileScreenHelpers';

export function useProfileScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { isDark } = useTheme();
  const ensureToken = useTokenRefresh();
  const { user, logout, refreshUserData, isLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rating, setRating] = useState<ProfileRating | null>(null);
  const [cachedPhotoUrl, setCachedPhotoUrl] = useState<string | undefined>(undefined);
  const [notifGranted, setNotifGranted] = useState(false);
  const [personalCollapsed, setPersonalCollapsed] = useState(true);
  const [revealedCpf, setRevealedCpf] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [draftBirthDate, setDraftBirthDate] = useState('');
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  const userIsDriver = Boolean(user && isDriver(user));
  const userTypeForUpload: ProfileUserType = userIsDriver ? 'driver' : 'passenger';

  const userName = user?.name || user?.email?.split('@')[0] || tp('unknownUser');
  const accountType = user?.type ? tProfileUserType(user.type) : tp('unknownUser');
  const driverStatus =
    user?.status && isDriverStatusValue(user.status) ? tProfileDriverStatus(user.status) : tp('noInfo');

  const driverRows: ProfileDriverFieldRow[] = useMemo(() => {
    if (!user || !userIsDriver) return [];
    return [
      { id: 'cnhNumber', label: tp('cnhNumber'), value: user.cnhNumber || tp('noInfo') },
      { id: 'cnhCategory', label: tp('cnhCategory'), value: user.cnhCategory || tp('noInfo') },
      { id: 'cnhExpiration', label: tp('cnhExpirationDate'), value: formatProfileDate(user.cnhExpirationDate) },
      { id: 'driverStatus', label: tp('driverStatus'), value: driverStatus },
    ];
  }, [driverStatus, user, userIsDriver]);

  const cpfRaw = user?.cpf?.trim() ?? '';
  const phoneRaw = user?.phone?.trim() ?? '';
  const cpfShown = useMemo(() => {
    if (!cpfRaw) return tp('noInfo');
    return revealedCpf ? cpfRaw : maskCpfDisplay(cpfRaw);
  }, [cpfRaw, revealedCpf]);

  const phoneShown = useMemo(() => {
    if (!phoneRaw) return tp('noInfo');
    return revealedPhone ? phoneRaw : maskPhoneDisplay(phoneRaw);
  }, [phoneRaw, revealedPhone]);

  const profileRatingUi = useMemo(() => {
    if (!rating || rating.totalRatings < 1) return null;
    const r10 = Number(rating.currentRating);
    if (Number.isNaN(r10) || r10 <= 0) return null;
    return {
      ratingTenScale: r10,
      displayValue: (r10 / 2).toFixed(1),
      totalRatings: rating.totalRatings,
    };
  }, [rating]);

  const profilePhotoUrl = useMemo(() => {
    if (cachedPhotoUrl) return cachedPhotoUrl;
    if (!user?.photoUrl) return undefined;
    const profileId = user.userId || user.id;
    if (!profileId) return undefined;
    return `${API_BASE_URL}/profile-photos/${profileId}?t=${Date.now()}`;
  }, [cachedPhotoUrl, user?.id, user?.photoUrl, user?.userId]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      await ensureToken();
      await refreshUserData();
      const ratingResponse = await profileService.getRating(userIsDriver);
      if (ratingResponse.success) {
        setRating(ratingResponse.data ?? null);
      }
      const profileId = user.userId || user.id;
      if (profileId && user.photoUrl) {
        const apiUrl = `${API_BASE_URL}/profile-photos/${profileId}?t=${Date.now()}`;
        const cachedUrl = await getProfileImageUrl(profileId, apiUrl);
        setCachedPhotoUrl(cachedUrl);
      } else {
        setCachedPhotoUrl(undefined);
      }
      const perm = await Notifications.getPermissionsAsync();
      setNotifGranted(perm.status === 'granted');
    } finally {
      setIsRefreshing(false);
    }
  }, [ensureToken, refreshUserData, user, userIsDriver]);

  const onProfilePhotoCached = useCallback((url: string) => {
    setCachedPhotoUrl(url);
  }, []);

  const { isUploadingCNH, isUploadingPhoto, handlePhotoUpload, handleUploadCnh } = useProfileMediaActions({
    ensureToken,
    refreshUserData,
    userTypeForUpload,
    profilePhotoUserId: user?.userId || user?.id,
    onProfilePhotoCached,
    onAfterCnhUpload: refreshProfile,
  });

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
      return () => {
        setRevealedCpf(false);
        setRevealedPhone(false);
        setIsEditingPersonal(false);
      };
    }, [refreshProfile])
  );

  const onNotificationsToggle = useCallback(async (next: boolean) => {
    if (next) {
      const ok = await requestNotificationPermissions();
      setNotifGranted(ok);
      if (!ok) {
        Alert.alert(tp('permissionTitle'), tp('notificationsPermissionDescription'));
      }
      return;
    }
    setNotifGranted(false);
    Alert.alert(tp('notificationsOffTitle'), tp('notificationsOffBody'), [
      { text: tp('cancel'), style: 'cancel' },
      { text: tp('openSettings'), onPress: () => openAppSettings() },
    ]);
  }, []);

  const onDarkModeToggle = useCallback((next: boolean) => {
    Appearance.setColorScheme(next ? 'dark' : 'light');
  }, []);

  const couponsBadgeCount = useMemo<number | undefined>(() => undefined, []);

  const settingsGroups = useMemo(
    () =>
      getProfileSettingsGroups(
        notifGranted,
        onNotificationsToggle,
        isDark,
        onDarkModeToggle,
        couponsBadgeCount
      ),
    [couponsBadgeCount, isDark, notifGranted, onDarkModeToggle, onNotificationsToggle]
  );

  const onSettingsRow = useCallback(
    (action: ProfileMenuAction) => {
      if (action === 'history') {
        if (userIsDriver) {
          navigation.navigate('DriverRides' as never);
        } else {
          navigation.navigate('History' as never);
        }
        return;
      }
      if (action === 'notifications' || action === 'dark-mode') {
        return;
      }
      if (action === 'language') {
        Alert.alert(tp('language'), tp('languageCurrentPtBr'));
        return;
      }
      Alert.alert(tp('genericErrorTitle'), tp('featureUnavailable'));
    },
    [navigation, userIsDriver]
  );

  const onVerifyEmail = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'VerifyEmail',
        params: {
          email: user?.email,
          userType: userIsDriver ? 'driver' : 'passenger',
        },
      })
    );
  }, [navigation, user?.email, userIsDriver]);

  const onToggleReveal = useCallback((field: 'cpf' | 'phone') => {
    if (field === 'cpf') setRevealedCpf((v) => !v);
    else setRevealedPhone((v) => !v);
  }, []);

  const onPressEditSave = useCallback(() => {
    if (!user) return;
    if (!isEditingPersonal) {
      setDraftName(user.name || '');
      setDraftEmail(user.email || '');
      setDraftPhone(user.phone || '');
      setDraftBirthDate(user.birthDate || '');
      setIsEditingPersonal(true);
      return;
    }
    Alert.alert(tp('genericErrorTitle'), tp('profileUpdateUnavailable'));
    setIsEditingPersonal(false);
  }, [isEditingPersonal, user]);

  const showCnhUpload =
    Boolean(user) &&
    userIsDriver &&
    (!user?.cnhNumber || user?.status === 'AWAITING_CNH' || user?.status === 'ONBOARDING');

  const showDeleteAccount = false;

  const onDeleteAccount = useCallback(() => {
    Alert.alert(tp('deleteAccountTitle'), tp('deleteAccountDescription'), [
      { text: tp('cancel'), style: 'cancel' },
      { text: tp('deleteAccountConfirm'), style: 'destructive', onPress: () => undefined },
    ]);
  }, []);

  const onConfirmLogout = useCallback(() => {
    void logout();
  }, [logout]);

  return {
    isLoading,
    isRefreshing,
    isUploadingCNH,
    isUploadingPhoto,
    userName,
    accountType,
    userTypeForUpload,
    profileRatingUi,
    profilePhotoUrl,
    userIsDriver,
    settingsGroups,
    showCnhUpload,
    personalCollapsed,
    setPersonalCollapsed,
    isEditingPersonal,
    draftName,
    setDraftName,
    draftEmail,
    setDraftEmail,
    draftPhone,
    setDraftPhone,
    draftBirthDate,
    setDraftBirthDate,
    nameDisplay: userName,
    emailDisplay: user?.email || tp('noInfo'),
    emailVerified: Boolean(user?.emailVerified),
    birthDisplay: formatProfileDate(user?.birthDate),
    cpfLabel: tp('cpf'),
    phoneLabel: tp('phone'),
    cpfShown,
    phoneShown,
    revealedCpf,
    revealedPhone,
    driverRows,
    handleRefresh: refreshProfile,
    handlePhotoUpload,
    handleUploadCnh,
    onSettingsRow,
    onVerifyEmail,
    onToggleReveal,
    onPressEditSave,
    logoutDialogVisible,
    setLogoutDialogVisible,
    onConfirmLogout,
    showDeleteAccount,
    onDeleteAccount,
  };
}
