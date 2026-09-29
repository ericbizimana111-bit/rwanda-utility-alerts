import type { IconName } from '../components/Icon';
import { colors } from '../theme/colors';

export type Contact = {
    id: string;
    name: string;
    description: string;
    phone?: string;
    url?: string;
    icon: IconName;
    color: string;
    bg: string;
};

/** Official support lines. Rwanda Utility Alerts is not operated by REG or WASAC. */
export const SUPPORT_CONTACTS: Contact[] = [
    {
        id: 'reg',
        name: 'REG customer care',
        description: 'Power faults, outages and electricity services · Toll-free 2727',
        phone: '2727',
        url: 'https://www.reg.rw',
        icon: 'lightning',
        color: colors.electricityIcon,
        bg: colors.electricityBg,
    },
    {
        id: 'wasac',
        name: 'WASAC customer care',
        description: 'Water supply problems, leaks and services · Toll-free 3535',
        phone: '3535',
        url: 'https://www.wasac.rw',
        icon: 'water',
        color: colors.waterIcon,
        bg: colors.waterBg,
    },
    {
        id: 'police',
        name: 'Emergency (Rwanda National Police)',
        description: 'Danger to life, e.g. fallen power lines or fire · 112',
        phone: '112',
        icon: 'shield',
        color: colors.danger,
        bg: colors.dangerBg,
    },
];

export const OFFICIAL_SOURCES = {
    reg: 'https://www.reg.rw/customer-service/power-outages/',
    wasac: 'https://www.wasac.rw/en/public-information/announcements',
};
