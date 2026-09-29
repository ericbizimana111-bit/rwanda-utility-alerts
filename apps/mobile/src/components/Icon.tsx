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
    | 'close'
    | StrokeIconName;

// Simple outline icons (24x24 grid, Feather-style strokes).
const STROKE_ICONS = {
    'map-pin': ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z', 'M12 13a3 3 0 100-6 3 3 0 000 6z'],
    calendar: ['M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z', 'M16 2v4M8 2v4M3 10h18'],
    external: ['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6', 'M15 3h6v6M10 14L21 3'],
    edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z'],
    key: ['M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zM15.5 7.5l3 3L22 7l-3-3'],
    mail: ['M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z', 'M22 6l-10 7L2 6'],
    trash: ['M3 6h18', 'M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6', 'M10 11v6M14 11v6', 'M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2'],
    shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'M9 12l2 2 4-4'],
    refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'],
    'check-circle': ['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4L12 14.01l-3-3'],
    'x-circle': ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M15 9l-6 6M9 9l6 6'],
    globe: ['M12 22a10 10 0 100-20 10 10 0 000 20z', 'M2 12h20', 'M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z'],
    layers: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
    'power-off': ['M18.36 6.64a9 9 0 11-12.73 0', 'M12 2v10'],
    'message': ['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'],
    'arrow-right': ['M5 12h14', 'M12 5l7 7-7 7'],
    'bell-off': ['M13.73 21a2 2 0 01-3.46 0', 'M18.63 13A17.89 17.89 0 0118 8', 'M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14', 'M18 8a6 6 0 00-9.33-5', 'M1 1l22 22'],
    activity: ['M22 12h-4l-3 9L9 3l-3 9H2'],
} as const;

type StrokeIconName = keyof typeof STROKE_ICONS;

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

        default: {
            const paths = STROKE_ICONS[name as StrokeIconName];
            if (!paths) return null;
            return (
                <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                    {paths.map((d) => (
                        <Path key={d} d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                </Svg>
            );
        }
    }
}
