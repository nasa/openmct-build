/**
 * Approximate sunrise (local civil) for a date and lat/lon.
 * Based on the NOAA solar-position algorithm.
 * @returns {Date|null} null if sun never rises (polar day/night)
 */
export function calculateSunrise(date, latitude, longitude) {
  const rad = Math.PI / 180;
  const dayMs = 86400000;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const e = rad * 23.4397; // obliquity
  const toJulian = (d) => d / dayMs - 0.5 + J1970;
  const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
  const toDays = (d) => toJulian(d) - J2000;
  const declination = (l, b) =>
      Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) => {
      const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
      const P = rad * 102.9372;
      return M + C + P + Math.PI;
  };
  const julianCycle = (d, lw) => Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => 0.0009 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransit = (ds, M, L) =>
      J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, d) =>
      Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
  const lw = rad * -longitude;
  const phi = rad * latitude;
  const d = toDays(+date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransit(ds, M, L);
  // -0.833° = standard refraction + solar radius for "sunrise"
  const h0 = rad * -0.833;
  const w = hourAngle(h0, phi, dec);
  if (Number.isNaN(w)) return null;
  const a = approxTransit(w, lw, n);
  const Jset = solarTransit(a, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  return fromJulian(Jrise);
}
