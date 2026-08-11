import { calculateSunrise } from './calculateSunrise.js';

export function sunriseCalculationPlugin(options = {}, {registerRuntimeSubstitution} = {}) {
    const {
        latitude = 34.05,   // fallback (e.g. Pasadena) if not provided
        longitude = -118.25,
        date: dateOption = new Date()
    } = options;
    const date = dateOption instanceof Date ? dateOption : new Date(dateOption);
    const sunrise = calculateSunrise(date, latitude, longitude);
    const sunriseTime = sunrise
        ? sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
    registerRuntimeSubstitution('sunriseTime', sunriseTime);
    registerRuntimeSubstitution('sunriseDate', date.toLocaleDateString());
    registerRuntimeSubstitution('sunriseLatitude', String(latitude));
    registerRuntimeSubstitution('sunriseLongitude', String(longitude));

    return () => {};
}
