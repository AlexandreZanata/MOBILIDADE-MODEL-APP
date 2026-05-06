import { th } from '@/i18n/history';

export interface HistoryViewState {
  subtitle: string;
  title: string;
  message: string;
  showLoginAction: boolean;
}

class HistoryFacade {
  buildViewState(isAuthenticated: boolean): HistoryViewState {
    if (!isAuthenticated) {
      return {
        subtitle: th('subtitleGuest'),
        title: th('loginTitle'),
        message: th('loginMessage'),
        showLoginAction: true,
      };
    }

    return {
      subtitle: th('subtitleAuthenticated'),
      title: th('emptyTitle'),
      message: th('emptyMessage'),
      showLoginAction: false,
    };
  }
}

export const historyFacade = new HistoryFacade();
