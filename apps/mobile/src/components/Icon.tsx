import React from 'react';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

export type IconName =
    | 'lightning'
    | 'water'
    | 'check'
    | 'alert'
    | 'bell'
    | 'user'
    | 'users'
    | 'document'
    | 'clock'
    | 'chevron-right'
    | 'chevron-down'
    | 'back'
    | 'plus'
    | 'phone'
    | 'lock'
    | 'eye'
    | 'eye-off'
    | 'camera'
    | 'logout'
    | 'device'
    | 'help'
    | 'info'
    | 'home'
    | 'outages'
    | 'subscriptions'
    | 'reports'
    | 'more'
    | 'search'
    | 'copy'
    | 'close';

interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    fill?: string;
}

export function Icon({ name, size = 20, color = '#0B63C5' }: IconProps) {
    switch (name) {
        case 'lightning':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                        fill={color}
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>
            );

        case 'water':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"
                        fill={color}
                        stroke={color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>
            );

        case 'check':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M20 6L9 17l-5-5"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>
            );

        case 'alert':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        fill={color}
                    />
                    <Line x1="12" y1="9" x2="12" y2="13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <Circle cx="12" cy="17" r="1.2" fill="#FFFFFF" />
                </Svg>
            );

        case 'bell':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'user':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'users':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M23 21v-2a4 4 0 00-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'document':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
                </Svg>
            );

        case 'clock':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
                    <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'chevron-right':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'chevron-down':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'back':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'plus':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                </Svg>
            );

        case 'phone':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path
                        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </Svg>
            );

        case 'lock':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
                    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'eye':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'eye-off':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="2" strokeLinecap="round" />
                </Svg>
            );

        case 'camera':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'logout':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'device':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" stroke={color} strokeWidth="2" />
                    <Line x1="12" y1="18" x2="12.01" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                </Svg>
            );

        case 'help':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
                    <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="12" cy="17" r="0.8" fill={color} />
                </Svg>
            );

        case 'info':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
                    <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    <Circle cx="12" cy="8" r="0.8" fill={color} />
                </Svg>
            );

        case 'home':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'outages':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'subscriptions':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'reports':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'more':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="1.5" fill={color} />
                    <Circle cx="19" cy="12" r="1.5" fill={color} />
                    <Circle cx="5" cy="12" r="1.5" fill={color} />
                </Svg>
            );

        case 'search':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            );

        case 'copy':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke={color} strokeWidth="2" />
                    <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="2" />
                </Svg>
            );

        case 'close':
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
                </Svg>
            );

        default:
            return null;
    }
}
