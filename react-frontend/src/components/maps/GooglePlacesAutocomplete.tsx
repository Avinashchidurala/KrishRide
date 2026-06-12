import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  ListItemText,
  ListItem,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
interface SavedSuggestion {
  label: string;
  lat: number;
  lng: number;
  isSaved: true;
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
}

interface GooglePlacesAutocompleteProps {
  label?: string;
  value: string;
  onChange: (address: string, location?: { lat: number; lng: number }) => void;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  InputProps?: any;
  sx?: any;
  suggestions?: SavedSuggestion[];
}
type AutocompleteOption = string | SavedSuggestion | PlaceSuggestion;

function isSavedSuggestion(
  option: AutocompleteOption
): option is SavedSuggestion {
  return typeof option === 'object' && option !== null && 'isSaved' in option;
}

function isPlaceSuggestion(
  option: AutocompleteOption
): option is PlaceSuggestion {
  return typeof option === 'object' && option !== null && 'placeId' in option;
}


export default function GooglePlacesAutocomplete({
  label,
  value,
  onChange,
  required = false,
  fullWidth = true,
  disabled = false,
  error = false,
  helperText,
  InputProps,
  sx,
  suggestions = [], 
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [googleSuggestions, setGoogleSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const requestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if Google Maps is ready and initialize services
  useEffect(() => {
    const checkAndInit = () => {
      if (
        typeof window !== 'undefined' &&
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        typeof window.google.maps.places.AutocompleteService === 'function'
      ) {
        try {
          autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          placesServiceRef.current = new window.google.maps.places.PlacesService(
            document.createElement('div')
          );
          setIsReady(true);
          return true;
        } catch (error) {
          console.error('Error initializing Places services:', error);
          return false;
        }
      }
      return false;
    };

    // Try immediately
    if (checkAndInit()) {
      console.log('✅ Places services initialized immediately');
      return;
    }

    // Aggressive polling for Google Maps
    const interval = setInterval(() => {
      if (checkAndInit()) {
        console.log('✅ Places services initialized via polling');
        clearInterval(interval);
      }
    }, 50); // Check every 50ms

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isReady) {
        console.error('Google Maps Places API failed to initialize after 10 seconds');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isReady]);

  // Sync input value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!input.trim()) {
        setGoogleSuggestions([]);
        setOpen(suggestions.length > 0);
        setLoading(false);
        return;
      }

      if (!isReady || !autocompleteServiceRef.current) {
        return;
      }

      if (requestTimerRef.current) {
        clearTimeout(requestTimerRef.current);
      }

      setLoading(true);

      requestTimerRef.current = setTimeout(() => {
        if (!autocompleteServiceRef.current) {
          setLoading(false);
          return;
        }

        autocompleteServiceRef.current.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'in' },
            types: ['establishment', 'geocode'],
          },
          (predictions, status) => {
            setLoading(false);

            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions &&
              predictions.length > 0
            ) {
              const mappedSuggestions: PlaceSuggestion[] = predictions.map((p) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting?.main_text,
                secondaryText: p.structured_formatting?.secondary_text,
              }));

              setGoogleSuggestions(mappedSuggestions);
              setOpen(true);
            } else {
              setGoogleSuggestions([]);
              setOpen(false);
            }
          }
        );
      }, 300);
    },
    [isReady]
  );

  // Handle place selection
  const handleSelect = useCallback(
    (option: PlaceSuggestion | null) => {
      if (!option || !placesServiceRef.current) {
        return;
      }

      setLoading(true);
      setOpen(false);

      placesServiceRef.current.getDetails(
        {
          placeId: option.placeId,
          fields: ['formatted_address', 'geometry', 'name'],
        },
        (place, status) => {
          setLoading(false);

          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            const address = place.formatted_address || place.name || option.description;
            let location: { lat: number; lng: number } | undefined;

            if (place.geometry?.location) {
              location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };
            }

            setInputValue(address);
            onChange(address, location);
          } else {
            setInputValue(option.description);
            onChange(option.description);
          }

          setGoogleSuggestions([]);
        }
      );
    },
    [onChange]
  );

  // Show loading if not ready - but only briefly
  if (!isReady) {
    // Don't show disabled field, just show a minimal loading indicator
    return (
      <TextField
        label={label}
        value={inputValue}
        fullWidth={fullWidth}
        required={required}
        error={error}
        helperText={helperText}
        InputProps={{
          ...InputProps,
          startAdornment: InputProps?.startAdornment || (
            <LocationIcon sx={{ color: 'text.secondary', mr: 2 }} />
          ),
          endAdornment: <CircularProgress size={16} />,
        }}
        sx={{
          ...sx,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        }}
      />
    );
  }

  return (
    <Autocomplete<AutocompleteOption, false, false, true>
     freeSolo                 
     clearOnBlur={false} 
      open={open && (suggestions.length > 0 || googleSuggestions.length > 0)}
      onOpen={() => {
        if (suggestions.length > 0 || googleSuggestions.length > 0) {
          setOpen(true);
        }
      }}
      onClose={() => setOpen(false)}
      options={[...suggestions, ...googleSuggestions]}
      getOptionLabel={(option) => {
  if (typeof option === 'string') return option;
  if (isSavedSuggestion(option)) return option.label;
  if (isPlaceSuggestion(option)) return option.description;
  return '';
}}


      loading={loading}
      inputValue={inputValue}
      onInputChange={(_, newValue, reason) => {
        setInputValue(newValue);
        if (reason === 'input') {
          fetchSuggestions(newValue);
        } else if (reason === 'reset' || reason === 'clear') {
          setGoogleSuggestions([]);
          setOpen(suggestions.length > 0);
        }
      }}
      onChange={(_, newValue) => {
  if (!newValue) return;

  // Typed text
  if (typeof newValue === 'string') {
    setInputValue(newValue);
    onChange(newValue);
    return;
  }

  //  SAVED ADDRESS → USED FOR RIDE SEARCH
  if (isSavedSuggestion(newValue)) {
    setInputValue(newValue.label);
    onChange(newValue.label, {
      lat: newValue.lat,
      lng: newValue.lng,
    });
    return;
  }

  // Google place
  if (isPlaceSuggestion(newValue)) {
    handleSelect(newValue);
  }
}}



      disabled={disabled}
      filterOptions={(x) => x}
      noOptionsText={loading ? 'Searching...' : 'No places found'}
      renderOption={(props, option) => (
        
        <ListItem {...props} key={'isSaved' in option && option.isSaved? `saved-${option.label}`: `google-${option.placeId}` }>

  <LocationIcon sx={{ color: 'primary.main', mr: 1.5, fontSize: 20 }} />
  <ListItemText
    primary={'isSaved' in option && option.isSaved ? option.label : option.mainText || (option.description?? '').split(',')[0]}
    secondary={'isSaved' in option && option.isSaved ? '' : option.secondaryText || (option.description?? '').split(',').slice(1).join(',').trim()}
  />
  </ListItem>

      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={loading ? 'Searching places...' : helperText}
          fullWidth={fullWidth}
          InputProps={{
            ...params.InputProps,
            ...InputProps,
            startAdornment: InputProps?.startAdornment || (
              <LocationIcon sx={{ color: 'text.secondary', mr: 2 }} />
            ),
          }}
          sx={{
            ...sx,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
          }}
        />
      )}
      ListboxProps={{
        style: { maxHeight: '300px' },
      }}
    />
  );
}
