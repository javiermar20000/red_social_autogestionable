import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_CENTER = [-33.4489, -70.6693];
const DEFAULT_ZOOM = 15;
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const COORD_PRECISION = 6;

const ensureLeafletIcons = (() => {
  let configured = false;
  return () => {
    if (configured) return;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
    configured = true;
  };
})();

const readCoordinate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isValidLatLng = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
};

const roundCoord = (value) => Number(value.toFixed(COORD_PRECISION));

const buildGeocodeQueries = (address, city, region) => {
  const queries = [];
  const addressLabel = [address, city, region].filter(Boolean).join(', ');
  if (addressLabel) queries.push(addressLabel);
  const cityRegion = [city, region].filter(Boolean).join(', ');
  if (cityRegion) queries.push(cityRegion);
  if (city) queries.push(city);
  if (region) queries.push(region);
  return Array.from(new Set(queries.map((q) => String(q).trim()).filter(Boolean)));
};

const BusinessLocationPicker = ({
  address,
  city,
  region,
  value,
  onChange,
  heightClass = 'h-[360px]',
}) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const lastGeocodeKeyRef = useRef('');
  const lastEmittedRef = useRef('');

  const [selectedCoords, setSelectedCoords] = useState(null);
  const [status, setStatus] = useState('idle');

  const queries = useMemo(() => buildGeocodeQueries(address, city, region), [address, city, region]);
  const addressLabel = useMemo(() => [address, city, region].filter(Boolean).join(', '), [address, city, region]);
  const queriesKey = useMemo(() => queries.map((item) => item.toLowerCase()).join('|'), [queries]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const emitChange = useCallback((coords) => {
    if (!coords || !isValidLatLng(coords)) return;
    const payload = {
      latitude: roundCoord(coords[0]),
      longitude: roundCoord(coords[1]),
    };
    const key = `${payload.latitude},${payload.longitude}`;
    if (lastEmittedRef.current === key) return;
    lastEmittedRef.current = key;
    onChangeRef.current?.(payload);
  }, []);

  const updateSelection = useCallback(
    (coords, { recenter = true } = {}) => {
      if (!coords || !isValidLatLng(coords)) return;
      const rounded = [roundCoord(coords[0]), roundCoord(coords[1])];
      setSelectedCoords(rounded);
      emitChange(rounded);
      const map = mapRef.current;
      if (map && recenter) {
        map.setView(rounded, DEFAULT_ZOOM, { animate: true });
      }
    },
    [emitChange]
  );

  useEffect(() => {
    const lat = readCoordinate(value?.latitude);
    const lng = readCoordinate(value?.longitude);
    const coords = lat === null || lng === null ? null : [lat, lng];
    if (!coords || !isValidLatLng(coords)) return;
    const rounded = [roundCoord(coords[0]), roundCoord(coords[1])];
    setSelectedCoords(rounded);
    if (queriesKey && !lastGeocodeKeyRef.current) {
      lastGeocodeKeyRef.current = queriesKey;
    }
    if (!queriesKey && !lastGeocodeKeyRef.current) {
      lastGeocodeKeyRef.current = '';
    }
  }, [value?.latitude, value?.longitude, queriesKey]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    ensureLeafletIcons();
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    });
    L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handleClick = (event) => {
      const { lat, lng } = event.latlng || {};
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      updateSelection([lat, lng], { recenter: false });
    };
    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [updateSelection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCoords) return;
    const latlng = L.latLng(selectedCoords[0], selectedCoords[1]);
    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
      markerRef.current.on('dragend', (event) => {
        const next = event?.target?.getLatLng?.();
        if (!next) return;
        updateSelection([next.lat, next.lng], { recenter: false });
      });
    } else {
      markerRef.current.setLatLng(latlng);
    }
    if (!map.getBounds().contains(latlng)) {
      map.setView(latlng, DEFAULT_ZOOM);
    }
    setTimeout(() => map.invalidateSize(), 150);
  }, [selectedCoords, updateSelection]);

  useEffect(() => {
    if (!queries.length) {
      setStatus('idle');
      return;
    }
    if (queriesKey && lastGeocodeKeyRef.current === queriesKey) return;
    lastGeocodeKeyRef.current = queriesKey;
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    const controller = new AbortController();
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        setStatus('loading');
        for (const rawQuery of queries) {
          const normalizedQuery = rawQuery.toLowerCase();
          const queryText = normalizedQuery.includes('chile') ? rawQuery : `${rawQuery}, Chile`;
          const query = encodeURIComponent(queryText);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cl&q=${query}`,
            {
              signal: controller.signal,
              headers: { 'Accept-Language': 'es' },
            }
          );
          if (!response.ok) continue;
          const data = await response.json();
          const first = Array.isArray(data) ? data[0] : null;
          const latValue = readCoordinate(first?.lat);
          const lonValue = readCoordinate(first?.lon);
          const coordsCandidate = latValue === null || lonValue === null ? null : [latValue, lonValue];
          if (!coordsCandidate || !isValidLatLng(coordsCandidate)) continue;
          updateSelection(coordsCandidate);
          setStatus('ready');
          return;
        }
        setStatus('error');
      } catch (err) {
        if (controller.signal.aborted) return;
        setStatus('error');
      }
    }, 650);
    return () => {
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
      controller.abort();
    };
  }, [queries, queriesKey, updateSelection]);

  const helperText = useMemo(() => {
    if (status === 'loading') return 'Buscando la ubicacion exacta...';
    if (selectedCoords) return 'Arrastra el marcador o haz clic en el mapa para ajustar la ubicacion.';
    if (status === 'error') return 'No pudimos ubicar la direccion. Marca el punto manualmente.';
    if (addressLabel) return 'Haz clic en el mapa para indicar la ubicacion exacta.';
    return 'Escribe la direccion para ubicar el negocio.';
  }, [status, selectedCoords, addressLabel]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <div
          ref={mapContainerRef}
          className={`${heightClass} w-full overflow-hidden rounded-2xl border border-border`}
          role="region"
          aria-label="Mapa para ubicar negocio"
        />
        <div className="pointer-events-none absolute left-4 top-4 z-[400] max-w-[260px] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft backdrop-blur">
          {helperText}
        </div>
      </div>
      {selectedCoords && (
        <p className="text-xs text-muted-foreground">
          Coordenadas guardadas: {selectedCoords[0]}, {selectedCoords[1]}
        </p>
      )}
    </div>
  );
};

export default BusinessLocationPicker;
