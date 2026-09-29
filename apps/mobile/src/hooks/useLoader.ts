import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { errorMessage } from '../api/client';

/**
 * Loads data when the screen gains focus. The first load shows a loading
 * state; later focus changes refresh silently so the screen never flickers.
 */
export function useLoader<T>(load: () => Promise<T>, fallbackError = 'Unable to load data.') {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const hasData = useRef(false);
    const loadRef = useRef(load);
    loadRef.current = load;

    const run = useCallback(
        async (mode: 'initial' | 'refresh' | 'silent') => {
            if (mode === 'initial') setLoading(true);
            if (mode === 'refresh') setRefreshing(true);
            try {
                const result = await loadRef.current();
                setData(result);
                hasData.current = true;
                setError(null);
            } catch (err) {
                // Keep showing previous data on a failed background refresh.
                if (mode !== 'silent' || !hasData.current) setError(errorMessage(err, fallbackError));
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [fallbackError],
    );

    useFocusEffect(
        useCallback(() => {
            void run(hasData.current ? 'silent' : 'initial');
        }, [run]),
    );

    return {
        data,
        setData,
        error,
        loading,
        refreshing,
        refresh: () => run('refresh'),
        retry: () => run('initial'),
    };
}
