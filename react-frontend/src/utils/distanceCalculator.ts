/**
 * Calculate distance between two coordinates using Google Maps Distance Matrix API
 * or Directions API as fallback
 */

export interface DistanceResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  route?: google.maps.DirectionsRoute;
}

/**
 * Calculate distance using Google Maps Distance Matrix API
 */
export const calculateDistance = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API is not loaded'));
      return;
    }

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0].elements[0];
          
          if (element.status === google.maps.DistanceMatrixElementStatus.OK) {
            const distanceKm = element.distance.value / 1000; // Convert meters to kilometers
            const durationMinutes = element.duration.value / 60; // Convert seconds to minutes
            
            resolve({
              distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
              duration: Math.round(durationMinutes),
            });
          } else {
            // Fallback to Directions API if Distance Matrix fails
            calculateDistanceWithDirections(origin, destination)
              .then(resolve)
              .catch(reject);
          }
        } else {
          // Fallback to Directions API if Distance Matrix fails
          calculateDistanceWithDirections(origin, destination)
            .then(resolve)
            .catch(reject);
        }
      }
    );
  });
};

/**
 * Calculate distance using Google Maps Directions API (fallback)
 */
const calculateDistanceWithDirections = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceResult> => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API is not loaded'));
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          let totalDistance = 0;
          let totalDuration = 0;

          route.legs.forEach((leg) => {
            if (leg.distance) {
              totalDistance += leg.distance.value;
            }
            if (leg.duration) {
              totalDuration += leg.duration.value;
            }
          });

          const distanceKm = totalDistance / 1000; // Convert meters to kilometers
          const durationMinutes = totalDuration / 60; // Convert seconds to minutes

          resolve({
            distance: Math.round(distanceKm * 100) / 100, // Round to 2 decimal places
            duration: Math.round(durationMinutes),
            route: route,
          });
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
};

