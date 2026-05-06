import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import { AutocompleteInput, AutocompleteItem } from '@/components/molecules/AutocompleteInput';
import { useTheme } from '@/context/ThemeContext';
import { tdv } from '@/i18n/driverVehicles';
import { DriverServiceCategory } from '@/models/driverVehicles/types';
import { shadows, spacing, typography } from '@/theme';

interface DriverVehicleFormModalProps {
  visible: boolean;
  insets: EdgeInsets;
  isSubmitting: boolean;
  serviceCategories: DriverServiceCategory[];
  form: {
    licensePlate: string;
    selectedBrand: AutocompleteItem | null;
    selectedModel: AutocompleteItem | null;
    year: string;
    color: string;
    serviceCategoryId: string;
    errors: Record<string, string>;
  };
  actions: {
    setLicensePlate(value: string): void;
    setYear(value: string): void;
    setColor(value: string): void;
    setServiceCategoryId(value: string): void;
    handleBrandChange(item: AutocompleteItem | null): void;
    handleModelChange(item: AutocompleteItem | null): void;
    searchBrands(query: string): Promise<AutocompleteItem[]>;
    searchModels(query: string): Promise<AutocompleteItem[]>;
    handleSubmit(): void;
    closeModal(): void;
    clearError(field: string): void;
  };
}

export function DriverVehicleFormModal({ visible, insets, isSubmitting, serviceCategories, form, actions }: DriverVehicleFormModalProps) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    full: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: { ...typography.h2, fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    scroll: { flex: 1, paddingHorizontal: spacing.md, paddingTop: spacing.md },
    sectionTitle: { ...typography.h2, fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
    group: { marginBottom: spacing.md },
    label: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      ...typography.body,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputError: { borderColor: colors.status.error },
    error: { ...typography.caption, fontSize: 12, color: colors.status.error, marginTop: spacing.xs },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      marginBottom: spacing.sm,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryOptionSelected: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    radioSelected: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    categoryText: { ...typography.body, fontSize: 15, fontWeight: '500', color: colors.textPrimary },
    categoryTextSelected: { color: colors.primary, fontWeight: '600' },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.medium,
      shadowColor: colors.primary,
    },
    submitButtonDisabled: { opacity: 0.7, backgroundColor: colors.textSecondary },
    submitText: { ...typography.body, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={actions.closeModal}>
      <View style={styles.full}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
          <TouchableOpacity style={styles.backButton} onPress={actions.closeModal}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{tdv('newVehicleTitle')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            <Text style={styles.sectionTitle}>{tdv('vehicleDataSection')}</Text>
            <View style={styles.group}>
              <Text style={styles.label}>{tdv('licensePlateLabel')}</Text>
              <TextInput
                style={[styles.input, form.errors.licensePlate ? styles.inputError : undefined]}
                value={form.licensePlate}
                onChangeText={(value) => {
                  actions.setLicensePlate(value);
                  actions.clearError('licensePlate');
                }}
                placeholder={tdv('licensePlatePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                maxLength={8}
              />
              {form.errors.licensePlate ? <Text style={styles.error}>{form.errors.licensePlate}</Text> : null}
            </View>
            <View style={[styles.group, { zIndex: 200 }]}>
              <AutocompleteInput
                label={tdv('brandLabel')}
                placeholder={tdv('brandPlaceholder')}
                value={form.selectedBrand}
                onSelect={actions.handleBrandChange}
                onSearch={actions.searchBrands}
                error={Boolean(form.errors.brand)}
                errorMessage={form.errors.brand}
                minChars={0}
                debounceMs={300}
                emptyMessage={tdv('noBrandFound')}
                loadingMessage={tdv('loadingBrands')}
              />
            </View>
            <View style={[styles.group, { zIndex: 100 }]}>
              <AutocompleteInput
                label={tdv('modelLabel')}
                placeholder={form.selectedBrand ? tdv('modelPlaceholder') : tdv('modelBrandRequiredPlaceholder')}
                value={form.selectedModel}
                onSelect={actions.handleModelChange}
                onSearch={actions.searchModels}
                error={Boolean(form.errors.model)}
                errorMessage={form.errors.model}
                disabled={!form.selectedBrand}
                minChars={0}
                debounceMs={300}
                emptyMessage={form.selectedBrand ? tdv('noModelFound') : tdv('modelBrandRequiredPlaceholder')}
                loadingMessage={tdv('loadingModels')}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.group, { flex: 1, marginRight: spacing.sm }]}>
                <Text style={styles.label}>{tdv('yearLabel')}</Text>
                <TextInput
                  style={[styles.input, form.errors.year ? styles.inputError : undefined]}
                  value={form.year}
                  onChangeText={(value) => {
                    actions.setYear(value);
                    actions.clearError('year');
                  }}
                  placeholder={tdv('yearPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  maxLength={4}
                />
                {form.errors.year ? <Text style={styles.error}>{form.errors.year}</Text> : null}
              </View>
              <View style={[styles.group, { flex: 1, marginLeft: spacing.sm }]}>
                <Text style={styles.label}>{tdv('colorLabel')}</Text>
                <TextInput
                  style={[styles.input, form.errors.color ? styles.inputError : undefined]}
                  value={form.color}
                  onChangeText={(value) => {
                    actions.setColor(value);
                    actions.clearError('color');
                  }}
                  placeholder={tdv('colorPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
                {form.errors.color ? <Text style={styles.error}>{form.errors.color}</Text> : null}
              </View>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>{tdv('categorySection')}</Text>
            <View style={styles.group}>
              <Text style={styles.label}>{tdv('serviceCategoryLabel')}</Text>
              {serviceCategories.length === 0 ? (
                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginLeft: spacing.xs }}>{tdv('categoriesLoading')}</Text>
                </View>
              ) : (
                <>
                  {serviceCategories.map((category) => {
                    const selected = form.serviceCategoryId === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[styles.categoryOption, selected ? styles.categoryOptionSelected : undefined]}
                        onPress={() => {
                          actions.setServiceCategoryId(category.id);
                          actions.clearError('serviceCategoryId');
                        }}
                      >
                        <View style={[styles.radio, selected ? styles.radioSelected : undefined]}>
                          {selected ? <View style={styles.radioInner} /> : null}
                        </View>
                        <Text style={[styles.categoryText, selected ? styles.categoryTextSelected : undefined]}>{category.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {form.errors.serviceCategoryId ? <Text style={styles.error}>{form.errors.serviceCategoryId}</Text> : null}
                </>
              )}
            </View>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting ? styles.submitButtonDisabled : undefined]}
              onPress={actions.handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.submitText}>{tdv('addVehicle')}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
