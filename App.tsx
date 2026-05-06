import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { TripProvider } from '@/context/TripContext';
import { ChatProvider } from '@/context/ChatContext';
import { isDriver } from '@/models/User';

import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import { VerifyEmailScreen } from '@/screens/VerifyEmailScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ServiceSelectionScreen } from '@/screens/ServiceSelectionScreen';
import { TripPriceScreen } from '@/screens/TripPriceScreen';
import { WaitingForDriverScreen } from '@/screens/WaitingForDriverScreen';
import { DriverScreen } from '@/screens/DriverScreen';
import { DriverHomeScreen } from '@/screens/DriverHomeScreen';
import { DriverTripRequestScreen } from '@/screens/DriverTripRequestScreen';
import { DriverTripInProgressScreen } from '@/screens/DriverTripInProgressScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { GuestProfileScreen } from '@/screens/GuestProfileScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { RidesScreen } from '@/screens/RidesScreen';
import { RideDetailsScreen } from '@/screens/RideDetailsScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { DriverVehiclesScreen } from '@/screens/DriverVehiclesScreen';
import { DriverBillingScreen } from '@/screens/DriverBillingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ---------------------------------------------------------------------------
// Shared tab bar options factory
// ---------------------------------------------------------------------------

function useTabBarScreenOptions() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textHint,
    tabBarStyle: {
      backgroundColor: colors.card,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      paddingBottom: Math.max(insets.bottom, 8),
      paddingTop: 8,
      height: 64 + Math.max(insets.bottom - 8, 0),
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
    },
  };
}

// ---------------------------------------------------------------------------
// Tabs para Passageiro
// ---------------------------------------------------------------------------

