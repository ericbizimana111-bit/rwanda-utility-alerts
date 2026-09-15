export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    SignUp: undefined;
    Home: undefined;
    Outages: undefined;
    OutageDetails: { outageId: string };
    Subscriptions: undefined;
    AddSubscription: undefined;
    Reports: undefined;
    ReportCreate?: { reportId?: string };
    Notifications: undefined;
    Profile: undefined;
    DeviceRegistration: undefined;
};
