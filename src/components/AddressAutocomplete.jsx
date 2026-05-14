import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { loadGoogleMaps } from '../utils/loadGoogleMaps.js';

/**
 * Campo de texto con Google Places Autocomplete para direcciones en Colombia.
 *
 * Props:
 *   value       — string: dirección actual
 *   onChange    — fn({ address, lat, lng, city }) llamada al seleccionar sugerencia
 *   placeholder — string opcional
 *   className   — clases CSS adicionales
 *   disabled    — boolean
 */
export default function AddressAutocomplete({ value, onChange, placeholder = 'Buscar dirección…', className = '', disabled = false }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !inputRef.current) return;

        autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'co' },
          fields: ['formatted_address', 'geometry', 'address_components'],
        });

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          if (!place.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const city = extractCity(place.address_components ?? []);

          onChange({
            address: place.formatted_address ?? '',
            lat,
            lng,
            city,
          });
        });

        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  function extractCity(components) {
    for (const comp of components) {
      if (comp.types.includes('locality')) return comp.long_name;
      if (comp.types.includes('administrative_area_level_2')) return comp.long_name;
    }
    return '';
  }

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled || status === 'error'}
        className={`pl-9 ${className}`}
        autoComplete="off"
        onBlur={(e) => {
          // Captura texto libre si el usuario escribe sin seleccionar sugerencia
          const typed = e.target.value;
          if (typed !== value) {
            onChange({ address: typed, lat: null, lng: null, city: '' });
          }
        }}
      />
      {status === 'loading' && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 animate-spin" />
      )}
      {status === 'error' && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-amber-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Maps no disponible
        </span>
      )}
    </div>
  );
}
