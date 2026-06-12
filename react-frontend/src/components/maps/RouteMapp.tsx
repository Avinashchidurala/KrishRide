import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  Stack,
  Paper,
} from "@mui/material";

export default function RouteMap({
  startLocation,
  endLocation,
  onRouteSelect,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [routes, setRoutes] = useState([]);
  const polylinesRef = useRef([]);

  /* ---------------- STOPS ---------------- */
  const [stops, setStops] = useState([]);
  const [stopInput, setStopInput] = useState("");

  /* ---------------- CITY SUGGESTIONS ---------------- */
  const [suggestedCities, setSuggestedCities] = useState([]);

  /* ---------------- LOAD MAP ---------------- */

useEffect(() => {
  if (window.google && window.google.maps) {
    initMap();
    return;
  }

  const script = document.createElement("script");
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=AIzaSyAzKj6mJJYVAZ233kMUzTPOO3cuhBSfSvo&libraries=places";
  script.async = true;
  script.defer = true;
  script.onload = () => {
    initMap();
  };

  document.head.appendChild(script);
}, []);


const initMap = () => {
  if (!mapRef.current || map) return;

  const mapInstance = new window.google.maps.Map(mapRef.current, {
    zoom: 7,
    center: { lat: 20.5937, lng: 78.9629 },
  });

  setMap(mapInstance);
};


  /* ---------------- FETCH ROUTES ---------------- */

  useEffect(() => {
    if (!map || !startLocation || !endLocation) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: startLocation,
        destination: endLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true,
        waypoints: stops.map((s) => ({ location: s, stopover: true })),
      },
      (result, status) => {
        if (status === "OK" && result?.routes?.length) {
          setRoutes(result.routes);
          drawRoutes(result.routes, map);

          // ❌ IMPORTANT: clear old suggestions on new route fetch
          setSuggestedCities([]);
        }
      }
    );
  }, [map, startLocation, endLocation, stops]);

  /* ---------------- DRAW ROUTES ---------------- */

  const drawRoutes = (routes, map) => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    routes.forEach((route, index) => {
      const polyline = new window.google.maps.Polyline({
        path: route.overview_path,
        strokeColor: "#999",
        strokeOpacity: 0.6,
        strokeWeight: 4,
        map,
      });

      // polyline.addListener("click", () => selectRouteByIndex(index));
      polylinesRef.current.push(polyline);
    });

    map.fitBounds(routes[0].bounds);
  };

  /* ---------------- TOTAL DISTANCE ---------------- */

  const getTotalDistanceAndDuration = (route) => {
    let distance = 0;
    let duration = 0;

    route.legs.forEach((leg) => {
      distance += leg.distance.value;
      duration += leg.duration.value;
    });

    return {
      distanceText: (distance / 1000).toFixed(1) + " km",
      durationText: Math.round(duration / 60) + " mins",
      distance: (distance / 1000).toFixed(1),
      duration: Math.round(duration / 60),
    };
  };

  /* ---------------- EXTRACT CITIES ---------------- */

  const extractCitiesFromPath = async (path) => {
    const geocoder = new window.google.maps.Geocoder();
    const cities = new Set();
    const STEP = Math.max(Math.floor(path.length / 10), 1);

    for (let i = 0; i < path.length; i += STEP) {
      await new Promise((resolve) => {
        geocoder.geocode({ location: path[i] }, (results, status) => {
          if (status === "OK" && results?.length) {
            const components = results[0].address_components;

            const city =
              components.find((c) => c.types.includes("locality")) ||
              components.find((c) =>
                c.types.includes("administrative_area_level_2")
              );

            if (city) cities.add(city.long_name);
          }
          resolve();
        });
      });
    }

    return Array.from(cities);
  };

  /* ---------------- ROUTE SELECT (🔥 SINGLE SOURCE OF TRUTH) ---------------- */

  const selectRouteByIndex = async (index) => {
    // Highlight route
    polylinesRef.current.forEach((p, i) => {
      p.setOptions({
        strokeColor: i === index ? "#1976d2" : "#999",
        strokeOpacity: i === index ? 1 : 0.5,
        strokeWeight: i === index ? 6 : 4,
      });
    });

    // ❌ CLEAR OLD SUGGESTIONS
    setSuggestedCities([]);

    const selectedRoute = routes[index];

    const totals = getTotalDistanceAndDuration(selectedRoute);

    // ✅ EXTRACT CITIES FOR THIS ROUTE ONLY
    const citiesPassed = await extractCitiesFromPath(
      selectedRoute.overview_path
    );

    // ✅ UPDATE SUGGESTIONS
    setSuggestedCities(citiesPassed);

    onRouteSelect({
      selectedRoute,
      totals,
      distance_text: totals.distanceText,
      duration_text: totals.durationText,
      cities_passed: citiesPassed,
      stops,
    });
  };

  /* ---------------- STOP HANDLERS ---------------- */

  const addStop = (city) => {
    if (!city || stops.includes(city)) return;
    setStops([...stops, city]);
    setStopInput("");
  };

  const removeStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  /* ---------------- UI ---------------- */

  return (
<div>
  {/* MAP */}
  <Box
    sx={{
      width: "100%",
      height: 400,
      mb: 2,
      borderRadius: 2,
      overflow: "hidden",
      border: "1px solid #e0e0e0",
    }}
  >
    <div
    ref={mapRef}
    style={{ width: "100%", height: "100%" }}
  />
  </Box>


  {/* STOPS INPUT */}
  <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
    <Typography fontWeight={600}>Add Stops</Typography>

    <Stack direction="row" spacing={1} mt={1}>
      <TextField
        fullWidth
        size="small"
        value={stopInput}
        onChange={(e) => setStopInput(e.target.value)}
        placeholder="Enter city"
      />
      <Button variant="contained" onClick={() => addStop(stopInput)}>
        Add
      </Button>
    </Stack>

    <Stack spacing={1} mt={1}>
      {stops.map((stop, i) => (
        <Stack
          key={i}
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography>📍 {stop}</Typography>
          <Button
            size="small"
            color="error"
            onClick={() => removeStop(i)}
          >
            Remove
          </Button>
        </Stack>
      ))}
    </Stack>
  </Paper>

  {/* SUGGESTED CITIES */}
  {suggestedCities.length > 0 && (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Typography fontWeight={600}>
        Suggested Cities on Selected Route
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
        {suggestedCities
          .filter((city) => !stops.includes(city))
          .map((city, i) => (
            <Chip
              key={i}
              label={`+ ${city}`}
              clickable
              onClick={() => addStop(city)}
              color="primary"
              variant="outlined"
            />
          ))}
      </Stack>
    </Paper>
  )}

  {/* ROUTES */}
  {routes.length > 0 && (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography fontWeight={600}>Select Route</Typography>

      <Stack spacing={1} mt={1}>
        {routes.map((r, i) => {
          const { distanceText, durationText } =
            getTotalDistanceAndDuration(r);

          return (
            <Button
              key={i}
              variant="outlined"
              fullWidth
              onClick={() => selectRouteByIndex(i)}
              sx={{ justifyContent: "flex-start", p: 1.2 }}
            >
              Route {i + 1}: {distanceText} · {durationText}
            </Button>
          );
        })}
      </Stack>
    </Paper>
  )}
</div>
  );
}
