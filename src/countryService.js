import * as THREE from 'three';

export function latLonToVector3(lat, lon, radius = 20) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return new THREE.Vector3(x, y, z);
}

export function vector3ToLatLon(v, radius = 20) {
  const ny = Math.max(-1, Math.min(1, v.y / radius));
  const lat = Math.asin(ny) * (180 / Math.PI);
  let theta = Math.atan2(v.z, -v.x);
  let lon = theta * (180 / Math.PI) - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lat, lon };
}

// Ray-casting point in polygon
function pointInPolygon(x, y, ring) {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export class CountryService {
  constructor() {
    this.countries = [];
    this.loaded = false;
    this.lastDetectedCountry = null;
  }

  async load() {
    try {
      const res = await fetch('/data/countries.json');
      this.countries = await res.json();
      this.loaded = true;
      console.log(`Loaded ${this.countries.length} countries successfully.`);
      return this.countries;
    } catch (err) {
      console.error('Failed to load countries.json:', err);
      return [];
    }
  }

  findCountry(lat, lon) {
    if (!this.loaded || !this.countries.length) return null;

    // Check last detected country first for high performance (spatial coherence)
    if (this.lastDetectedCountry) {
      const c = this.lastDetectedCountry;
      if (lon >= c.bbox[0] && lon <= c.bbox[2] && lat >= c.bbox[1] && lat <= c.bbox[3]) {
        for (const poly of c.polys) {
          const b = poly.bbox;
          if (lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]) {
            if (pointInPolygon(lon, lat, poly.ring)) {
              return c;
            }
          }
        }
      }
    }

    // Search across all countries
    for (const c of this.countries) {
      // Bounding box filter
      if (lon < c.bbox[0] || lon > c.bbox[2] || lat < c.bbox[1] || lat > c.bbox[3]) {
        continue;
      }

      for (const poly of c.polys) {
        const b = poly.bbox;
        if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) {
          continue;
        }

        if (pointInPolygon(lon, lat, poly.ring)) {
          this.lastDetectedCountry = c;
          return c;
        }
      }
    }

    this.lastDetectedCountry = null;
    return null; // Ocean or international waters
  }

  createBorderLinesMesh(radius = 20.02) {
    const points = [];

    for (const c of this.countries) {
      for (const poly of c.polys) {
        const ring = poly.ring;
        for (let i = 0; i < ring.length - 1; i++) {
          const p1 = ring[i];
          const p2 = ring[i + 1];

          // Avoid wrapping artifacts across the 180° antimeridian
          if (Math.abs(p1[0] - p2[0]) > 180) continue;

          const v1 = latLonToVector3(p1[1], p1[0], radius);
          const v2 = latLonToVector3(p2[1], p2[0], radius);

          points.push(v1.x, v1.y, v1.z);
          points.push(v2.x, v2.y, v2.z);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    const material = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return new THREE.LineSegments(geometry, material);
  }

  // Calculate Great Circle path between two points
  getGreatCirclePath(startLat, startLon, endLat, endLon, steps = 100) {
    const v1 = latLonToVector3(startLat, startLon, 1).normalize();
    const v2 = latLonToVector3(endLat, endLon, 1).normalize();

    let dot = Math.max(-1, Math.min(1, v1.dot(v2)));
    const omega = Math.acos(dot);
    const sinOmega = Math.sin(omega);

    const waypoints = [];

    if (sinOmega < 0.0001) {
      // Extremely close or antipodal
      waypoints.push({ lat: endLat, lon: endLon });
      return waypoints;
    }

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const w1 = Math.sin((1 - t) * omega) / sinOmega;
      const w2 = Math.sin(t * omega) / sinOmega;

      const vt = new THREE.Vector3(
        w1 * v1.x + w2 * v2.x,
        w1 * v1.y + w2 * v2.y,
        w1 * v1.z + w2 * v2.z
      ).normalize();

      waypoints.push(vector3ToLatLon(vt, 1));
    }

    return waypoints;
  }
}

export const countryService = new CountryService();

