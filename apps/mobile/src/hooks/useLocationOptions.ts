import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, errorMessage, Location, Utility } from '../api/client';
import type { PickerOption } from '../components/SearchablePicker';

const PROVINCE_ORDER = ['City of Kigali', 'Kigali City', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province'];

/** Loads Rwanda's districts/sectors and the active utilities for pickers. */
export function useLocationOptions() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [utilities, setUtilities] = useState<Utility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [locs, utils] = await Promise.all([api.getLocations(), api.getUtilities()]);
            setLocations(locs);
            setUtilities(utils.filter((utility) => utility.isActive));
        } catch (err) {
            setError(errorMessage(err, 'Unable to load locations.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const districtOptions = useMemo<PickerOption[]>(() => {
        const byDistrict = new Map<string, Location>();
        for (const location of locations) {
            if (!byDistrict.has(location.district) || !location.sector) byDistrict.set(location.district, location);
        }
        const rank = (province: string) => {
            const index = PROVINCE_ORDER.indexOf(province);
            return index === -1 ? PROVINCE_ORDER.length : index;
        };
        return Array.from(byDistrict.values())
            .sort((a, b) => rank(a.province) - rank(b.province) || a.district.localeCompare(b.district))
            .map((location) => ({
                value: location.district,
                label: location.district,
                group: location.province,
            }));
    }, [locations]);

    /** Sector-level options for a district, preceded by the whole-district record. */
    const sectorOptions = useCallback(
        (district: string | null, includeWholeDistrict = true): PickerOption[] => {
            if (!district) return [];
            const inDistrict = locations.filter((location) => location.district === district && !location.cell && !location.village);
            const whole = inDistrict.find((location) => !location.sector);
            const sectors = inDistrict
                .filter((location) => location.sector)
                .sort((a, b) => (a.sector ?? '').localeCompare(b.sector ?? ''))
                .map((location) => ({ value: location.id, label: location.sector as string, description: `${district} District` }));
            return includeWholeDistrict && whole
                ? [{ value: whole.id, label: `Whole of ${district}`, description: 'Every sector in the district' }, ...sectors]
                : sectors;
        },
        [locations],
    );

    return { locations, utilities, districtOptions, sectorOptions, loading, error, reload: load };
}
