import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DEFAULT_ZOOM = 15;
const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';

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
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isValidLatLng = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  return true;
};

const formatDistance = (meters) => {
  if (!Number.isFinite(meters)) return 'Distancia no disponible';
  const km = meters / 1000;
  if (km >= 10) return `${km.toFixed(0)} km`;
  return `${km.toFixed(1)} km`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return 'Tiempo no disponible';
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${minutes} min`;
};

const buildGoogleMapsUrl = ({ businessCoords, userCoords }) => {
  if (!businessCoords) return '';
  const [bizLat, bizLng] = businessCoords;
  if (userCoords) {
    const [userLat, userLng] = userCoords;
    return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${bizLat},${bizLng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${bizLat},${bizLng}`;
};

const BusinessMap = ({ business, heightClass = 'h-[420px]' }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const businessMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [businessCoords, setBusinessCoords] = useState(null);
  const [businessStatus, setBusinessStatus] = useState('idle');
  const [userCoords, setUserCoords] = useState(null);
  const [userStatus, setUserStatus] = useState('idle');
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeStatus, setRouteStatus] = useState('idle');

  const businessKey = useMemo(() => {
    const id = business?.id || business?.businessId || '';
    return String(id || business?.name || '');
  }, [business?.id, business?.businessId, business?.name]);

  const businessName = business?.name || 'Negocio';
  const addressLabel = [business?.address, business?.city, business?.region].filter(Boolean).join(', ');
  const geocodeQueries = useMemo(() => {
    const queries = [];
    if (addressLabel) queries.push(addressLabel);
    const cityRegion = [business?.city, business?.region].filter(Boolean).join(', ');
    if (cityRegion) queries.push(cityRegion);
    if (business?.city) queries.push(business.city);
    if (business?.region) queries.push(business.region);
    const unique = Array.from(new Set(queries.map((q) => String(q).trim()).filter(Boolean)));
    return unique;
  }, [addressLabel, business?.city, business?.region]);

  useEffect(() => {
    setBusinessCoords(null);
    setBusinessStatus('idle');
    setUserCoords(null);
    setUserStatus('idle');
    setRouteInfo(null);
    setRouteStatus('idle');

    const lat = readCoordinate(business?.latitude);
    const lng = readCoordinate(business?.longitude);
    const coords = lat !== null && lng !== null ? [lat, lng] : null;
    if (coords && isValidLatLng(coords)) {
      setBusinessCoords(coords);
      setBusinessStatus('ready');
      return;
    }
    if (!geocodeQueries.length) {
      setBusinessStatus('error');
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    const fetchCoords = async () => {
      try {
        setBusinessStatus('loading');
        for (const rawQuery of geocodeQueries) {
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
          if (!cancelled) {
            setBusinessCoords(coordsCandidate);
            setBusinessStatus('ready');
          }
          return;
        }
        if (!cancelled) setBusinessStatus('error');
      } catch (err) {
        if (cancelled) return;
        setBusinessStatus('error');
      }
    };

    fetchCoords();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [businessKey, business?.latitude, business?.longitude, addressLabel]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    ensureLeafletIcons();
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    });
    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!businessCoords) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setUserStatus('unavailable');
      return;
    }
    setUserStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        if (!isValidLatLng(coords)) {
          setUserCoords(null);
          setUserStatus('error');
          return;
        }
        setUserCoords(coords);
        setUserStatus('ready');
      },
      (err) => {
        if (err?.code === 1) {
          setUserStatus('denied');
        } else {
          setUserStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [businessCoords]);

  useEffect(() => {
    if (!businessCoords || !userCoords) return;
    if (!isValidLatLng(businessCoords) || !isValidLatLng(userCoords)) return;
    setRouteInfo(null);
    setRouteStatus('loading');

    const controller = new AbortController();
    let cancelled = false;
    const fetchRoute = async () => {
      try {
        const [userLat, userLng] = userCoords;
        const [bizLat, bizLng] = businessCoords;
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${bizLng},${bizLat}?overview=full&geometries=geojson`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error('No se pudo calcular la ruta');
        const data = await response.json();
        const route = data?.routes?.[0];
        if (!route?.geometry) throw new Error('Ruta no disponible');
        if (!cancelled) {
          setRouteInfo({
            geometry: route.geometry,
            distance: route.distance,
            duration: route.duration,
          });
          setRouteStatus('ready');
        }
      } catch (err) {
        if (cancelled) return;
        setRouteStatus('error');
      }
    };

    fetchRoute();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [businessCoords, userCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !businessCoords || !isValidLatLng(businessCoords)) return;

    if (businessMarkerRef.current) businessMarkerRef.current.remove();
    if (userMarkerRef.current) userMarkerRef.current.remove();
    if (routeLayerRef.current) routeLayerRef.current.remove();

    const businessLatLng = L.latLng(businessCoords[0], businessCoords[1]);
    businessMarkerRef.current = L.marker(businessLatLng, { title: businessName }).addTo(map);

    if (userCoords) {
      const userLatLng = L.latLng(userCoords[0], userCoords[1]);
      userMarkerRef.current = L.circleMarker(userLatLng, {
        radius: 7,
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
      }).addTo(map);
    }

    if (routeInfo?.geometry) {
      routeLayerRef.current = L.geoJSON(routeInfo.geometry, {
        style: {
          color: '#ef4444',
          weight: 4,
          opacity: 0.9,
        },
      }).addTo(map);
    }

    if (routeLayerRef.current) {
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });
    } else if (userCoords && isValidLatLng(userCoords)) {
      const userLatLng = L.latLng(userCoords[0], userCoords[1]);
      map.fitBounds(L.latLngBounds([businessLatLng, userLatLng]), { padding: [40, 40] });
    } else {
      map.setView(businessLatLng, DEFAULT_ZOOM);
    }

    setTimeout(() => map.invalidateSize(), 150);
  }, [businessCoords, userCoords, routeInfo?.geometry, businessName]);

  const infoLabel = useMemo(() => {
    if (businessStatus === 'loading') return 'Buscando ubicacion del negocio...';
    if (businessStatus === 'error') return 'Ubicacion no disponible';
    if (userStatus === 'loading' || routeStatus === 'loading') return 'Calculando ruta...';
    if (routeStatus === 'ready' && routeInfo) {
      return `${formatDuration(routeInfo.duration)} · ${formatDistance(routeInfo.distance)}`;
    }
    if (userStatus === 'denied') return 'Activa tu ubicacion para ver la ruta.';
    if (userStatus === 'unavailable') return 'Ubicacion del dispositivo no disponible.';
    if (userStatus === 'error' || routeStatus === 'error') return 'No se pudo calcular la ruta.';
    return 'Ubicacion lista.';
  }, [businessStatus, userStatus, routeStatus, routeInfo]);

  const mapsUrl = buildGoogleMapsUrl({ businessCoords, userCoords });
  const mapsEmbedUrl = (() => {
    if (isValidLatLng(businessCoords)) {
      return `https://www.google.com/maps?q=${businessCoords[0]},${businessCoords[1]}&z=15&output=embed`;
    }
    if (addressLabel) {
      return `https://www.google.com/maps?q=${encodeURIComponent(addressLabel)}&z=15&output=embed`;
    }
    return '';
  })();
  const shouldShowFallback =
    Boolean(mapsEmbedUrl) &&
    (businessStatus === 'error' || (routeStatus === 'error' && userStatus === 'ready'));

  if (shouldShowFallback) {
    return (
      <div className="relative">
        <div className="overflow-hidden rounded-2xl border border-border bg-muted/10">
          <iframe
            title={`Mapa de ${businessName}`}
            src={mapsEmbedUrl}
            className={`${heightClass} w-full`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="absolute right-4 top-4 z-[400] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft backdrop-blur">
          Mapa alternativo
        </div>
        {mapsUrl && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-[400]">
            <a
              className="pointer-events-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90"
              href={mapsUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Ver en Google Maps
            </a>
          </div>
        )}
      </div>
    );
  }

  if (businessStatus === 'error' && !businessCoords) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        No hay ubicacion registrada para este negocio.
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        className={`${heightClass} w-full overflow-hidden rounded-2xl border border-border`}
        role="region"
        aria-label={`Mapa de ${businessName}`}
      />
      <div className="pointer-events-none absolute right-4 top-4 z-[400] max-w-[260px] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-soft backdrop-blur">
        <p className="uppercase tracking-wide text-slate-500">Tiempo y distancia</p>
        <p className="pointer-events-none mt-1 text-sm font-semibold text-slate-800">{infoLabel}</p>
      </div>
      {mapsUrl && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-[400]">
          <a
            className="pointer-events-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90"
            href={mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            Ver en Google Maps
          </a>
        </div>
      )}
    </div>
  );
};

export default BusinessMap;