function PassengerTabs() {
  const screenOptions = useTabBarScreenOptions();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={RidesScreen}
        options={{
          tabBarLabel: 'Corridas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Pagamentos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Tabs para Motorista
// ---------------------------------------------------------------------------

function DriverTabs() {
  const screenOptions = useTabBarScreenOptions();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverRides"
        component={RidesScreen}
        options={{
          tabBarLabel: 'Corridas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverVehicles"
        component={DriverVehiclesScreen}
        options={{
          tabBarLabel: 'Veículos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Tabs para Visitantes (não autenticados)
// ---------------------------------------------------------------------------

function GuestTabs() {
  const screenOptions = useTabBarScreenOptions();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="GuestHomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GuestOrders"
        component={RidesScreen}
        options={{
          tabBarLabel: 'Corridas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GuestHistory"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Pagamentos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GuestProfile"
        component={GuestProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Chave para armazenar se o onboarding já foi visto
const ONBOARDING_STORAGE_KEY = '@vamu:onboarding_completed';
// Chave para armazenar email pendente de verificação
const PENDING_EMAIL_KEY = '@vamu:pending_email_verification';

function AppNavigator() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false); // Inicia como false, será definido após verificar AsyncStorage
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasPendingEmail, setHasPendingEmail] = useState(false);
  const [pendingEmailData, setPendingEmailData] = useState<{ email: string; userType: 'passenger' | 'driver' } | null>(null);
  const { colors } = useTheme();
  const { isAuthenticated, isLoading, user } = useAuth();

  const userIsDriver = Boolean(user && isDriver(user));

  const onboardingScreens = [
    {
      title: 'Entregas Rápidas',
      subtitle: 'Receba suas entregas no conforto da sua casa com rapidez e segurança',
      icon: 'rocket-outline',
    },
    {
      title: 'Rastreamento em Tempo Real',
      subtitle: 'Acompanhe sua entrega em tempo real e saiba exatamente quando chegará',
      icon: 'location-outline',
    },
  ];

  /**
   * Verifica se o onboarding já foi visto e se há email pendente de verificação
   */
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Verifica onboarding
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (onboardingCompleted === 'true') {
          setShowOnboarding(false);
        } else {
          setShowOnboarding(true);
        }

        // Verifica se há email pendente de verificação
        const pendingEmail = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
        if (pendingEmail) {
          try {
            const emailData = JSON.parse(pendingEmail);
            setPendingEmailData(emailData);
            setHasPendingEmail(true);
          } catch (parseError) {
            console.error('[App] Erro ao parsear email pendente:', parseError);
            setHasPendingEmail(false);
          }
        } else {
          setHasPendingEmail(false);
        }
      } catch (error) {
        console.error('[App] Erro ao verificar status:', error);
        // Em caso de erro, mostra o onboarding por segurança
        setShowOnboarding(true);
        setHasPendingEmail(false);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkStatus();
  }, []);

  /**
   * Salva que o onboarding foi completado quando o usuário clica em "Começar"
   */
  const handleOnboardingNext = async () => {
    if (onboardingStep < onboardingScreens.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      // Última tela - salva que o onboarding foi completado
      try {
        await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
        console.log('[App] Onboarding marcado como completo');
      } catch (error) {
        console.error('[App] Erro ao salvar status do onboarding:', error);
      }
      setShowOnboarding(false);
    }
  };

  // Mostra loading enquanto verifica autenticação ou status do onboarding
  if (isLoading || isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showSplash) {
    return (
      <SplashScreen
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        title={onboardingScreens[onboardingStep].title}
        subtitle={onboardingScreens[onboardingStep].subtitle}
        icon={onboardingScreens[onboardingStep].icon}
        onNext={handleOnboardingNext}
        isLast={onboardingStep === onboardingScreens.length - 1}
      />
    );
  }

  // Se não estiver autenticado, permite navegação no app em modo guest
  if (!isAuthenticated) {
    // Se há email pendente de verificação, mostra tela de verificação primeiro
    const initialRoute = hasPendingEmail && pendingEmailData ? 'VerifyEmail' : 'Main';
    
    return (
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={GuestTabs} 
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen 
          name="VerifyEmail" 
          component={VerifyEmailScreen}
          initialParams={pendingEmailData || undefined}
          options={{
            headerShown: false,
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        {/* Telas de visualização para guests */}
        <Stack.Screen 
          name="ServiceSelection" 
          component={ServiceSelectionScreen}
          options={{
            presentation: 'modal',
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="TripPrice" 
          component={TripPriceScreen}
          options={{
            presentation: 'modal',
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="RideDetails" 
          component={RideDetailsScreen}
          options={{
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
      </Stack.Navigator>
    );
  }

  // Usuário autenticado - mostra app principal
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
        <Stack.Screen 
          name="Main" 
          component={userIsDriver ? DriverTabs : PassengerTabs} 
        />
        <Stack.Screen
          name="VerifyEmail"
          component={VerifyEmailScreen}
          options={{
            headerShown: false,
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="TripPrice" 
          component={TripPriceScreen}
          options={{
            presentation: 'modal',
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="WaitingForDriver" 
          component={WaitingForDriverScreen}
          options={{
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="ServiceSelection" 
          component={ServiceSelectionScreen}
          options={{
            presentation: 'modal',
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="Driver" 
          component={DriverScreen}
          options={{
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen 
          name="DriverTripRequest" 
          component={DriverTripRequestScreen}
          options={{
            presentation: 'modal',
            cardStyle: {
              backgroundColor: 'transparent',
            },
          }}
        />
        <Stack.Screen 
          name="DriverTripInProgress" 
          component={DriverTripInProgressScreen}
          options={{
            cardStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen 
        name="RideDetails" 
        component={RideDetailsScreen}
        options={{
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
      <Stack.Screen 
        name="DriverBilling" 
        component={DriverBillingScreen}
        options={{
          cardStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.card,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.primary,
          },
        }}
      >
        <StatusBar style="auto" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function App(){
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        const fontMap: Record<string, any> = {};
        try {
          fontMap['Poppins-Regular'] = require('./assets/fonts/Poppins-Regular.ttf');
        } catch (e) {}
        try {
          fontMap['Poppins-SemiBold'] = require('./assets/fonts/Poppins-SemiBold.ttf');
        } catch (e) {}
        try {
          fontMap['Poppins-Bold'] = require('./assets/fonts/Poppins-Bold.ttf');
        } catch (e) {}

        if (Object.keys(fontMap).length > 0) {
          await Font.loadAsync(fontMap);
        }
      } catch (error) {
        console.log('Fonts not found, using system fonts');
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <ChatProvider>
            <TripProvider>
              <AppContent />
            </TripProvider>
          </ChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function LoadingScreen() {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default App;

