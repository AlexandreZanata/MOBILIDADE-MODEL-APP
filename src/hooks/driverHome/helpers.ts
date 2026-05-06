import { DriverOperationalStatusData, DriverValidationStatusData } from '@/models/driverHome/types';
import { TERMINAL_RIDE_STATUSES } from '@/hooks/driverHome/constants';
import { tdh } from '@/i18n/driverHome';

/**
 * Extrai mensagem segura para exibir ao usuario.
 */
export const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * Normaliza status de corrida vindos da API/socket.
 */
export const normalizeRideStatus = (status: string): string => {
  if (!status) return status;
  return status.toUpperCase().trim().replace(/\s+/g, '_');
};

export const isTerminalRideStatus = (status: string): boolean =>
  TERMINAL_RIDE_STATUSES.includes(normalizeRideStatus(status) as (typeof TERMINAL_RIDE_STATUSES)[number]);

export const hasPendingDocuments = (validationStatus: DriverValidationStatusData | null): boolean => {
  if (!validationStatus) return false;

  const workflowStatus = validationStatus.workflowStatus;
  const vehicles = validationStatus.vehicles || [];
  const hasApprovedVehicle = vehicles.some((vehicle) => vehicle.status === 'APPROVED');
  const cnhStatus = validationStatus.cnh?.status;

  if (cnhStatus === 'PENDING' || cnhStatus === 'REJECTED') return true;
  if (workflowStatus === 'ACTIVE' && hasApprovedVehicle) return false;

  return vehicles.some((vehicle) => vehicle.status === 'PENDING' || vehicle.status === 'REJECTED') && !hasApprovedVehicle;
};

export const getValidationWarningMessage = (validationStatus: DriverValidationStatusData | null): string | null => {
  if (!validationStatus) return null;

  const workflowStatus = validationStatus.workflowStatus;
  const cnhStatus = validationStatus.cnh?.status;

  if (cnhStatus === 'PENDING') return tdh('cnhPending');
  if (cnhStatus === 'REJECTED') {
    return tdh('cnhRejected', { reason: validationStatus.cnh?.rejectionReason || tdh('defaultCnhRejectedReason') });
  }
  if (workflowStatus === 'AWAITING_CNH') return tdh('awaitingCnh');
  if (workflowStatus === 'AWAITING_VEHICLE') return tdh('awaitingVehicle');
  if ((validationStatus.vehicles || []).some((vehicle) => vehicle.status === 'PENDING')) return tdh('vehiclePending');
  if ((validationStatus.vehicles || []).some((vehicle) => vehicle.status === 'REJECTED')) return tdh('vehicleRejected');
  return null;
};

export const getEligibilityMessage = (validationStatus: DriverValidationStatusData | null): string => {
  if (!validationStatus) return tdh('loadingEligibility');

  const workflowStatus = validationStatus.workflowStatus;
  const cnhStatus = validationStatus.cnh?.status;
  const vehicles = validationStatus.vehicles || [];

  if (workflowStatus === 'AWAITING_CNH' || !cnhStatus || cnhStatus === 'MISSING') return tdh('activateNeedAll');
  if (cnhStatus === 'PENDING') return tdh('activateCnhPending');
  if (cnhStatus === 'REJECTED') return tdh('activateCnhRejected');
  if (workflowStatus === 'AWAITING_VEHICLE' || vehicles.length === 0) return tdh('activateNeedVehicle');
  if (vehicles.some((vehicle) => vehicle.status === 'PENDING')) return tdh('activateVehiclePending');
  if (vehicles.some((vehicle) => vehicle.status === 'REJECTED')) return tdh('activateVehicleRejected');
  if (workflowStatus !== 'COMPLETE' && workflowStatus !== 'ACTIVE') return tdh('activateNeedCarDocs');
  return tdh('activateNeedRegistration');
};

export const isDriverEligible = (
  operationalStatus: DriverOperationalStatusData | null,
  validationStatus: DriverValidationStatusData | null
): boolean => {
  if (!operationalStatus) return false;
  if (validationStatus?.workflowStatus === 'ACTIVE') return true;
  return operationalStatus.canReceiveRides === true;
};
