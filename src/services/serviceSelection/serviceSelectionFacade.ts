import { ServiceOption } from '@/models/serviceSelection/types';

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: '1', name: 'Normal', icon: 'cube-outline', price: 'R$ 12,90', time: '30-45 min' },
  { id: '2', name: 'Express', icon: 'flash-outline', price: 'R$ 18,90', time: '15-20 min' },
  { id: '3', name: 'Agendada', icon: 'calendar-outline', price: 'R$ 10,90', time: 'Escolha o horário' },
];

class ServiceSelectionFacade {
  getServices(): ServiceOption[] {
    return SERVICE_OPTIONS;
  }
}

export const serviceSelectionFacade = new ServiceSelectionFacade();
