"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
};

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  className,
  hasError,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useLegacy, setUseLegacy] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionTokenRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);

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
          if (!autocompleteServiceRef.current && window.google.maps.places.AutocompleteService) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
          }
        } catch (error) {
          console.error("Failed to load Places library:", error);
        }
      } else {
        setTimeout(initialize, 100);
      }
    };
    initialize();
  }, []);

  // Sync with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || !isLoaded) {
      setSuggestions([]);
      return;
    }

    // Try modern API first
    if (!useLegacy) {
      try {
        const { suggestions: results } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["nl", "be", "de"],
        });
        setSuggestions(results);
        return;
      } catch (error: any) {
        // If "Places API (New)" is not enabled, fallback to legacy
        if (error.message?.includes("disabled") || error.message?.includes("not authorized")) {
          console.warn("Places API (New) not enabled, falling back to legacy AutocompleteService.");
          setUseLegacy(true);
        } else {
          console.error("Error fetching suggestions (Modern):", error);
        }
      }
    }

    // Legacy Fallback
    if (autocompleteServiceRef.current) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: ["nl", "be", "de"] },
            sessionToken: sessionTokenRef.current,
          },
          (predictions: any, status: any) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              setSuggestions(predictions.map((p: any) => ({ placePrediction: p, isLegacy: true })));
            } else {
              setSuggestions([]);
            }
          }
        );
      } catch (error) {
        console.error("Error fetching suggestions (Legacy):", error);
      }
    }
  }, [isLoaded, useLegacy]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
    fetchSuggestions(val);
  };

  const handleSelect = async (suggestion: any) => {
    const isLegacy = suggestion.isLegacy;
    const placePrediction = suggestion.placePrediction;
    
    // Modern vs Legacy structure
    const description = isLegacy ? placePrediction.description : placePrediction.text.text;
    const placeId = isLegacy ? placePrediction.place_id : placePrediction.placeId;

    setInputValue(description);
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
        const { Place } = await window.google.maps.importLibrary("places") as any;
        const place = new Place({ id: placeId });
        await place.fetchFields({ fields: ["addressComponents"] });
        
        place.addressComponents?.forEach((component: any) => {
          const types = component.types;
          if (types.includes("street_number")) streetNumber = component.longText;
          if (types.includes("route")) route = component.longText;
          if (types.includes("locality")) city = component.longText;
          if (types.includes("administrative_area_level_1")) state = component.longText;
          if (types.includes("postal_code")) postcode = component.longText;
          if (types.includes("country")) country = component.longText;
        });
      } else {
        // Legacy PlacesService
        const dummyElement = document.createElement("div");
        const service = new window.google.maps.places.PlacesService(dummyElement);
        
        service.getDetails({ placeId, fields: ["address_components"] }, (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            place.address_components.forEach((component: any) => {
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
          value={inputValue}
          onChange={handleInput}
          className={`${className} w-full pl-12 bg-slate-50 transition-all focus:bg-white`}
          placeholder="Begin met typen voor suggesties..."
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
          {suggestions.map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            const mainText = suggestion.isLegacy ? prediction.structured_formatting.main_text : prediction.mainText.text;
            const secondaryText = suggestion.isLegacy ? prediction.structured_formatting.secondary_text : prediction.secondaryText.text;
            
            return (
              <li
                key={(suggestion.isLegacy ? prediction.place_id : prediction.placeId) || index}
                onClick={() => handleSelect(suggestion)}
                className="cursor-pointer px-4 py-3 text-sm text-neutral-800 transition-colors hover:bg-amber-50"
              >
                <div className="font-semibold">{mainText}</div>
                <div className="text-xs text-neutral-500">{secondaryText}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
