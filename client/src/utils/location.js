const knownPlaces = [
  { city: "Pune", latitude: 18.5204, longitude: 73.8567, address: "FC Road, Pune" },
  { city: "Mumbai", latitude: 19.076, longitude: 72.8777, address: "Dadar, Mumbai" },
  { city: "Delhi", latitude: 28.6139, longitude: 77.209, address: "Central Delhi" },
  { city: "Bangalore", latitude: 12.9716, longitude: 77.5946, address: "MG Road, Bangalore" },
  { city: "Hyderabad", latitude: 17.385, longitude: 78.4867, address: "Banjara Hills, Hyderabad" },
  { city: "Chennai", latitude: 13.0827, longitude: 80.2707, address: "T Nagar, Chennai" }
];

const getNearestKnownPlace = (latitude, longitude) => {
  return knownPlaces
    .map((place) => ({
      ...place,
      distance:
        Math.sqrt(
          (place.latitude - latitude) * (place.latitude - latitude) +
            (place.longitude - longitude) * (place.longitude - longitude)
        )
    }))
    .sort((a, b) => a.distance - b.distance)[0];
};

export const reverseGeocodeMock = (latitude, longitude) => {
  const nearest = getNearestKnownPlace(latitude, longitude);

  if (!nearest || nearest.distance > 0.35) {
    return {
      location: "Current location",
      fullAddress: `Detected location near ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
    };
  }

  return {
    location: nearest.city,
    fullAddress: `${nearest.address} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
  };
};

const pickLocationName = (address = {}) => {
  return (
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.town ||
    address.village ||
    address.city ||
    address.county ||
    address.state_district ||
    address.state ||
    "Current location"
  );
};

export const reverseGeocodeLive = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
  );

  if (!response.ok) {
    throw new Error("Unable to fetch place name for your current location");
  }

  const data = await response.json();

  return {
    location: pickLocationName(data.address),
    fullAddress: data.display_name || `Detected location near ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
  };
};

export const getCurrentLocationDetails = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        let address = reverseGeocodeMock(latitude, longitude);

        try {
          address = await reverseGeocodeLive(latitude, longitude);
        } catch (error) {
          console.warn("Falling back to mock place name lookup", error);
        }

        resolve({
          latitude,
          longitude,
          location: address.location,
          fullAddress: address.fullAddress
        });
      },
      () => {
        reject(new Error("Unable to access your current location"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
