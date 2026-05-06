import { DriverViewData } from '@/models/driver/types';
import { td } from '@/i18n/driver';

class DriverFacade {
  getViewData(): DriverViewData {
    return {
      driverName: td('driverName'),
      ratingText: td('ratingText'),
      vehicleTitle: td('vehicleTitle'),
      deliveryTitle: td('deliveryTitle'),
      vehicleItems: [
        { icon: 'car', label: td('vehicleModelLabel'), value: 'Honda Civic 2020' },
        { icon: 'document-text', label: td('vehiclePlateLabel'), value: 'ABC-1234' },
        { icon: 'color-fill', label: td('vehicleColorLabel'), value: 'Branco' },
      ],
      deliveryItems: [
        { icon: 'location', label: td('deliveryLocationLabel'), value: 'Rua das Flores, 123 - Centro' },
        { icon: 'time', label: td('deliveryTimeLabel'), value: '25 min' },
        { icon: 'cash', label: td('deliveryPriceLabel'), value: 'R$ 18,90' },
      ],
      rejectButtonText: td('rejectButton'),
      acceptButtonText: td('acceptButton'),
    };
  }
}

export const driverFacade = new DriverFacade();
