import { calculateSunrise } from './calculateSunrise.js';

export function sunriseCalculationPlugin(options = {}, {registerRuntimeSubstitution} = {}) {
    const {
        latitude = 33.158,
        longitude = -117.351,
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
