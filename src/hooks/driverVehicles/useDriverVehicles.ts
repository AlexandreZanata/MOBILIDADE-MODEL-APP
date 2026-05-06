import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { AutocompleteItem } from '@/components/molecules/AutocompleteInput';
import { tdv } from '@/i18n/driverVehicles';
import { DriverServiceCategory, DriverVehicle } from '@/models/driverVehicles/types';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { driverVehiclesFacade } from '@/services/driverVehicles/driverVehiclesFacade';
import { openAppSettings, requestCameraPermission, requestMediaLibraryPermission } from '@/services/permissionsService';

const LOAD_THROTTLE_MS = 5000;
const LICENSE_PLATE_CLASSIC_REGEX = /^[A-Z]{3}-?\d{4}$/i;
const LICENSE_PLATE_MERCOSUL_REGEX = /^[A-Z]{3}\d[A-Z]\d{2}$/i;

type FormErrors = Record<string, string>;

function isDocumentPending(status: string): boolean {
  return status === 'PENDING_DOCS' || status === 'AWAITING_VEHICLE';
}

export function useDriverVehicles() {
  const ensureToken = useTokenRefresh();
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([]);
  const [serviceCategories, setServiceCategories] = useState<DriverServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVehicleId, setUploadingVehicleId] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<AutocompleteItem | null>(null);
  const [selectedModel, setSelectedModel] = useState<AutocompleteItem | null>(null);
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);

  const resetForm = useCallback(() => {
    setLicensePlate('');
    setSelectedBrand(null);
    setSelectedModel(null);
    setYear('');
    setColor('');
    setServiceCategoryId('');
    setErrors({});
  }, []);

  const loadVehicles = useCallback(async () => {
    const response = await driverVehiclesFacade.getVehicles();
    if (response.success && response.data) {
      setVehicles(response.data.items);
      return;
    }
    setVehicles([]);
  }, []);

  const loadServiceCategories = useCallback(async () => {
    const response = await driverVehiclesFacade.getServiceCategories();
    if (response.success && response.data) {
      setServiceCategories(response.data);
      return;
    }
    Alert.alert(tdv('errorTitle'), tdv('loadCategoriesError'));
  }, []);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) return;
    const now = Date.now();
    const elapsed = now - lastLoadTimeRef.current;
    if (lastLoadTimeRef.current > 0 && elapsed < LOAD_THROTTLE_MS) return;

    lastLoadTimeRef.current = now;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      await Promise.all([loadVehicles(), loadServiceCategories()]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [loadServiceCategories, loadVehicles]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
      return () => {};
    }, [loadData])
  );

  const searchBrands = useCallback(async (query: string): Promise<AutocompleteItem[]> => {
    const response = await driverVehiclesFacade.searchBrands(query);
    if (!response.success || !response.data) return [];
    return response.data.map((brand) => ({ id: brand.id, name: brand.name }));
  }, []);

  const searchModels = useCallback(
    async (query: string): Promise<AutocompleteItem[]> => {
      const response = await driverVehiclesFacade.searchModels(query, selectedBrand?.id);
      if (!response.success || !response.data) return [];
      return response.data.map((model) => ({ id: model.id, name: model.name }));
    },
    [selectedBrand?.id]
  );

  const handleBrandChange = useCallback((item: AutocompleteItem | null) => {
    setSelectedBrand(item);
    setSelectedModel(null);
    setErrors((current) => ({ ...current, brand: '' }));
  }, []);

  const handleModelChange = useCallback((item: AutocompleteItem | null) => {
    setSelectedModel(item);
    setErrors((current) => ({ ...current, model: '' }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const nextErrors: FormErrors = {};
    if (!licensePlate.trim()) {
      nextErrors.licensePlate = tdv('plateRequired');
    } else if (!LICENSE_PLATE_CLASSIC_REGEX.test(licensePlate.trim()) && !LICENSE_PLATE_MERCOSUL_REGEX.test(licensePlate.trim())) {
      nextErrors.licensePlate = tdv('plateInvalid');
    }
    if (!selectedBrand) nextErrors.brand = tdv('brandRequired');
    if (!selectedModel) nextErrors.model = tdv('modelRequired');
    if (!year.trim()) {
      nextErrors.year = tdv('yearRequired');
    } else {
      const yearNumber = Number.parseInt(year, 10);
      const maxYear = new Date().getFullYear() + 1;
      if (Number.isNaN(yearNumber) || yearNumber < 1900 || yearNumber > maxYear) nextErrors.year = tdv('yearInvalid');
    }
    if (!color.trim()) nextErrors.color = tdv('colorRequired');
    if (!serviceCategoryId) nextErrors.serviceCategoryId = tdv('serviceCategoryRequired');

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [color, licensePlate, selectedBrand, selectedModel, serviceCategoryId, year]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !selectedBrand || !selectedModel) return;

    await ensureToken();
    setIsSubmitting(true);
    try {
      const result = await driverVehiclesFacade.createVehicle({
        licensePlate: licensePlate.trim().toUpperCase(),
        brandId: selectedBrand.id,
        modelId: selectedModel.id,
        year: Number.parseInt(year, 10),
        color: color.trim(),
        serviceCategoryId,
      });
      if (!result.success) {
        Alert.alert(tdv('errorTitle'), result.error?.message ?? tdv('vehicleCreateError'));
        return;
      }
      Alert.alert(tdv('successTitle'), tdv('vehicleCreated'), [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            setShowAddModal(false);
            void loadData();
          },
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [color, ensureToken, licensePlate, loadData, resetForm, selectedBrand, selectedModel, serviceCategoryId, validateForm, year]);

  const uploadVehicleDocument = useCallback(
    async (vehicleId: string, fileUri: string) => {
      await ensureToken();
      setUploadingVehicleId(vehicleId);
      try {
        const response = await driverVehiclesFacade.uploadVehicleDocument(vehicleId, fileUri);
        if (!response.success) {
          Alert.alert(tdv('errorTitle'), response.error?.message ?? tdv('uploadError'));
          return;
        }
        Alert.alert(tdv('successTitle'), tdv('uploadSuccess'), [{ text: 'OK', onPress: () => void loadVehicles() }]);
      } finally {
        setUploadingVehicleId(null);
      }
    },
    [ensureToken, loadVehicles]
  );

  const requestUploadFromGallery = useCallback(
    async (vehicleId: string) => {
      const granted = await requestMediaLibraryPermission();
      if (!granted) {
        Alert.alert(tdv('permissionRequired'), tdv('mediaPermissionDescription'), [
          { text: tdv('cancel'), style: 'cancel' },
          { text: tdv('openSettings'), onPress: () => openAppSettings() },
        ]);
        return;
      }
      launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1, includeBase64: false }, (response) => {
        const fileUri = response.assets?.[0]?.uri;
        if (response.didCancel || response.errorCode || !fileUri) return;
        void uploadVehicleDocument(vehicleId, fileUri);
      });
    },
    [uploadVehicleDocument]
  );

  const requestUploadFromCamera = useCallback(
    async (vehicleId: string) => {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert(tdv('permissionRequired'), tdv('cameraPermissionDescription'), [
          { text: tdv('cancel'), style: 'cancel' },
          { text: tdv('openSettings'), onPress: () => openAppSettings() },
        ]);
        return;
      }
      launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false }, (response) => {
        const fileUri = response.assets?.[0]?.uri;
        if (response.didCancel || response.errorCode || !fileUri) return;
        void uploadVehicleDocument(vehicleId, fileUri);
      });
    },
    [uploadVehicleDocument]
  );

  const handleUploadDocument = useCallback(
    (vehicleId: string) => {
      Alert.alert(tdv('uploadDocument'), tdv('uploadDocumentDescription'), [
        { text: tdv('gallery'), onPress: () => void requestUploadFromGallery(vehicleId) },
        { text: tdv('camera'), onPress: () => void requestUploadFromCamera(vehicleId) },
        { text: tdv('cancel'), style: 'cancel' },
      ]);
    },
    [requestUploadFromCamera, requestUploadFromGallery]
  );

  return {
    vehicles,
    serviceCategories,
    isLoading,
    showAddModal,
    isSubmitting,
    uploadingVehicleId,
    form: { licensePlate, selectedBrand, selectedModel, year, color, serviceCategoryId, errors },
    helpers: { isDocumentPending },
    actions: {
      setLicensePlate,
      setYear: (value: string) => setYear(value.replace(/[^0-9]/g, '')),
      setColor,
      setServiceCategoryId,
      handleBrandChange,
      handleModelChange,
      searchBrands,
      searchModels,
      handleSubmit,
      handleUploadDocument,
      openModal: () => {
        resetForm();
        setShowAddModal(true);
      },
      closeModal: () => {
        if (isSubmitting) return;
        resetForm();
        setShowAddModal(false);
      },
      clearError: (field: string) => setErrors((current) => ({ ...current, [field]: '' })),
    },
  };
}
