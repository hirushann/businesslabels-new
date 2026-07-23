"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google?: {
      maps?: typeof google.maps;
    };
  }
}

type LegacySuggestion = {
  isLegacy: true;
  placePrediction: google.maps.places.AutocompletePrediction;
};

type AddressSuggestion = google.maps.places.AutocompleteSuggestion | LegacySuggestion;

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }) => void;
  className?: string;
  hasError?: boolean;
  placeholder?: string;
};

const MIN_AUTOCOMPLETE_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 300;

const isLegacySuggestion = (suggestion: AddressSuggestion): suggestion is LegacySuggestion => {
  return "isLegacy" in suggestion && suggestion.isLegacy;
};

const hasPlacePrediction = (
  suggestion: google.maps.places.AutocompleteSuggestion
): suggestion is google.maps.places.AutocompleteSuggestion & {
  placePrediction: google.maps.places.PlacePrediction;
} => Boolean(suggestion.placePrediction);

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  className,
  hasError,
  placeholder,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useLegacy, setUseLegacy] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const requestIdRef = useRef(0);

  // Initialize Maps library
  useEffect(() => {
    const initialize = async () => {
      if (window.google?.maps?.importLibrary) {
        try {
          await window.google.maps.importLibrary("places");
          setIsLoaded(true);
          
          // Pre-initialize session token and legacy service as fallback
          if (!sessionTokenRef.current) {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
          }
          // We don't instantiate legacy service here to avoid deprecation warning.
          // It will be instantiated on-demand if modern API fails.
        } catch (error) {
          console.error("Failed to load Places library:", error);
        }
      } else {
        setTimeout(initialize, 100);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input: string, requestId: number) => {
    const trimmedInput = input.trim();

    if (trimmedInput.length < MIN_AUTOCOMPLETE_LENGTH || !isLoaded) {
      setSuggestions([]);
      return;
    }

    // Try modern API first
    if (!useLegacy) {
      try {
        const { suggestions: results } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmedInput,
          sessionToken: sessionTokenRef.current ?? undefined,
          includedRegionCodes: ["nl", "be", "de"],
        });
        if (requestIdRef.current === requestId) {
          setSuggestions(results.filter(hasPlacePrediction));
        }
        return;
      } catch (error) {
        // If "Places API (New)" is not enabled, fallback to legacy
        const message = error instanceof Error ? error.message : "";
        if (message.includes("disabled") || message.includes("not authorized") || message.includes("blocked")) {
          console.warn("Places API (New) not enabled or blocked, falling back to legacy AutocompleteService.");
          setUseLegacy(true);
        } else {
          console.error("Error fetching suggestions (Modern):", error);
        }
      }
    }

    // Legacy Fallback
    if (useLegacy) {
      if (!autocompleteServiceRef.current && window.google.maps.places.AutocompleteService) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
      
      if (autocompleteServiceRef.current) {
        try {
          autocompleteServiceRef.current.getPlacePredictions(
          {
            input: trimmedInput,
            componentRestrictions: { country: ["nl", "be", "de"] },
            sessionToken: sessionTokenRef.current ?? undefined,
          },
          (predictions, status) => {
            if (requestIdRef.current !== requestId) {
              return;
            }

            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              setSuggestions((predictions ?? []).map((placePrediction) => ({ placePrediction, isLegacy: true })));
            } else {
              setSuggestions([]);
            }
          }
        );
      } catch (error) {
        console.error("Error fetching suggestions (Legacy):", error);
      }
    }
    }
  }, [isLoaded, useLegacy]);

  useEffect(() => {
    const trimmedInput = value.trim();

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!isOpen || trimmedInput.length < MIN_AUTOCOMPLETE_LENGTH || !isLoaded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchSuggestions(trimmedInput, requestId);
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [fetchSuggestions, value, isLoaded, isOpen]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);

    if (val.trim().length < MIN_AUTOCOMPLETE_LENGTH) {
      setSuggestions([]);
    }
  };

  const getPredictionText = (suggestion: AddressSuggestion) => {
    if (isLegacySuggestion(suggestion)) {
      const prediction = suggestion.placePrediction;

      return {
        mainText: prediction.structured_formatting?.main_text ?? prediction.description ?? "",
        secondaryText: prediction.structured_formatting?.secondary_text ?? "",
      };
    }

    const prediction = suggestion.placePrediction;

    if (!prediction) {
      return {
        mainText: "",
        secondaryText: "",
      };
    }

    return {
      mainText: prediction.mainText?.text ?? prediction.text?.text ?? "",
      secondaryText: prediction.secondaryText?.text ?? "",
    };
  };

  const getSuggestionKey = (suggestion: AddressSuggestion, index: number) => {
    if (isLegacySuggestion(suggestion)) {
      return suggestion.placePrediction.place_id || index;
    }

    return suggestion.placePrediction?.placeId || index;
  };

  const handleSelect = async (suggestion: AddressSuggestion) => {
    let description: string;
    let placeId: string;
    let isLegacy = false;
    
    if (isLegacySuggestion(suggestion)) {
      description = suggestion.placePrediction.description;
      placeId = suggestion.placePrediction.place_id;
      isLegacy = true;
    } else {
      const placePrediction = suggestion.placePrediction;

      if (!placePrediction) {
        return;
      }

      description = placePrediction.text.text;
      placeId = placePrediction.placeId;
    }

    onChange(description);
    setIsOpen(false);
    setSuggestions([]);

    try {
      let streetNumber = "";
      let route = "";
      let city = "";
      let state = "";
      let postcode = "";
      let country = "";

      if (!isLegacy) {
        // Modern Place API
        const { Place } = await window.google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ["addressComponents"] });
        
        place.addressComponents?.forEach((component) => {
          const types = component.types;
          if (types.includes("street_number")) streetNumber = component.longText ?? "";
          if (types.includes("route")) route = component.longText ?? "";
          if (types.includes("locality")) city = component.longText ?? "";
          if (types.includes("administrative_area_level_1")) state = component.longText ?? "";
          if (types.includes("postal_code")) postcode = component.longText ?? "";
          if (types.includes("country")) country = component.longText ?? "";
        });
      } else {
        // Legacy PlacesService
        const dummyElement = document.createElement("div");
        const service = new window.google.maps.places.PlacesService(dummyElement);
        
        service.getDetails({ placeId, fields: ["address_components"] }, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            place?.address_components?.forEach((component) => {
              const types = component.types;
              if (types.includes("street_number")) streetNumber = component.long_name;
              if (types.includes("route")) route = component.long_name;
              if (types.includes("locality")) city = component.long_name;
              if (types.includes("administrative_area_level_1")) state = component.long_name;
              if (types.includes("postal_code")) postcode = component.long_name;
              if (types.includes("country")) country = component.long_name;
            });
            
            onAddressSelect({
              street: streetNumber ? `${route} ${streetNumber}` : route || description.split(",")[0],
              city,
              state,
              postcode,
              country,
            });
          }
        });
        return; // Legacy uses callback
      }

      onAddressSelect({
        street: streetNumber ? `${route} ${streetNumber}` : route || description.split(",")[0],
        city,
        state,
        postcode,
        country,
      });

      // Reset session token for next search
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-neutral-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>
        <input
          onChange={handleInput}
          className={`${className} w-full pl-12 bg-slate-50 transition-all focus:bg-white`}
          placeholder={placeholder}
          value={value}
          aria-invalid={hasError ? "true" : undefined}
          onFocus={() => {
            setIsOpen(true);
            if (value.trim().length < MIN_AUTOCOMPLETE_LENGTH) {
              setSuggestions([]);
            }
          }}
          autoComplete="off"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
          {suggestions.map((suggestion, index) => {
            const { mainText, secondaryText } = getPredictionText(suggestion);
            
            return (
              <li
                key={getSuggestionKey(suggestion, index)}
                onClick={() => handleSelect(suggestion)}
                className="cursor-pointer px-4 py-3 text-sm text-neutral-800 transition-colors hover:bg-brand-soft"
              >
                <div className="font-semibold">{mainText}</div>
                {secondaryText ? <div className="text-xs text-neutral-500">{secondaryText}</div> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
