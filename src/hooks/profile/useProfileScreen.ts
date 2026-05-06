import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { isDriver } from '@/models/User';
import { API_BASE_URL } from '@/services/api';
import { getProfileImageUrl } from '@/services/profileImageCache';
import { openAppSettings } from '@/services/permissionsService';
import { profileService } from '@/services/profile/profileService';
import { tp, tProfileDriverStatus, tProfileUserType } from '@/i18n/profile';
import { DriverStatus, ProfileMenuItem, ProfileRating, ProfileUserType } from '@/models/profile/types';

interface NavigationShape {
  navigate(route: 'History'): void;
}

interface UserInfoItem {
  id: string;
  label: string;
  value: string;
  verified?: boolean;
}

function formatDate(value?: string): string {
  if (!value) return tp('noInfo');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
}

const DRIVER_STATUS_VALUES: DriverStatus[] = [
  'ONBOARDING',
  'AWAITING_CNH',
  'CNH_REVIEW',
  'AWAITING_VEHICLE',
  'VEHICLE_REVIEW',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
];

function isDriverStatus(value: string): value is DriverStatus {
  return DRIVER_STATUS_VALUES.some((status) => status === value);
}

export function useProfileScreen(navigation: NavigationShape) {
  const ensureToken = useTokenRefresh();
  const { user, logout, refreshUserData, isLoading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingCNH, setIsUploadingCNH] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [rating, setRating] = useState<ProfileRating | null>(null);
  const [cachedPhotoUrl, setCachedPhotoUrl] = useState<string | undefined>(undefined);

  const userIsDriver = Boolean(user && isDriver(user));
  const userTypeForUpload: ProfileUserType = userIsDriver ? 'driver' : 'passenger';

  const userName = user?.name || user?.email?.split('@')[0] || tp('unknownUser');
  const accountType = user?.type ? tProfileUserType(user.type) : tp('unknownUser');
  const driverStatus = user?.status && isDriverStatus(user.status) ? tProfileDriverStatus(user.status) : tp('noInfo');

  const menuItems: ProfileMenuItem[] = useMemo(
    () => [
      { id: '1', title: tp('paymentMethods'), icon: 'card-outline', showChevron: true, action: 'payment-methods' },
      { id: '2', title: tp('history'), icon: 'time-outline', showChevron: true, action: 'history' },
      { id: '3', title: tp('savedAddresses'), icon: 'location-outline', showChevron: true, action: 'saved-addresses' },
      { id: '4', title: tp('coupons'), icon: 'pricetag-outline', showChevron: true, action: 'coupons', badge: 3 },
      { id: '5', title: tp('help'), icon: 'help-circle-outline', showChevron: true, action: 'help' },
      { id: '6', title: tp('about'), icon: 'information-circle-outline', showChevron: true, action: 'about' },
      { id: '7', title: tp('logoutConfirm'), icon: 'log-out-outline', showChevron: false, action: 'logout' },
    ],
    []
  );

  const personalInfo: UserInfoItem[] = useMemo(() => {
    if (!user) return [];
    const items: UserInfoItem[] = [
      { id: 'name', label: tp('name'), value: userName },
      { id: 'email', label: tp('email'), value: user.email || tp('noInfo'), verified: Boolean(user.emailVerified) },
      { id: 'cpf', label: tp('cpf'), value: user.cpf || tp('noInfo') },
      { id: 'phone', label: tp('phone'), value: user.phone || tp('noInfo') },
      { id: 'birthDate', label: tp('birthDate'), value: formatDate(user.birthDate) },
      { id: 'accountType', label: tp('accountType'), value: accountType },
    ];

    if (userIsDriver) {
      items.push(
        { id: 'cnhNumber', label: tp('cnhNumber'), value: user.cnhNumber || tp('noInfo') },
        { id: 'cnhCategory', label: tp('cnhCategory'), value: user.cnhCategory || tp('noInfo') },
        { id: 'cnhExpiration', label: tp('cnhExpirationDate'), value: formatDate(user.cnhExpirationDate) },
        { id: 'driverStatus', label: tp('driverStatus'), value: driverStatus }
      );
    }
    return items;
  }, [accountType, driverStatus, user, userIsDriver, userName]);

  const profilePhotoUrl = useMemo(() => {
    // cachedPhotoUrl takes priority — it is set immediately after a successful
    // upload or after refreshProfile resolves, so it always reflects the latest state.
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
    } finally {
      setIsRefreshing(false);
    }
  }, [ensureToken, refreshUserData, user, userIsDriver]);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const uploadCnh = useCallback(
    async (fileUri: string) => {
      setIsUploadingCNH(true);
      try {
        await ensureToken();
        const result = await profileService.uploadDocumentCnh(fileUri);
        if (!result.success) {
          Alert.alert(tp('genericErrorTitle'), result.error?.message || tp('genericErrorDescription'));
          return;
        }
        Alert.alert(tp('uploadSuccessTitle'), tp('uploadCnhSuccessDescription'));
        await refreshProfile();
      } finally {
        setIsUploadingCNH(false);
      }
    },
    [ensureToken, refreshProfile]
  );

  const processPickerResult = useCallback(
    async (
      result: ImagePicker.ImagePickerResult,
      onFile: (fileUri: string) => Promise<void>
    ) => {
      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;
      try {
        await onFile(uri);
      } catch {
        Alert.alert(tp('genericErrorTitle'), tp('genericErrorDescription'));
      }
    },
    []
  );

  const requestUploadSource = useCallback(
    (onFile: (fileUri: string) => Promise<void>) => {
      Alert.alert(tp('chooseImageTitle'), tp('chooseImageDescription'), [
        {
          text: tp('gallery'),
          onPress: () => {
            void (async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(tp('permissionTitle'), tp('mediaPermissionDescription'), [
                  { text: tp('cancel'), style: 'cancel' },
                  { text: tp('openSettings'), onPress: () => openAppSettings() },
                ]);
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              await processPickerResult(result, onFile);
            })();
          },
        },
        {
          text: tp('camera'),
          onPress: () => {
            void (async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(tp('permissionTitle'), tp('cameraPermissionDescription'), [
                  { text: tp('cancel'), style: 'cancel' },
                  { text: tp('openSettings'), onPress: () => openAppSettings() },
                ]);
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              await processPickerResult(result, onFile);
            })();
          },
        },
        { text: tp('cancel'), style: 'cancel' },
      ]);
    },
    [processPickerResult]
  );

  const handlePhotoUpload = useCallback(() => {
    requestUploadSource(async (fileUri) => {
      setIsUploadingPhoto(true);
      try {
        await ensureToken();
        const response = await profileService.uploadProfilePhoto(fileUri, userTypeForUpload);
        if (!response.success) {
          Alert.alert(tp('genericErrorTitle'), response.error?.message || tp('genericErrorDescription'));
          return;
        }
        // Force-refresh user data so user.photoUrl is updated immediately,
        // bypassing the TTL cache that would otherwise skip the API call.
        await refreshUserData(true);
        // Now rebuild the photo URL with the fresh user data and bust the cache.
        const profileId = user?.userId || user?.id;
        if (profileId) {
          const freshUrl = `${API_BASE_URL}/profile-photos/${profileId}?t=${Date.now()}`;
          setCachedPhotoUrl(freshUrl);
        }
      } finally {
        setIsUploadingPhoto(false);
      }
    });
  }, [ensureToken, refreshUserData, requestUploadSource, user?.id, user?.userId, userTypeForUpload]);

  const handleUploadCnh = useCallback(() => requestUploadSource(uploadCnh), [requestUploadSource, uploadCnh]);
  const onMenuAction = useCallback((action: ProfileMenuItem['action']) => {
    if (action === 'history') {
      navigation.navigate('History');
      return;
    }
    if (action === 'logout') {
      Alert.alert(tp('logoutTitle'), tp('logoutDescription'), [
        { text: tp('cancel'), style: 'cancel' },
        { text: tp('logoutConfirm'), style: 'destructive', onPress: () => logout() },
      ]);
    }
  }, [logout, navigation]);

  const showCnhUpload = userIsDriver && (!user?.cnhNumber || user.status === 'AWAITING_CNH' || user.status === 'ONBOARDING');

  return {
    isLoading,
    isRefreshing,
    isUploadingCNH,
    isUploadingPhoto,
    userName,
    accountType,
    userTypeForUpload,
    rating,
    profilePhotoUrl,
    personalInfo,
    menuItems,
    showCnhUpload,
    userIsDriver,
    handleRefresh: refreshProfile,
    handlePhotoUpload,
    handleUploadCnh,
    onMenuAction,
  };
}
