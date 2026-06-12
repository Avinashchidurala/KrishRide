import { ReactNode, useState, useEffect } from 'react';
import { getMapsConfig } from '../../config/maps';
import { Alert, Box, CircularProgress } from '@mui/material';

interface GoogleMapsLoaderProps {
  children: ReactNode;
}

// Global state
let isScriptLoading = false;
let isScriptLoaded = false;

export default function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapsConfig = getMapsConfig();

  const checkGoogleMapsLoaded = (): boolean => {
    return !!(
      typeof window !== 'undefined' &&
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      window.google.maps.DirectionsService &&
      typeof window.google.maps.places.AutocompleteService === 'function' &&
      typeof window.google.maps.DirectionsService === 'function'
    );
  };

  useEffect(() => {
    // Check if already loaded
    if (checkGoogleMapsLoaded() || isScriptLoaded) {
      setIsReady(true);
      return;
    }

    // Check if script exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script exists, poll for it to load
      const interval = setInterval(() => {
        if (checkGoogleMapsLoaded()) {
          setIsReady(true);
          isScriptLoaded = true;
          clearInterval(interval);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    // Load script if not loading and not loaded
    if (!isScriptLoading && !isScriptLoaded && mapsConfig?.apiKey) {
      isScriptLoading = true;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsConfig.apiKey}&libraries=places,directions&language=en&region=IN`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        isScriptLoading = false;
        // Wait a bit for places library
        setTimeout(() => {
          if (checkGoogleMapsLoaded()) {
            setIsReady(true);
            isScriptLoaded = true;
          } else {
            // Poll for places
            let attempts = 0;
            const poll = setInterval(() => {
              attempts++;
              if (checkGoogleMapsLoaded()) {
                setIsReady(true);
                isScriptLoaded = true;
                clearInterval(poll);
              } else if (attempts > 100) {
                clearInterval(poll);
                setLoadError('Places API failed to load. Please enable Places API in Google Cloud Console.');
              }
            }, 100);
          }
        }, 300);
      };

      script.onerror = () => {
        isScriptLoading = false;
        setLoadError('Failed to load Google Maps script. Please check your API key.');
      };

      document.head.appendChild(script);
    }
  }, [mapsConfig]);

  if (!mapsConfig?.apiKey) {
    return (
      <Box>
        <Alert severity="error">Google Maps API key not configured.</Alert>
        {children}
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError(null)}>
          {loadError}
        </Alert>
        {children}
      </Box>
    );
  }

  if (!isReady) {
    return (
      <Box sx={{ py: 1, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return <>{children}</>;
}
