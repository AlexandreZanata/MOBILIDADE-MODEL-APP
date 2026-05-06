import { GuestProfileViewData } from '@/models/guestProfile/types';
import { tgp } from '@/i18n/guestProfile';

class GuestProfileFacade {
  getViewData(): GuestProfileViewData {
    return {
      title: tgp('anonymousTitle'),
      subtitle: tgp('anonymousSubtitle'),
      infoTitle: tgp('welcomeTitle'),
      infoSubtitle: tgp('welcomeSubtitle'),
      actions: [
        { title: tgp('loginButton'), target: 'Login', variant: 'primary' },
        { title: tgp('registerButton'), target: 'Register', variant: 'ghost' },
      ],
    };
  }
}

export const guestProfileFacade = new GuestProfileFacade();
