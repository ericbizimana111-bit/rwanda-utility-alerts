export const colors = {
    // Brand
    primary: '#0B63C5',
    primaryDark: '#0A4A96',
    primaryDeep: '#072F63',
    primaryLight: '#E8F1FC',
    primarySoft: '#D3E4FA',
    headerBg: '#0A4A96',
    headerText: '#FFFFFF',

    // Rwanda flag accents (sky blue, sun yellow, green)
    flagBlue: '#00A1DE',
    flagYellow: '#FAD201',
    flagGreen: '#20603D',

    // Surfaces
    background: '#F2F5F9',
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F9FC',
    border: '#E3E8EF',
    borderDark: '#CBD5E1',
    overlay: 'rgba(7, 21, 43, 0.55)',

    // Text
    textPrimary: '#0F1B2D',
    textSecondary: '#5B6B80',
    textMuted: '#94A3B8',
    textOnDark: '#FFFFFF',
    textOnDarkMuted: 'rgba(255, 255, 255, 0.78)',

    // Status
    activeGreen: '#15803D',
    activeGreenBg: '#E7F6EC',
    success: '#15803D',
    successBg: '#E7F6EC',
    danger: '#DC2626',
    dangerBg: '#FDECEC',
    warning: '#B45309',
    warningBg: '#FEF3C7',
    info: '#0369A1',
    infoBg: '#EAF5FD',
    infoBorder: '#BAE0F7',
    infoText: '#0369A1',

    // Utilities
    electricity: '#B45309',
    electricityBg: '#FEF3C7',
    electricityIcon: '#F59E0B',
    water: '#0284C7',
    waterBg: '#E0F2FE',
    waterIcon: '#0EA5E9',

    // Alert categories
    alertRed: '#DC2626',
    alertRedBg: '#FDECEC',
    alertBlue: '#2563EB',
    alertBlueBg: '#E0EAFE',
    alertGreen: '#15803D',
    alertGreenBg: '#E7F6EC',
    alertYellow: '#B45309',
    alertYellowBg: '#FEF3C7',
    alertPurple: '#6D28D9',
    alertPurpleBg: '#EDE9FE',

    unreadDot: '#EF4444',
    logoutRed: '#DC2626',
    logoutBg: '#FFF1F2',
    logoutBorder: '#FECDD3',
};

export const gradients = {
    header: ['#072F63', '#0A4A96', '#0B63C5'],
    hero: ['#062A58', '#0B5CB8', '#0A8AD4'],
    electricity: ['#F59E0B', '#EA580C'],
    water: ['#0EA5E9', '#0369A1'],
    success: ['#16A34A', '#15803D'],
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 999,
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
};

export const shadows = {
    card: {
        shadowColor: '#0F1B2D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    raised: {
        shadowColor: '#0F1B2D',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 8,
    },
    button: {
        shadowColor: '#0B63C5',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 4,
    },
};

export const typography = {
    display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
    title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.2 },
    heading: { fontSize: 17, fontWeight: '700' as const },
    subheading: { fontSize: 15, fontWeight: '700' as const },
    body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '500' as const },
    overline: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
};
