import { Alert } from 'react-native';
import { isPermissionPermanentlyDenied } from './androidPermissions';
import { openAppSettings } from './settings';
import { UiPermissionType } from './types';

function toInternalPermissionType(permissionType: UiPermissionType): 'camera' | 'mediaLibrary' {
  return permissionType === 'câmera' ? 'camera' : 'mediaLibrary';
}

export async function showPermissionDeniedAlert(
  permissionType: UiPermissionType,
  onOpenSettings?: () => void
): Promise<void> {
  const blocked = await isPermissionPermanentlyDenied(toInternalPermissionType(permissionType));
  const action = permissionType === 'câmera' ? 'tirar fotos' : 'selecionar fotos';
  const message = blocked
    ? `Para ${action}, precisamos de acesso à sua ${permissionType}. A permissão foi negada anteriormente. Por favor, permita o acesso nas configurações do aplicativo.`
    : `Para ${action}, precisamos de acesso à sua ${permissionType}. Por favor, permita o acesso.`;

  Alert.alert('Permissão necessária', message, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: blocked ? 'Abrir Configurações' : 'Permitir',
      onPress: async () => {
        if (blocked || onOpenSettings) {
          if (onOpenSettings) {
            onOpenSettings();
            return;
          }
          await openAppSettings();
        }
      },
    },
  ]);
}
