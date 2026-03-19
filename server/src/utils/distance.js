const locationMap = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  delhi: { lat: 28.6139, lng: 77.209 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  jaipur: { lat: 26.9124, lng: 75.7873 }
};

const normalize = (value = "") => value.trim().toLowerCase();

const getCoordinates = (location = "") => {
  const normalized = normalize(location);
  return locationMap[normalized] || null;
};

export const resolveCoordinates = (location = "", latitude, longitude) => {
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude)
  ) {
    return { latitude, longitude };
  }

  const coords = getCoordinates(location);
  if (!coords) {
    return { latitude: null, longitude: null };
  }

  return { latitude: coords.lat, longitude: coords.lng };
};

export const getDistanceScore = (origin, target) => {
  const originCoords = getCoordinates(origin);
  const targetCoords = getCoordinates(target);

  if (originCoords && targetCoords) {
    const latDiff = originCoords.lat - targetCoords.lat;
    const lngDiff = originCoords.lng - targetCoords.lng;
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  }

  if (!origin || !target) {
    return 9999;
  }

  const normalizedOrigin = normalize(origin);
  const normalizedTarget = normalize(target);

  if (normalizedOrigin === normalizedTarget) {
    return 0;
  }

  if (
    normalizedOrigin.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedOrigin)
  ) {
    return 1;
  }

  return 50;
};

export const getCoordinateDistance = (origin, target) => {
  if (!origin || !target) {
    return 9999;
  }

  if (
    typeof origin.latitude !== "number" ||
    typeof origin.longitude !== "number" ||
    typeof target.latitude !== "number" ||
    typeof target.longitude !== "number"
  ) {
    return 9999;
  }

  const latDiff = origin.latitude - target.latitude;
  const lngDiff = origin.longitude - target.longitude;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
};

export const isLocationMatch = (firstLocation = "", secondLocation = "") =>
  getDistanceScore(firstLocation, secondLocation) <= 1;

export const buildGoogleMapsLink = ({ latitude, longitude, query }) => {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || "")}`;
};
