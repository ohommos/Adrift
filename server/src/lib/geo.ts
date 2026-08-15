// Rough ocean regions, used only to label a bottle's drift for flavor text
// (e.g. "North Atlantic"). Not used for matching logic.
const OCEANS = [
  { name: "North Pacific", lat: 32, lon: -168 },
  { name: "South Pacific", lat: -28, lon: -128 },
  { name: "North Atlantic", lat: 36, lon: -42 },
  { name: "South Atlantic", lat: -26, lon: -18 },
  { name: "Indian Ocean", lat: -18, lon: 76 },
  { name: "Southern Ocean", lat: -58, lon: 30 },
  { name: "Arctic Ocean", lat: 76, lon: -10 },
  { name: "Mediterranean", lat: 36, lon: 16 },
  { name: "Caribbean", lat: 15, lon: -74 },
  { name: "Arabian Sea", lat: 14, lon: 64 },
  { name: "South China Sea", lat: 13, lon: 115 },
  { name: "Coral Sea", lat: -17, lon: 154 },
];

function haversine(la1: number, lo1: number, la2: number, lo2: number) {
  const dLat = la1 - la2;
  const dLon = lo1 - lo2;
  // cheap planar approximation is fine for picking the nearest labelled ocean
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

export function nearestOceanName(lat: number, lon: number): string {
  let best = OCEANS[0];
  let bestDist = Infinity;
  for (const o of OCEANS) {
    const d = haversine(lat, lon, o.lat, o.lon);
    if (d < bestDist) {
      bestDist = d;
      best = o;
    }
  }
  return best.name;
}

// Random point at least `minDeg` away from the origin, used to send a fresh
// bottle drifting somewhere on the ocean.
export function randomOceanPoint() {
  const lat = Math.random() * 140 - 70; // avoid poles
  const lon = Math.random() * 360 - 180;
  return { lat, lon };
}
