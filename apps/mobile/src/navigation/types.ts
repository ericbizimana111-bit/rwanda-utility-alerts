import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type MainTabParamList = {
    Home: undefined;
    Outages: { phase?: 'active' | 'upcoming' } | undefined;
    Subscriptions: undefined;
    Reports: { tab?: 'submit' | 'mine' } | undefined;
    Profile: undefined;
};

export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    SignUp: undefined;
    Main: NavigatorScreenParams<MainTabParamList> | undefined;
    OutageDetails: { outageId: string };
    AddSubscription: undefined;
    Notifications: undefined;
    DeviceRegistration: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
>;
