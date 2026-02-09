import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Bell,
  ChevronLeft,
  ChevronUp,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Mail,
  Megaphone,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import Header from './components/Header.jsx';
import AdPanel, { AdRail } from './components/AdPanel.jsx';
import MasonryGrid from './components/MasonryGrid.jsx';
import PinCard from './components/PinCard.jsx';
import PinDetailDialog from './components/PinDetailDialog.jsx';
import AuthDialog from './components/AuthDialog.jsx';
import ExploreDialog from './components/ExploreDialog.jsx';
import { Button } from './components/ui/Button.jsx';
import { Input } from './components/ui/Input.jsx';
import { Label } from './components/ui/Label.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './components/ui/Dialog.jsx';
import { Avatar, AvatarFallback } from './components/ui/Avatar.jsx';
import { cn } from './lib/cn.js';
import pin1 from './assets/pin1.jpg';
import pin2 from './assets/pin2.jpg';
import pin3 from './assets/pin3.jpg';
import pin4 from './assets/pin4.jpg';
import pin5 from './assets/pin5.jpg';
import pin6 from './assets/pin6.jpg';
import pin7 from './assets/pin7.jpg';
import pin8 from './assets/pin8.jpg';
import matchCoffeeLogo from './assets/logo_matchcoffee_real.png';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const placeholderImages = [pin1, pin2, pin3, pin4, pin5, pin6, pin7, pin8];
const SESSION_LIKES_STORAGE_KEY = 'publicationLikesSession';
const MAX_BUSINESS_LOGO_BYTES = 1024 * 1024;
const FEED_CACHE_STORAGE_KEY = 'gastrohub-feed-cache-v1';
const ADS_CACHE_STORAGE_KEY = 'gastrohub-ads-cache-v1';
const CACHE_MAX_ENTRIES = 6;
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;
const FEED_MEDIA_PREFETCH_LIMIT = 36;
const ADS_MEDIA_PREFETCH_LIMIT = 14;
const MEDIA_PREFETCH_TIMEOUT_MS = 3500;
const PUBLICATION_IMAGE_MAX_DIMENSION = 1600;
const PUBLICATION_IMAGE_QUALITY = 0.82;
const numberFormatter = new Intl.NumberFormat('es-CL');
const formatNumber = (value) => numberFormatter.format(value);
const RESERVATION_PRICE = 5000;
const CLIENT_COMMENTS_STORAGE_KEY = 'gastrohub-client-comments-v1';
const CLIENT_SAVED_PUBLICATIONS_STORAGE_KEY = 'gastrohub-client-saved-publications-v1';
const FEED_PAGE_INITIAL = 20;
const FEED_PAGE_STEP = 5;
const PUBLICATION_EXTRAS_LIMIT = 4;
const TABLE_STATUS_OPTIONS = [
  {
    value: 'DISPONIBLE',
    label: 'Disponible',
    badgeClass: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  },
  {
    value: 'OCUPADA',
    label: 'Ocupada',
    badgeClass: 'border-rose-200 bg-rose-100 text-rose-700',
  },
  {
    value: 'MANTENIMIENTO',
    label: 'Mantenimiento',
    badgeClass: 'border-amber-200 bg-amber-100 text-amber-700',
  },
];
const RESERVATION_SCHEDULE_OPTIONS = [
  { value: 'DESAYUNO', label: 'Desayuno' },
  { value: 'ALMUERZO', label: 'Almuerzo' },
  { value: 'ONCE', label: 'Once' },
  { value: 'CENA', label: 'Cena' },
];
const RESERVATION_TIME_STEP_MINUTES = 30;
const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];
const DEFAULT_OPERATING_DAYS = WEEKDAY_OPTIONS.map((day) => day.value);

const getTableStatusMeta = (status) =>
  TABLE_STATUS_OPTIONS.find((option) => option.value === status) || TABLE_STATUS_OPTIONS[0];

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const formatMinutesToTime = (minutes) => {
  if (!Number.isFinite(minutes)) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateValue = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (!ISO_DATE_PATTERN.test(raw)) return '';
  const [yearRaw, monthRaw, dayRaw] = raw.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return '';
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const parseDateToKey = (value) => {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  const [yearRaw, monthRaw, dayRaw] = normalized.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return year * 10000 + month * 100 + day;
};

const getWeekdayFromDate = (value) => {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  const [yearRaw, monthRaw, dayRaw] = normalized.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

const normalizeOperatingDaysList = (value) => {
  if (value === null || value === undefined) return null;
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [value];
  const normalized = values
    .map((item) => Number(item))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  return Array.from(new Set(normalized));
};

const isDateWithinRange = (dateKey, start, end) => {
  const startKey = parseDateToKey(start);
  const endKey = parseDateToKey(end);
  if (startKey === null && endKey === null) return true;
  if (startKey !== null && dateKey < startKey) return false;
  if (endKey !== null && dateKey > endKey) return false;
  return true;
};

const getBusinessClosureInfo = (business, date) => {
  if (!business || !date) return null;
  const normalizedDate = normalizeDateValue(date);
  if (!normalizedDate) return null;
  const dateKey = parseDateToKey(normalizedDate);
  if (dateKey === null) return null;
  const weekday = getWeekdayFromDate(normalizedDate);
  if (weekday === null) return null;

  if (business.temporaryClosureActive) {
    const start = business.temporaryClosureStart || null;
    const end = business.temporaryClosureEnd || null;
    if (isDateWithinRange(dateKey, start, end)) {
      return {
        reason: 'temporal',
        message: business.temporaryClosureMessage
          ? `Cierre temporal: ${business.temporaryClosureMessage}`
          : 'El local está cerrado temporalmente para esta fecha.',
      };
    }
  }

  const operatingDays = normalizeOperatingDaysList(business.operatingDays);
  if (Array.isArray(operatingDays)) {
    if (!operatingDays.length) {
      return { reason: 'dias', message: 'Este local no tiene días de atención habilitados.' };
    }
    if (!operatingDays.includes(weekday)) {
      return { reason: 'dias', message: 'El local no atiende el día seleccionado.' };
    }
  }

  if (Array.isArray(business.holidayDates) && business.holidayDates.includes(normalizedDate)) {
    return { reason: 'feriado', message: 'El local marcó este día como feriado propio.' };
  }

  if (Array.isArray(business.vacationRanges) && business.vacationRanges.length) {
    const matchingVacation = business.vacationRanges.find((range) => {
      const startKey = parseDateToKey(range?.start);
      const endKey = parseDateToKey(range?.end);
      if (startKey === null || endKey === null) return false;
      return dateKey >= startKey && dateKey <= endKey;
    });
    if (matchingVacation) {
      return {
        reason: 'vacaciones',
        message: matchingVacation?.label
          ? `El local está de vacaciones: ${matchingVacation.label}.`
          : 'El local está de vacaciones en la fecha seleccionada.',
      };
    }
  }

  return null;
};

const getBusinessTimeRanges = (business) => {
  const ranges = [];
  const morningStart = parseTimeToMinutes(business?.morningStart);
  const morningEnd = parseTimeToMinutes(business?.morningEnd);
  const afternoonStart = parseTimeToMinutes(business?.afternoonStart);
  const afternoonEnd = parseTimeToMinutes(business?.afternoonEnd);

  if (morningStart !== null && morningEnd !== null && morningStart <= morningEnd) {
    ranges.push({ start: morningStart, end: morningEnd });
  }
  if (afternoonStart !== null && afternoonEnd !== null && afternoonStart <= afternoonEnd) {
    ranges.push({ start: afternoonStart, end: afternoonEnd });
  }
  return ranges;
};

const isTimeAllowedForBusiness = (business, value) => {
  const ranges = getBusinessTimeRanges(business);
  if (!ranges.length) return true;
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return false;
  return ranges.some((range) => minutes >= range.start && minutes <= range.end);
};

const buildReservationTimeOptions = (business) => {
  const ranges = getBusinessTimeRanges(business);
  if (!ranges.length) return [];
  const slots = [];
  ranges.forEach((range) => {
    for (let value = range.start; value <= range.end; value += RESERVATION_TIME_STEP_MINUTES) {
      slots.push(formatMinutesToTime(value));
    }
  });
  return Array.from(new Set(slots)).filter(Boolean);
};

const getImageFormatFromDataUrl = (dataUrl) => {
  const match = /^data:image\/(png|jpeg|jpg);/i.exec(dataUrl || '');
  if (!match) return 'PNG';
  const ext = match[1].toLowerCase();
  if (ext === 'jpg') return 'JPEG';
  return ext.toUpperCase();
};

const loadImageAsDataUrl = async (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
};

const buildReservationQrPayload = (reservation) => {
  if (!reservation?.code) return '';
  return `MCF|${reservation.code}`;
};

const extractReservationCode = (payload = '') => {
  const raw = String(payload || '').trim();
  if (!raw) return '';
  if (raw.startsWith('MCF|')) return raw.slice(4);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.code) return String(parsed.code);
  } catch {
    // ignore
  }
  const codeMatch = raw.match(/code=([^&]+)/i);
  if (codeMatch) return decodeURIComponent(codeMatch[1]);
  return raw;
};

const buildReservationScanFeedback = (result) => {
  if (!result?.reservation) return null;
  const isValid = Boolean(result.valid);
  let description = '';
  if (isValid) {
    description = 'La reserva es válida.';
  } else if (result.reservation.status === 'COMPLETADA') {
    description = 'Esta reserva ya se usó previamente y ya no es válida.';
  } else if (result.reservation.status === 'CANCELADA') {
    description = 'Esta reserva fue cancelada y ya no es válida.';
  } else {
    description = 'La reserva no es válida.';
  }
  return {
    isValid,
    title: isValid ? 'Reserva válida' : 'Reserva inválida',
    description,
  };
};

const resolveScheduleForTime = (timeValue) => {
  const minutes = parseTimeToMinutes(timeValue);
  if (minutes === null) return RESERVATION_SCHEDULE_OPTIONS[1]?.value || 'ALMUERZO';
  if (minutes < 11 * 60) return 'DESAYUNO';
  if (minutes < 16 * 60) return 'ALMUERZO';
  if (minutes < 20 * 60) return 'ONCE';
  return 'CENA';
};

const fetchJson = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Error de servidor');
  }
  return data;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

const loadImageFromDataUrl = (dataUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = dataUrl;
  });

const compressImageFile = async (
  file,
  { maxDimension = PUBLICATION_IMAGE_MAX_DIMENSION, quality = PUBLICATION_IMAGE_QUALITY, mimeType = 'image/jpeg' } = {}
) => {
  const dataUrl = await readFileAsDataUrl(file);
  if (!dataUrl) return '';
  const img = await loadImageFromDataUrl(dataUrl);
  const ratio = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(mimeType, quality);
};

const getLocalStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readStorageJson = (storageKey, fallback) => {
  const storage = getLocalStorage();
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStorageJson = (storageKey, value) => {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // ignore storage failures
  }
};

const readCacheBucket = (storageKey) => {
  const storage = getLocalStorage();
  if (!storage) return { entries: {}, order: [] };
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return { entries: {}, order: [] };
    const parsed = JSON.parse(raw);
    const entries = parsed && typeof parsed === 'object' ? parsed.entries || {} : {};
    const order = Array.isArray(parsed?.order) ? parsed.order : [];
    return { entries, order };
  } catch {
    return { entries: {}, order: [] };
  }
};

const writeCacheBucket = (storageKey, bucket) => {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey, JSON.stringify(bucket));
  } catch {
    // ignore storage failures
  }
};

const readCacheEntry = (storageKey, cacheKey, maxAgeMs = CACHE_MAX_AGE_MS) => {
  const bucket = readCacheBucket(storageKey);
  const entry = bucket.entries?.[cacheKey];
  if (!entry || !entry.data) return null;
  if (maxAgeMs && entry.savedAt && Date.now() - entry.savedAt > maxAgeMs) return null;
  return entry;
};

const writeCacheEntry = (storageKey, cacheKey, data, maxEntries = CACHE_MAX_ENTRIES) => {
  const bucket = readCacheBucket(storageKey);
  const entries = { ...(bucket.entries || {}) };
  entries[cacheKey] = { data, savedAt: Date.now() };
  const order = [cacheKey, ...(bucket.order || []).filter((key) => key !== cacheKey)];
  const trimmedOrder = maxEntries ? order.slice(0, maxEntries) : order;
  const prunedEntries = {};
  trimmedOrder.forEach((key) => {
    if (entries[key]) prunedEntries[key] = entries[key];
  });
  writeCacheBucket(storageKey, { entries: prunedEntries, order: trimmedOrder });
};

const shouldPrefetchMedia = () => {
  if (typeof navigator === 'undefined') return false;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  return true;
};

const prefetchImages = async (urls, { limit = FEED_MEDIA_PREFETCH_LIMIT, timeoutMs = MEDIA_PREFETCH_TIMEOUT_MS } = {}) => {
  if (typeof window === 'undefined') return;
  if (!shouldPrefetchMedia()) return;
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const targets = unique.slice(0, limit);
  await Promise.allSettled(
    targets.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          let settled = false;
          const cleanup = () => {
            if (settled) return;
            settled = true;
            img.onload = null;
            img.onerror = null;
            clearTimeout(timer);
            resolve(true);
          };
          const timer = setTimeout(cleanup, timeoutMs);
          img.onload = cleanup;
          img.onerror = cleanup;
          img.src = url;
        })
    )
  );
};

const prefetchMediaAssets = async (items = [], options = {}) => {
  const urls = (items || [])
    .map((item) => item?.coverUrl || item?.placeholder || '')
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value && !value.startsWith('data:') && !value.startsWith('blob:'));
  const imageUrls = urls.filter((url) => detectMediaTypeFromUrl(url) !== 'VIDEO');
  if (!imageUrls.length) return;
  await prefetchImages(imageUrls, options);
};

const publicationTypes = [
  { value: 'AVISO_GENERAL', label: 'Aviso general' },
  { value: 'PROMOCION', label: 'Promoción' },
  { value: 'EVENTO', label: 'Evento' },
];

const cafeCategoryTypes = [
  'ESPRESSO',
  'AMERICANO',
  'CAPPUCCINO',
  'LATTE',
  'MOCHA',
  'FLAT_WHITE',
  'MACCHIATO',
  'COLD_BREW',
  'AFFOGATO',
];

const foodCategoryTypes = [
  'PIZZA',
  'SUSHI',
  'HAMBURGUESAS',
  'PASTAS',
  'COMIDA_MEXICANA',
  'COMIDA_CHINA',
  'COMIDA_INDIAN',
  'POSTRES',
  'SANDWICHES',
  'ENSALADAS',
];

const barCategoryTypes = [
  'CERVEZAS',
  'VINOS',
  'COCTELES',
  'DESTILADOS',
  'BEBIDAS_SIN_ALCOHOL',
  'TAPAS',
  'PICOTEO',
];

const foodtruckCategoryTypes = [
  'HOT_DOGS',
  'TACOS',
  'BURRITOS',
  'AREPAS',
  'EMPANADAS',
  'PAPAS_FRITAS',
  'WRAPS',
  'BROCHETAS',
  'HELADOS',
];

const categoriesByBusinessType = {
  CAFETERIA: cafeCategoryTypes,
  RESTAURANTE: foodCategoryTypes,
  BAR: barCategoryTypes,
  FOODTRUCK: foodtruckCategoryTypes,
};

const defaultBusinessTypes = ['RESTAURANTE', 'CAFETERIA', 'FOODTRUCK', 'BAR'];
const oferenteAdPlans = [
  {
    id: 'inicio',
    name: 'Plan Inicio',
    description: 'Presencia básica para comenzar a destacar.',
    price: 4990,
    presence: 35,
    presenceLabel: 'Baja',
    benefits: [
      'Aparición básica en espacios publicitarios.',
      '1 publicación destacada en rotación.',
      'Impulso inicial dentro del feed.',
    ],
    badge: '',
    accentClass: 'border-border bg-card',
    barClass: 'bg-slate-400',
    buttonVariant: 'outline',
  },
  {
    id: 'impulso',
    name: 'Plan Impulso',
    description: 'Mayor frecuencia y alcance sostenido.',
    price: 8990,
    presence: 65,
    presenceLabel: 'Media',
    benefits: [
      'Más apariciones en carruseles y banners.',
      'Prioridad media en resultados y listados.',
      '2 publicaciones destacadas en rotación.',
    ],
    badge: 'Más popular',
    accentClass: 'border-primary/40 bg-primary/5',
    barClass: 'bg-amber-500',
    buttonVariant: 'default',
  },
  {
    id: 'dominio',
    name: 'Plan Dominio',
    description: 'Máxima presencia para ser el primero.',
    price: 14990,
    presence: 100,
    presenceLabel: 'Alta',
    benefits: [
      'Aparición frecuente en espacios premium.',
      'Prioridad alta en portada y resultados.',
      '3 publicaciones destacadas en rotación.',
    ],
    badge: 'Máxima presencia',
    accentClass: 'border-emerald-500/40 bg-emerald-500/5',
    barClass: 'bg-emerald-500',
    buttonVariant: 'secondary',
  },
];
const defaultCategoryTypes = defaultBusinessTypes.flatMap((type) => categoriesByBusinessType[type] || []);
const defaultFilters = {
  search: '',
  categoryId: '',
  businessId: '',
  businessType: '',
  region: '',
  city: '',
  amenities: [],
  sortBy: '',
  sortDir: 'desc',
};
const chileRegions = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];
const chileCitiesByRegion = {
  'Arica y Parinacota': ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  Tarapacá: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  Antofagasta: [
    'Antofagasta',
    'Mejillones',
    'Sierra Gorda',
    'Taltal',
    'Calama',
    'Ollagüe',
    'San Pedro de Atacama',
    'Tocopilla',
    'María Elena',
  ],
  Atacama: [
    'Copiapó',
    'Caldera',
    'Tierra Amarilla',
    'Chañaral',
    'Diego de Almagro',
    'Vallenar',
    'Freirina',
    'Huasco',
    'Alto del Carmen',
  ],
  Coquimbo: [
    'La Serena',
    'Coquimbo',
    'Andacollo',
    'La Higuera',
    'Paihuano',
    'Vicuña',
    'Ovalle',
    'Combarbalá',
    'Monte Patria',
    'Punitaqui',
    'Río Hurtado',
    'Illapel',
    'Canela',
    'Los Vilos',
    'Salamanca',
  ],
  Valparaíso: [
    'Valparaíso',
    'Casablanca',
    'Concón',
    'Juan Fernández',
    'Puchuncaví',
    'Quintero',
    'Viña del Mar',
    'Isla de Pascua',
    'Quilpué',
    'Villa Alemana',
    'Limache',
    'Olmué',
    'Quillota',
    'La Calera',
    'Hijuelas',
    'La Cruz',
    'Nogales',
    'San Antonio',
    'Algarrobo',
    'Cartagena',
    'El Quisco',
    'El Tabo',
    'Santo Domingo',
    'La Ligua',
    'Cabildo',
    'Papudo',
    'Petorca',
    'Zapallar',
    'Los Andes',
    'Calle Larga',
    'Rinconada',
    'San Esteban',
    'San Felipe',
    'Catemu',
    'Llay-Llay',
    'Panquehue',
    'Putaendo',
    'Santa María',
  ],
  'Metropolitana de Santiago': [
    'Cerrillos',
    'Cerro Navia',
    'Conchalí',
    'El Bosque',
    'Estación Central',
    'Huechuraba',
    'Independencia',
    'La Cisterna',
    'La Florida',
    'La Granja',
    'La Pintana',
    'La Reina',
    'Las Condes',
    'Lo Barnechea',
    'Lo Espejo',
    'Lo Prado',
    'Macul',
    'Maipú',
    'Ñuñoa',
    'Pedro Aguirre Cerda',
    'Peñalolén',
    'Providencia',
    'Pudahuel',
    'Quilicura',
    'Quinta Normal',
    'Recoleta',
    'Renca',
    'San Joaquín',
    'San Miguel',
    'San Ramón',
    'Santiago',
    'Vitacura',
    'Puente Alto',
    'Pirque',
    'San José de Maipo',
    'Colina',
    'Lampa',
    'Tiltil',
    'San Bernardo',
    'Buin',
    'Calera de Tango',
    'Paine',
    'Melipilla',
    'Alhué',
    'Curacaví',
    'María Pinto',
    'San Pedro',
    'Talagante',
    'El Monte',
    'Isla de Maipo',
    'Padre Hurtado',
    'Peñaflor',
  ],
  "Libertador General Bernardo O'Higgins": [
    'Rancagua',
    'Codegua',
    'Coinco',
    'Coltauco',
    'Doñihue',
    'Graneros',
    'Las Cabras',
    'Machalí',
    'Malloa',
    'Mostazal',
    'Olivar',
    'Peumo',
    'Pichidegua',
    'Quinta de Tilcoco',
    'Rengo',
    'Requínoa',
    'San Vicente',
    'San Fernando',
    'Chimbarongo',
    'Chépica',
    'Lolol',
    'Nancagua',
    'Palmilla',
    'Peralillo',
    'Placilla',
    'Pumanque',
    'Santa Cruz',
    'Pichilemu',
    'La Estrella',
    'Litueche',
    'Marchigüe',
    'Navidad',
    'Paredones',
  ],
  Maule: [
    'Talca',
    'Constitución',
    'Curepto',
    'Empedrado',
    'Maule',
    'Pelarco',
    'Pencahue',
    'Río Claro',
    'San Clemente',
    'San Rafael',
    'Linares',
    'Colbún',
    'Longaví',
    'Parral',
    'Retiro',
    'San Javier',
    'Villa Alegre',
    'Yerbas Buenas',
    'Curicó',
    'Hualañé',
    'Licantén',
    'Molina',
    'Rauco',
    'Romeral',
    'Sagrada Familia',
    'Teno',
    'Vichuquén',
    'Cauquenes',
    'Chanco',
    'Pelluhue',
  ],
  Ñuble: [
    'Chillán',
    'Chillán Viejo',
    'Bulnes',
    'El Carmen',
    'Pemuco',
    'Pinto',
    'Quillón',
    'San Ignacio',
    'Yungay',
    'Coelemu',
    'Cobquecura',
    'Ninhue',
    'Portezuelo',
    'Quirihue',
    'Ránquil',
    'Treguaco',
    'San Carlos',
    'Coihueco',
    'Ñiquén',
    'San Fabián',
    'San Nicolás',
  ],
  Biobío: [
    'Concepción',
    'Coronel',
    'Chiguayante',
    'Florida',
    'Hualqui',
    'Lota',
    'Penco',
    'San Pedro de la Paz',
    'Santa Juana',
    'Talcahuano',
    'Tomé',
    'Hualpén',
    'Arauco',
    'Cañete',
    'Contulmo',
    'Curanilahue',
    'Lebu',
    'Los Álamos',
    'Tirúa',
    'Los Ángeles',
    'Antuco',
    'Cabrero',
    'Laja',
    'Mulchén',
    'Nacimiento',
    'Negrete',
    'Quilaco',
    'Quilleco',
    'San Rosendo',
    'Santa Bárbara',
    'Tucapel',
    'Yumbel',
    'Alto Biobío',
  ],
  'La Araucanía': [
    'Temuco',
    'Carahue',
    'Cunco',
    'Curarrehue',
    'Freire',
    'Galvarino',
    'Gorbea',
    'Lautaro',
    'Loncoche',
    'Melipeuco',
    'Nueva Imperial',
    'Padre Las Casas',
    'Perquenco',
    'Pitrufquén',
    'Pucón',
    'Saavedra',
    'Teodoro Schmidt',
    'Toltén',
    'Vilcún',
    'Villarrica',
    'Cholchol',
    'Angol',
    'Collipulli',
    'Curacautín',
    'Ercilla',
    'Lonquimay',
    'Los Sauces',
    'Lumaco',
    'Purén',
    'Renaico',
    'Traiguén',
    'Victoria',
  ],
  'Los Ríos': [
    'Valdivia',
    'Corral',
    'Lanco',
    'Los Lagos',
    'Máfil',
    'Mariquina',
    'Paillaco',
    'Panguipulli',
    'La Unión',
    'Futrono',
    'Lago Ranco',
    'Río Bueno',
  ],
  'Los Lagos': [
    'Puerto Montt',
    'Calbuco',
    'Cochamó',
    'Fresia',
    'Frutillar',
    'Los Muermos',
    'Llanquihue',
    'Maullín',
    'Puerto Varas',
    'Osorno',
    'Puerto Octay',
    'Purranque',
    'Puyehue',
    'Río Negro',
    'San Juan de la Costa',
    'San Pablo',
    'Ancud',
    'Castro',
    'Chonchi',
    'Curaco de Vélez',
    'Dalcahue',
    'Puqueldón',
    'Queilén',
    'Quemchi',
    'Quellón',
    'Quinchao',
    'Chaitén',
    'Futaleufú',
    'Hualaihué',
    'Palena',
  ],
  'Aysén del General Carlos Ibáñez del Campo': [
    'Coyhaique',
    'Lago Verde',
    'Aysén',
    'Cisnes',
    'Guaitecas',
    'Chile Chico',
    'Río Ibáñez',
    'Cochrane',
    "O'Higgins",
    'Tortel',
  ],
  'Magallanes y de la Antártica Chilena': [
    'Punta Arenas',
    'Laguna Blanca',
    'Río Verde',
    'San Gregorio',
    'Cabo de Hornos',
    'Antártica',
    'Porvenir',
    'Primavera',
    'Timaukel',
    'Natales',
    'Torres del Paine',
  ],
};
const businessAmenityOptions = [
  { value: 'PET_FRIENDLY', label: 'Pet friendly' },
  { value: 'TERRAZA', label: 'Terraza' },
  { value: 'AREA_FUMADORES', label: 'Área para fumadores' },
  { value: 'SALA_REUNIONES', label: 'Sala de reuniones' },
  { value: 'CYBER', label: 'Cyber' },
  { value: 'ENCHUFES', label: 'Enchufes para cargar dispositivos' },
];

const sanitizeSessionLikes = (raw) => {
  if (!raw || typeof raw !== 'object') return {};
  return Object.entries(raw).reduce((acc, [key, value]) => {
    if (value) {
      acc[key] = true;
    }
    return acc;
  }, {});
};

const readSessionLikes = () => {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    const stored = JSON.parse(sessionStorage.getItem(SESSION_LIKES_STORAGE_KEY) || '{}');
    return sanitizeSessionLikes(stored);
  } catch {
    return {};
  }
};

const normalizeCategory = (cat, fallbackList = []) => {
  if (!cat) return null;
  if (typeof cat === 'string') {
    const found = fallbackList.find((c) => String(c.id) === String(cat));
    if (found) return normalizeCategory(found, fallbackList);
    return { id: String(cat), name: String(cat), type: String(cat) };
  }
  const id = cat.id ?? cat.slug ?? cat.type ?? cat.name;
  const type = cat.type || cat.name || (cat.id ? String(cat.id) : '');
  const name = cat.name || type || (id ? String(id) : '');
  return { ...cat, id: id ? String(id) : name, name, type: type || name };
};

const formatCategoryLabel = (cat) => {
  if (!cat) return '';
  const type = cat.type || '';
  const name = cat.name || type || cat.id || '';
  return type && name && type !== name ? `${type} · ${name}` : name || type;
};

const humanizeCategoryType = (type = '') =>
  type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeSearchValue = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizeLocationValue = (value = '') => String(value || '').trim().toLowerCase();
const normalizeAmenityValue = (value = '') => String(value || '').trim().toUpperCase();

const getCitiesForRegion = (region = '') => (region ? chileCitiesByRegion[region] || [] : []);

const buildCityOptions = (region, currentCity) => {
  const cities = getCitiesForRegion(region);
  if (currentCity && !cities.includes(currentCity)) {
    return [currentCity, ...cities];
  }
  return cities;
};

const detectMediaTypeFromUrl = (value = '') => {
  if (!value) return 'IMAGEN';
  const lower = value.toLowerCase();
  if (lower.startsWith('data:video')) return 'VIDEO';
  if (/\.(mp4|webm|ogg)(\?.*)?$/.test(lower)) return 'VIDEO';
  if (lower.includes('/video')) return 'VIDEO';
  return 'IMAGEN';
};

const normalizeRutInput = (value = '') => String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();

const formatRut = (value = '') => {
  const clean = normalizeRutInput(value);
  if (clean.length < 2) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
};

const isValidRut = (value = '') => {
  const clean = normalizeRutInput(value);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? '0' : mod === 10 ? 'K' : String(mod);
  return expected === dv;
};

const sanitizePdfText = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();

const escapePdfText = (value = '') =>
  sanitizePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdfBlobFromLines = (lines = []) => {
  const safeLines = lines.map((line) => escapePdfText(line));
  const content = [
    'BT',
    '/F1 12 Tf',
    '14 TL',
    '50 780 Td',
    safeLines.map((line, index) => (index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`)).join('\n'),
    'ET',
  ]
    .filter(Boolean)
    .join('\n');
  const encoder = new TextEncoder();
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  const parts = [];
  let offset = 0;
  const offsets = [0];
  const pushPart = (value) => {
    parts.push(value);
    offset += encoder.encode(value).length;
  };

  pushPart('%PDF-1.3\n');
  objects.forEach((obj) => {
    offsets.push(offset);
    pushPart(`${obj}\n`);
  });

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  pushPart(xref);

  return new Blob(parts, { type: 'application/pdf' });
};

const buildReservationPdfBlob = async (reservation) => {
  if (!reservation) return null;
  const [{ jsPDF }, qrModule] = await Promise.all([import('jspdf'), import('qrcode')]);
  const QRCode = qrModule?.default || qrModule;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(248, 243, 236);
  doc.rect(0, 0, pageWidth, 130, 'F');
  doc.setDrawColor(232, 226, 218);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(32, 110, pageWidth - 64, pageHeight - 170, 12, 12, 'FD');

  const matchLogo = await loadImageAsDataUrl(matchCoffeeLogo);
  if (matchLogo) {
    doc.addImage(matchLogo, getImageFormatFromDataUrl(matchLogo), 40, 26, 84, 84);
  }

  const businessLogo = await loadImageAsDataUrl(reservation.businessLogo || reservation.businessImage || '');
  if (businessLogo) {
    doc.addImage(businessLogo, getImageFormatFromDataUrl(businessLogo), pageWidth - 124, 30, 72, 72);
  }

  doc.setTextColor(38, 38, 38);
  doc.setFontSize(20);
  doc.text('Comprobante de reserva', 150, 60);
  doc.setFontSize(11);
  doc.setTextColor(95, 95, 95);
  doc.text('Match Coffee', 150, 78);
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(`Código: ${reservation.code || '--'}`, 150, 102);

  const detailsStartY = 165;
  let y = detailsStartY;
  const labelX = 60;
  const valueX = 170;
  const labelColor = [120, 120, 120];
  const valueColor = [30, 30, 30];
  const valueWidth = pageWidth - valueX - 210;

  const addLine = (label, value) => {
    const safeValue = value ? String(value) : '-';
    doc.setFontSize(11);
    doc.setTextColor(...labelColor);
    doc.text(label, labelX, y);
    doc.setTextColor(...valueColor);
    const lines = doc.splitTextToSize(safeValue, valueWidth);
    doc.text(lines, valueX, y);
    y += 16 * Math.max(lines.length, 1);
  };

  addLine('Local', reservation.businessName || '');
  addLine('Tipo', reservation.businessType || '');
  addLine('Fecha', reservation.date || '');
  addLine('Hora', reservation.time || '');
  addLine(
    'Mesas',
    Array.isArray(reservation.tables) ? reservation.tables.map((t) => t.label).join(', ') : ''
  );
  addLine('Sillas', reservation.totalSeats ? String(reservation.totalSeats) : '');
  addLine('Titular', reservation.holderName || reservation.guestName || '');
  if (reservation.guestRut) {
    addLine('RUT', reservation.guestRut);
  }
  addLine('Monto', `$${formatNumber(reservation.totalPrice ?? RESERVATION_PRICE)}`);
  if (reservation.notes) {
    addLine('Notas', reservation.notes);
  }

  const qrPayload = buildReservationQrPayload(reservation);
  if (qrPayload && QRCode?.toDataURL) {
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 160 });
    const qrX = pageWidth - 200;
    const qrY = detailsStartY - 5;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, 150, 150);
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text('Escanea para verificar', qrX, qrY + 170);
  }

  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text('Presenta este comprobante al llegar al negocio.', 60, pageHeight - 60);

  return doc.output('blob');
};

const downloadReservationPdf = async (reservation) => {
  if (typeof document === 'undefined') return;
  try {
    const blob = await buildReservationPdfBlob(reservation);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reserva-${reservation?.code || 'match-coffee'}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    // silent
  }
};

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDialogTab, setCreateDialogTab] = useState('publicacion');
  const [contactOpen, setContactOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const publicFeedRef = useRef(null);
  const feedCacheKeyRef = useRef('');
  const adsCacheKeyRef = useRef('');
  const reservationScanVideoRef = useRef(null);
  const reservationScannerRef = useRef(null);

  const [authLoading, setAuthLoading] = useState(false);

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [alerts, setAlerts] = useState([]);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [reservationStep, setReservationStep] = useState('mode');
  const [reservationMode, setReservationMode] = useState('');
  const [reservationGuest, setReservationGuest] = useState({ nombre: '', apellido: '', rut: '' });
  const [reservationType, setReservationType] = useState(defaultBusinessTypes[0]);
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationBusinessId, setReservationBusinessId] = useState('');
  const [reservationTableSelection, setReservationTableSelection] = useState([]);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [reservationNotes, setReservationNotes] = useState('');
  const [reservationPayment, setReservationPayment] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: '',
  });
  const [reservationSuccess, setReservationSuccess] = useState(null);
  const [reservationPendingAuth, setReservationPendingAuth] = useState(false);
  const [reservationTablesByBusiness, setReservationTablesByBusiness] = useState({});
  const [reservationTablesLoading, setReservationTablesLoading] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [clientCommentsByUser, setClientCommentsByUser] = useState(() =>
    readStorageJson(CLIENT_COMMENTS_STORAGE_KEY, {})
  );
  const [savedPublicationsByUser, setSavedPublicationsByUser] = useState(() =>
    readStorageJson(CLIENT_SAVED_PUBLICATIONS_STORAGE_KEY, {})
  );
  const [clientPortalOpen, setClientPortalOpen] = useState(false);
  const [clientPortalTab, setClientPortalTab] = useState('reservas');
  const [clientCommentsRefreshing, setClientCommentsRefreshing] = useState(false);

  const [tenants, setTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(() => localStorage.getItem('tenantId') || '');
  const [tenantInfo, setTenantInfo] = useState(null);

  const [categoryTypes, setCategoryTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [businesses, setBusinesses] = useState([]);

  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [adPublications, setAdPublications] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adPanelOpen, setAdPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 1200px)').matches;
  });
  const [adPanelUserClosed, setAdPanelUserClosed] = useState(false);
  const [isAdPanelNarrow, setIsAdPanelNarrow] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 1200px)').matches;
  });
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [topHeartsMode, setTopHeartsMode] = useState(false);
  const [likedById, setLikedById] = useState(() => readSessionLikes());

  const [selectedPublication, setSelectedPublication] = useState(null);
  const [commentsByPublication, setCommentsByPublication] = useState({});
  const [commentsLoadingByPublication, setCommentsLoadingByPublication] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [similarItems, setSimilarItems] = useState([]);
  const [similarSource, setSimilarSource] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasNewSimilar, setHasNewSimilar] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(null);
  const [businessProfilePublications, setBusinessProfilePublications] = useState([]);
  const [loadingBusinessProfile, setLoadingBusinessProfile] = useState(false);

  const [tenantForm, setTenantForm] = useState({ nombre: '', dominio: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: '', tenantId: '' });
  const [businessForm, setBusinessForm] = useState({
    name: '',
    type: 'RESTAURANTE',
    description: '',
    address: '',
    city: '',
    region: '',
    amenities: [],
    phone: '',
  });
  const [publicationForm, setPublicationForm] = useState({
    titulo: '',
    contenido: '',
    tipo: 'AVISO_GENERAL',
    fechaFinVigencia: '',
    categoryIds: [],
    categoryTypes: [],
    businessId: '',
    mediaUrl: '',
    mediaType: 'IMAGEN',
    precio: '',
    extras: [],
  });

  const [adminQueues, setAdminQueues] = useState({ publications: [] });
  const [adminAdPublications, setAdminAdPublications] = useState([]);
  const [loadingAdminAds, setLoadingAdminAds] = useState(false);
  const [savingAdminAds, setSavingAdminAds] = useState(() => new Set());
  const [adminAdsTenantId, setAdminAdsTenantId] = useState(() => localStorage.getItem('tenantId') || '');
  const [myPublications, setMyPublications] = useState([]);
  const [loadingMyPublications, setLoadingMyPublications] = useState(false);
  const [editingPublicationId, setEditingPublicationId] = useState(null);
  const [adminPanelTab, setAdminPanelTab] = useState('perfil');
  const [feedVisibleCount, setFeedVisibleCount] = useState(FEED_PAGE_INITIAL);
  const [profileBusinessId, setProfileBusinessId] = useState('');
  const [businessProfileForm, setBusinessProfileForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    region: '',
    amenities: [],
    imageUrl: '',
    phone: '',
  });
  const [reservationAdminBusinessId, setReservationAdminBusinessId] = useState('');
  const [reservationTableDraft, setReservationTableDraft] = useState({
    label: '',
    seats: 4,
    status: 'DISPONIBLE',
  });
  const [reservationAdminReservations, setReservationAdminReservations] = useState([]);
  const [reservationAdminReservationsLoading, setReservationAdminReservationsLoading] = useState(false);
  const [reservationAdminDetail, setReservationAdminDetail] = useState(null);
  const [reservationAdminDetailOpen, setReservationAdminDetailOpen] = useState(false);
  const [reservationHoursDraft, setReservationHoursDraft] = useState({
    morningStart: '',
    morningEnd: '',
    afternoonStart: '',
    afternoonEnd: '',
  });
  const [reservationHoursSaving, setReservationHoursSaving] = useState(false);
  const [reservationAvailabilityDraft, setReservationAvailabilityDraft] = useState({
    operatingDays: DEFAULT_OPERATING_DAYS,
    holidayDates: [],
    vacationRanges: [],
    temporaryClosureActive: false,
    temporaryClosureStart: '',
    temporaryClosureEnd: '',
    temporaryClosureMessage: '',
  });
  const [reservationHolidayDraft, setReservationHolidayDraft] = useState('');
  const [reservationVacationDraft, setReservationVacationDraft] = useState({ start: '', end: '', label: '' });
  const [reservationAvailabilitySaving, setReservationAvailabilitySaving] = useState(false);
  const [reservationScanOpen, setReservationScanOpen] = useState(false);
  const [reservationScanStatus, setReservationScanStatus] = useState('idle');
  const [reservationScanError, setReservationScanError] = useState('');
  const [reservationScanResult, setReservationScanResult] = useState(null);
  const [reservationScanOverlayOpen, setReservationScanOverlayOpen] = useState(false);
  const [reservationScanSession, setReservationScanSession] = useState(0);

  const resetPublicationForm = () => {
    setPublicationForm({
      titulo: '',
      contenido: '',
      tipo: 'AVISO_GENERAL',
      fechaFinVigencia: '',
      categoryIds: [],
      categoryTypes: [],
      businessId: '',
      mediaUrl: '',
      mediaType: 'IMAGEN',
      precio: '',
      extras: [],
    });
    setEditingPublicationId(null);
  };

  const openCreateDialog = (tab = 'publicacion') => {
    const nextTab = typeof tab === 'string' ? tab : 'publicacion';
    resetPublicationForm();
    setCreateDialogTab(nextTab);
    setCreateOpen(true);
  };

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const isAdmin = currentUser?.role === 'admin';
  const isOferente = currentUser?.rol === 'OFERENTE';
  const shouldShowPublicFeed = !isAdmin && !isOferente;
  const isAdPanelExpanded = adPanelOpen && !isAdPanelNarrow;

  const toggleAdPanel = () => {
    setAdPanelOpen((prev) => {
      const next = !prev;
      setAdPanelUserClosed(!next);
      return next;
    });
  };

  const notify = (variant, message) => {
    setAlerts((prev) => [...prev, { id: crypto.randomUUID(), variant, message }]);
    setTimeout(() => setAlerts((prev) => prev.slice(1)), 4000);
  };

  const resetReservationFlow = () => {
    setReservationStep('mode');
    setReservationMode('');
    setReservationGuest({ nombre: '', apellido: '', rut: '' });
    setReservationType(defaultBusinessTypes[0]);
    setReservationSearch('');
    setReservationBusinessId('');
    setReservationTableSelection([]);
    setReservationDate('');
    setReservationTime('');
    setReservationNotes('');
    setReservationPayment({ name: '', number: '', expiry: '', cvv: '' });
    setReservationSuccess(null);
    setReservationPendingAuth(false);
  };

  const openReservationDialog = () => {
    resetReservationFlow();
    setReservationOpen(true);
  };

  const getReservationTablesForBusiness = (businessId) => {
    if (!businessId) return [];
    const tables = reservationTablesByBusiness?.[String(businessId)];
    return Array.isArray(tables) ? tables : [];
  };

  const setReservationTablesForBusiness = (businessId, tables) => {
    if (!businessId) return;
    const key = String(businessId);
    setReservationTablesByBusiness((prev) => ({ ...prev, [key]: Array.isArray(tables) ? tables : [] }));
  };

  const loadReservationTables = async (businessId, { force = false, date, time } = {}) => {
    if (!businessId) return [];
    const key = String(businessId);
    const cached = reservationTablesByBusiness?.[key];
    if (!force && Array.isArray(cached) && cached.length) return cached;
    setReservationTablesLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (time) params.set('time', time);
      const query = params.toString();
      const data = await fetchJson(`/businesses/${key}/tables${query ? `?${query}` : ''}`, {
        headers: authHeaders,
      });
      const tables = Array.isArray(data) ? data : [];
      setReservationTablesForBusiness(key, tables);
      return tables;
    } catch (err) {
      notify('danger', err.message);
      return [];
    } finally {
      setReservationTablesLoading(false);
    }
  };

  const handleReservationRegisteredStart = () => {
    setReservationMode('registered');
    if (!currentUser) {
      setReservationPendingAuth(true);
      setAuthOpen(true);
      return;
    }
    if (currentUser.rol !== 'CLIENTE') {
      notify('warning', 'Para reservar con registro debes iniciar sesión como cliente.');
      return;
    }
    setReservationStep('business');
  };

  const handleReservationGuestStart = () => {
    setReservationMode('guest');
    setReservationStep('guest');
  };

  const handleReservationGuestSubmit = (event) => {
    event?.preventDefault?.();
    const nombre = reservationGuest.nombre.trim();
    const apellido = reservationGuest.apellido.trim();
    const rut = reservationGuest.rut.trim();
    if (!nombre || !apellido || !rut) {
      notify('warning', 'Completa nombre, apellido y RUT para continuar.');
      return;
    }
    if (!isValidRut(rut)) {
      notify('warning', 'El RUT ingresado no es válido.');
      return;
    }
    setReservationStep('business');
  };

  const handleReservationBusinessSelect = (businessId) => {
    if (!businessId) return;
    setReservationBusinessId(String(businessId));
    setReservationTableSelection([]);
    setReservationTime('');
    setReservationStep('tables');
    loadReservationTables(businessId, { force: true });
  };

  const handleReservationTableToggle = (tableId) => {
    setReservationTableSelection((prev) => {
      const set = new Set(prev.map(String));
      const key = String(tableId);
      if (set.has(key)) {
        set.delete(key);
      } else {
        set.add(key);
      }
      return Array.from(set);
    });
  };

  const handleReservationToPayment = () => {
    if (!reservationBusinessId) {
      notify('warning', 'Selecciona un local para continuar.');
      return;
    }
    if (!reservationTableSelection.length) {
      notify('warning', 'Selecciona al menos una mesa disponible.');
      return;
    }
    if (!reservationDate || !reservationTime) {
      notify('warning', 'Completa la fecha y hora de la reserva.');
      return;
    }
    const selectedTables = getReservationTablesForBusiness(reservationBusinessId).filter((table) =>
      reservationTableSelection.includes(String(table.id))
    );
    const hasUnavailableTables = selectedTables.some((table) => {
      const availabilityStatus = table.availabilityStatus || table.status || 'DISPONIBLE';
      return availabilityStatus !== 'DISPONIBLE';
    });
    if (hasUnavailableTables) {
      notify('warning', 'Algunas mesas ya no están disponibles para ese horario.');
      return;
    }
    const business = reservationBusiness || businesses.find((b) => String(b.id) === String(reservationBusinessId));
    if (business) {
      const closure = getBusinessClosureInfo(business, reservationDate);
      if (closure) {
        notify('warning', closure.message);
        return;
      }
    }
    if (business && !isTimeAllowedForBusiness(business, reservationTime)) {
      notify('warning', 'La hora seleccionada no está dentro del horario de funcionamiento.');
      return;
    }
    setReservationStep('payment');
  };

  const handleConfirmReservation = async () => {
    if (reservationMode === 'registered' && currentUser?.rol !== 'CLIENTE') {
      notify('warning', 'Debes iniciar sesión como cliente para completar la reserva.');
      return;
    }
    const tables = getReservationTablesForBusiness(reservationBusinessId);
    const selectedTables = tables.filter((table) => reservationTableSelection.includes(String(table.id)));
    const unavailable = selectedTables.some((table) => {
      const availabilityStatus = table.availabilityStatus || table.status || 'DISPONIBLE';
      return availabilityStatus !== 'DISPONIBLE';
    });
    if (unavailable) {
      notify('warning', 'Algunas mesas ya no están disponibles.');
      return;
    }
    if (!selectedTables.length) {
      notify('warning', 'Selecciona al menos una mesa disponible.');
      return;
    }
    if (!reservationDate || !reservationTime) {
      notify('warning', 'Completa la fecha y hora de la reserva.');
      return;
    }
    const payment = {
      name: reservationPayment.name.trim(),
      number: reservationPayment.number.replace(/\s+/g, ''),
      expiry: reservationPayment.expiry.trim(),
      cvv: reservationPayment.cvv.trim(),
    };
    if (!payment.name || !payment.number || !payment.expiry || !payment.cvv) {
      notify('warning', 'Completa los datos de la tarjeta para continuar.');
      return;
    }

    const business = businesses.find((b) => String(b.id) === String(reservationBusinessId));
    if (!business) {
      notify('warning', 'No se pudo encontrar el local seleccionado.');
      return;
    }
    const closure = getBusinessClosureInfo(business, reservationDate);
    if (closure) {
      notify('warning', closure.message);
      return;
    }
    if (!isTimeAllowedForBusiness(business, reservationTime)) {
      notify('warning', 'La hora seleccionada no está dentro del horario de funcionamiento.');
      return;
    }
    try {
      const schedule = resolveScheduleForTime(reservationTime);
      const payload = {
        businessId: String(business.id),
        tableIds: reservationTableSelection,
        date: reservationDate,
        time: reservationTime,
        schedule,
        notes: reservationNotes.trim(),
        amount: RESERVATION_PRICE,
        guest:
          reservationMode === 'guest'
            ? {
                nombre: reservationGuest.nombre.trim(),
                apellido: reservationGuest.apellido.trim(),
                rut: formatRut(reservationGuest.rut),
              }
            : undefined,
      };
      const data = await fetchJson('/reservations', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      setReservationSuccess({ ...data, businessLogo: business.imageUrl || '' });
      setReservationStep('success');
      if (reservationMode === 'registered') {
        loadMyReservations();
      }
      loadReservationTables(reservationBusinessId, { force: true });
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleReservationAdminAddTable = async () => {
    if (!reservationAdminBusinessId) return;
    const label = reservationTableDraft.label.trim();
    const seats = Math.max(1, Number(reservationTableDraft.seats) || 1);
    const status = reservationTableDraft.status || 'DISPONIBLE';
    const current = getReservationTablesForBusiness(reservationAdminBusinessId);
    const nextLabel = label || `Mesa ${current.length + 1}`;
    try {
      const created = await fetchJson(`/businesses/${reservationAdminBusinessId}/tables`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          label: nextLabel,
          seats,
          status,
        }),
      });
      setReservationTablesForBusiness(reservationAdminBusinessId, [...current, created]);
      setReservationTableDraft((prev) => ({ ...prev, label: '', seats: prev.seats }));
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleSaveReservationHours = async () => {
    if (!reservationAdminBusinessId) return;
    const morningStartMinutes = parseTimeToMinutes(reservationHoursDraft.morningStart);
    const morningEndMinutes = parseTimeToMinutes(reservationHoursDraft.morningEnd);
    const afternoonStartMinutes = parseTimeToMinutes(reservationHoursDraft.afternoonStart);
    const afternoonEndMinutes = parseTimeToMinutes(reservationHoursDraft.afternoonEnd);

    if (
      reservationHoursDraft.morningStart &&
      reservationHoursDraft.morningEnd &&
      morningStartMinutes !== null &&
      morningEndMinutes !== null &&
      morningStartMinutes >= morningEndMinutes
    ) {
      notify('warning', 'El horario de mañana debe terminar después del inicio.');
      return;
    }
    if (
      reservationHoursDraft.afternoonStart &&
      reservationHoursDraft.afternoonEnd &&
      afternoonStartMinutes !== null &&
      afternoonEndMinutes !== null &&
      afternoonStartMinutes >= afternoonEndMinutes
    ) {
      notify('warning', 'El horario de tarde debe terminar después del inicio.');
      return;
    }
    setReservationHoursSaving(true);
    try {
      await fetchJson(`/businesses/${reservationAdminBusinessId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          morningStart: reservationHoursDraft.morningStart || null,
          morningEnd: reservationHoursDraft.morningEnd || null,
          afternoonStart: reservationHoursDraft.afternoonStart || null,
          afternoonEnd: reservationHoursDraft.afternoonEnd || null,
        }),
      });
      notify('success', 'Horario actualizado');
      loadBusinesses();
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setReservationHoursSaving(false);
    }
  };

  const toggleReservationOperatingDay = (dayValue) => {
    setReservationAvailabilityDraft((prev) => {
      const current = Array.isArray(prev.operatingDays) ? prev.operatingDays : [];
      const set = new Set(current.map((day) => Number(day)));
      if (set.has(dayValue)) {
        set.delete(dayValue);
      } else {
        set.add(dayValue);
      }
      const ordered = WEEKDAY_OPTIONS.map((day) => day.value).filter((value) => set.has(value));
      return { ...prev, operatingDays: ordered };
    });
  };

  const handleAddReservationHoliday = () => {
    const normalized = normalizeDateValue(reservationHolidayDraft);
    if (!normalized) {
      notify('warning', 'Selecciona una fecha válida para agregar como feriado.');
      return;
    }
    setReservationAvailabilityDraft((prev) => {
      const current = Array.isArray(prev.holidayDates) ? prev.holidayDates : [];
      if (current.includes(normalized)) {
        notify('warning', 'Ese feriado ya está agregado.');
        return prev;
      }
      const next = [...current, normalized].sort();
      return { ...prev, holidayDates: next };
    });
    setReservationHolidayDraft('');
  };

  const handleRemoveReservationHoliday = (dateValue) => {
    setReservationAvailabilityDraft((prev) => ({
      ...prev,
      holidayDates: (Array.isArray(prev.holidayDates) ? prev.holidayDates : []).filter((date) => date !== dateValue),
    }));
  };

  const handleAddReservationVacation = () => {
    const start = normalizeDateValue(reservationVacationDraft.start);
    const end = normalizeDateValue(reservationVacationDraft.end);
    if (!start || !end) {
      notify('warning', 'Completa fecha de inicio y término para las vacaciones.');
      return;
    }
    const startKey = parseDateToKey(start);
    const endKey = parseDateToKey(end);
    if (startKey !== null && endKey !== null && startKey > endKey) {
      notify('warning', 'La fecha de término debe ser posterior o igual al inicio.');
      return;
    }
    const label = reservationVacationDraft.label.trim();
    setReservationAvailabilityDraft((prev) => {
      const current = Array.isArray(prev.vacationRanges) ? prev.vacationRanges : [];
      const next = [...current, label ? { start, end, label } : { start, end }];
      return { ...prev, vacationRanges: next };
    });
    setReservationVacationDraft({ start: '', end: '', label: '' });
  };

  const handleRemoveReservationVacation = (index) => {
    setReservationAvailabilityDraft((prev) => ({
      ...prev,
      vacationRanges: (Array.isArray(prev.vacationRanges) ? prev.vacationRanges : []).filter(
        (_range, idx) => idx !== index
      ),
    }));
  };

  const handleSaveReservationAvailability = async () => {
    if (!reservationAdminBusinessId) return;
    const operatingDays = normalizeOperatingDaysList(reservationAvailabilityDraft.operatingDays) ?? [];
    const holidayDates = Array.isArray(reservationAvailabilityDraft.holidayDates)
      ? reservationAvailabilityDraft.holidayDates.map(normalizeDateValue).filter(Boolean)
      : [];
    const vacationRanges = Array.isArray(reservationAvailabilityDraft.vacationRanges)
      ? reservationAvailabilityDraft.vacationRanges
          .map((range) => {
            const start = normalizeDateValue(range?.start);
            const end = normalizeDateValue(range?.end);
            if (!start || !end) return null;
            const startKey = parseDateToKey(start);
            const endKey = parseDateToKey(end);
            if (startKey === null || endKey === null || startKey > endKey) return null;
            const label = typeof range?.label === 'string' ? range.label.trim() : '';
            return label ? { start, end, label } : { start, end };
          })
          .filter(Boolean)
      : [];
    const temporaryClosureStart = normalizeDateValue(reservationAvailabilityDraft.temporaryClosureStart);
    const temporaryClosureEnd = normalizeDateValue(reservationAvailabilityDraft.temporaryClosureEnd);
    if (temporaryClosureStart && temporaryClosureEnd) {
      const startKey = parseDateToKey(temporaryClosureStart);
      const endKey = parseDateToKey(temporaryClosureEnd);
      if (startKey !== null && endKey !== null && startKey > endKey) {
        notify('warning', 'El cierre temporal debe tener un rango válido.');
        return;
      }
    }
    setReservationAvailabilitySaving(true);
    try {
      await fetchJson(`/businesses/${reservationAdminBusinessId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          operatingDays,
          holidayDates,
          vacationRanges,
          temporaryClosureActive: Boolean(reservationAvailabilityDraft.temporaryClosureActive),
          temporaryClosureStart: temporaryClosureStart || null,
          temporaryClosureEnd: temporaryClosureEnd || null,
          temporaryClosureMessage: reservationAvailabilityDraft.temporaryClosureMessage.trim() || null,
        }),
      });
      notify('success', 'Disponibilidad actualizada');
      loadBusinesses();
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setReservationAvailabilitySaving(false);
    }
  };

  const handleReservationAdminUpdateTable = async (tableId, patch) => {
    if (!reservationAdminBusinessId) return;
    try {
      const updated = await fetchJson(`/tables/${tableId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(patch),
      });
      const current = getReservationTablesForBusiness(reservationAdminBusinessId);
      setReservationTablesForBusiness(
        reservationAdminBusinessId,
        current.map((table) => (String(table.id) === String(tableId) ? { ...table, ...updated } : table))
      );
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleReservationAdminRemoveTable = async (tableId) => {
    if (!reservationAdminBusinessId) return;
    try {
      await fetchJson(`/tables/${tableId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const current = getReservationTablesForBusiness(reservationAdminBusinessId);
      setReservationTablesForBusiness(
        reservationAdminBusinessId,
        current.filter((table) => String(table.id) !== String(tableId))
      );
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleReservationScanOverlayClose = () => {
    setReservationScanOverlayOpen(false);
    if (reservationScanOpen) {
      setReservationScanStatus('scanning');
      setReservationScanError('');
      setReservationScanResult(null);
      setReservationScanSession((prev) => prev + 1);
    }
  };

  const verifyReservationByCode = async (code) => {
    if (!code) {
      setReservationScanError('No se pudo leer el código de la reserva.');
      setReservationScanStatus('error');
      setReservationScanOverlayOpen(true);
      return;
    }
    setReservationScanStatus('verifying');
    setReservationScanError('');
    try {
      const data = await fetchJson(`/reservations/verify?code=${encodeURIComponent(code)}`, { headers: authHeaders });
      setReservationScanResult(data);
      setReservationScanStatus('success');
      setReservationScanOverlayOpen(true);
    } catch (err) {
      setReservationScanError(err.message || 'No se pudo verificar la reserva.');
      setReservationScanStatus('error');
      setReservationScanOverlayOpen(true);
    }
  };

  const buildFeedCacheKey = (query) => {
    const baseKey = query || 'default';
    if (currentUser?.rol === 'OFERENTE') {
      return `oferente:${currentUser?.id || 'me'}|${baseKey}`;
    }
    if (currentUser?.role === 'admin') {
      return `admin:${currentUser?.id || 'admin'}|${baseKey}`;
    }
    return `public|${baseKey}`;
  };

  const buildAdsCacheKey = (query, tenantParam) => {
    const baseKey = query || 'default';
    const tenantKey = tenantParam || 'public';
    return `${tenantKey}|${baseKey}`;
  };

  const syncFeedCache = (nextFeed, cacheKey = feedCacheKeyRef.current) => {
    if (!cacheKey || !Array.isArray(nextFeed)) return;
    writeCacheEntry(FEED_CACHE_STORAGE_KEY, cacheKey, nextFeed);
  };

  const handleMediaUrlChange = (value) => {
    const mediaType = detectMediaTypeFromUrl(value);
    setPublicationForm((prev) => ({ ...prev, mediaUrl: value, mediaType }));
  };

  const handleMediaFileChange = async (file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) {
      notify('danger', 'Solo se permiten imágenes o videos cortos');
      return;
    }
    if (isImage) {
      try {
        const compressed = await compressImageFile(file);
        if (!compressed) {
          notify('danger', 'No se pudo procesar la imagen');
          return;
        }
        handleMediaUrlChange(compressed);
      } catch {
        notify('danger', 'No se pudo procesar la imagen');
      }
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      handleMediaUrlChange(result);
    };
    reader.onerror = () => notify('danger', 'No se pudo leer el archivo de portada');
    reader.readAsDataURL(file);
  };

  const handleAddPublicationExtra = () => {
    setPublicationForm((prev) => {
      const current = Array.isArray(prev.extras) ? prev.extras : [];
      if (current.length >= PUBLICATION_EXTRAS_LIMIT) return prev;
      return {
        ...prev,
        extras: [
          ...current,
          {
            nombre: '',
            precio: '',
            imagenUrl: '',
          },
        ],
      };
    });
  };

  const handleRemovePublicationExtra = (index) => {
    setPublicationForm((prev) => {
      const current = Array.isArray(prev.extras) ? prev.extras : [];
      return { ...prev, extras: current.filter((_, idx) => idx !== index) };
    });
  };

  const updatePublicationExtra = (index, patch) => {
    setPublicationForm((prev) => {
      const current = Array.isArray(prev.extras) ? prev.extras : [];
      const next = current.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
      return { ...prev, extras: next };
    });
  };

  const handleExtraImageFileChange = async (index, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('danger', 'Solo se permiten imágenes para los agregados');
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      if (!compressed) {
        notify('danger', 'No se pudo procesar la imagen');
        return;
      }
      updatePublicationExtra(index, { imagenUrl: compressed });
    } catch {
      notify('danger', 'No se pudo procesar la imagen');
    }
  };

  const handleBusinessLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('danger', 'Selecciona una imagen válida');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_BUSINESS_LOGO_BYTES) {
      notify('danger', 'La imagen supera el máximo de 1 MB');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        notify('danger', 'No se pudo leer la imagen');
        return;
      }
      setBusinessProfileForm((prev) => ({ ...prev, imageUrl: result }));
    };
    reader.onerror = () => notify('danger', 'No se pudo leer la imagen');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const loadPublicTenants = async () => {
    try {
      const data = await fetchJson('/public/tenants');
      setTenants(data);
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadTenantInfo = async () => {
    if (!token || isAdmin) return;
    try {
      const data = await fetchJson('/tenants/me', { headers: authHeaders });
      setTenantInfo(data);
      if (data?.id) {
        setSelectedTenantId(String(data.id));
        localStorage.setItem('tenantId', String(data.id));
      }
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadCategoryTypes = async () => {
    try {
      const data = await fetchJson('/catalog/category-types');
      setCategoryTypes(data);
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadCategories = async (tenantIdOverride) => {
    const tenantToUse = tenantIdOverride || selectedTenantId;
    if (!tenantToUse) {
      setCategories([]);
      return [];
    }
    try {
      const data = await fetchJson(`/categories?tenantId=${tenantToUse}`, { headers: authHeaders });
      setCategories(data);
      return data;
    } catch (err) {
      notify('danger', err.message);
      return [];
    }
  };

  const loadBusinesses = async () => {
    if (!selectedTenantId && !isAdmin) {
      setBusinesses([]);
      return;
    }
    try {
      const params = new URLSearchParams();
      if (selectedTenantId) params.set('tenantId', selectedTenantId);
      if (isOferente) params.set('mine', 'true');
      const query = params.toString();
      const data = await fetchJson(`/businesses${query ? `?${query}` : ''}`, { headers: authHeaders });
      setBusinesses(data);
    } catch (err) {
      notify('danger', err.message);
      setBusinesses([]);
    }
  };

  const loadMyReservations = async () => {
    if (!currentUser || currentUser.rol !== 'CLIENTE') {
      setReservations([]);
      return;
    }
    try {
      const data = await fetchJson('/reservations/mine', { headers: authHeaders });
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      notify('danger', err.message);
      setReservations([]);
    }
  };

  const loadReservationAdminReservations = async (businessId) => {
    if (!businessId) {
      setReservationAdminReservations([]);
      return;
    }
    setReservationAdminReservationsLoading(true);
    try {
      const data = await fetchJson(`/businesses/${businessId}/reservations`, { headers: authHeaders });
      setReservationAdminReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      notify('danger', err.message);
      setReservationAdminReservations([]);
    } finally {
      setReservationAdminReservationsLoading(false);
    }
  };

  const loadFeed = async () => {
    const params = new URLSearchParams();
    const categoryIdsForFilter = resolveCategoryIdsForFilter(filters.categoryId);
    const numericCategoryIds = categoryIdsForFilter.filter((id) => /^\d+$/.test(String(id)));
    if (filters.search) params.set('search', filters.search);
    if (numericCategoryIds.length === 1) {
      params.set('categoryId', numericCategoryIds[0]);
    }
    if (filters.businessId) params.set('businessId', filters.businessId);
    const canUseMineFeed = currentUser?.rol === 'OFERENTE' && Boolean(selectedTenantId || currentUser?.tenantId);
    if (canUseMineFeed) params.set('mine', 'true');
    const tenantParam = currentUser ? selectedTenantId || currentUser?.tenantId : '';
    if (tenantParam) params.set('tenantId', tenantParam);
    const query = params.toString();
    const cacheKey = buildFeedCacheKey(query);
    const cachedEntry = readCacheEntry(FEED_CACHE_STORAGE_KEY, cacheKey);
    const cachedData = Array.isArray(cachedEntry?.data) ? cachedEntry.data : null;
    if (cachedData && cachedData.length) {
      setFeed(cachedData);
      feedCacheKeyRef.current = cacheKey;
      prefetchMediaAssets(cachedData, { limit: FEED_MEDIA_PREFETCH_LIMIT });
    } else if (feedCacheKeyRef.current !== cacheKey) {
      setFeed([]);
    }
    setLoadingFeed(true);
    try {
      const data = await fetchJson(`/feed/publications${query ? `?${query}` : ''}`, { headers: authHeaders });
      if (cachedData && cachedData.length) {
        await prefetchMediaAssets(data, { limit: FEED_MEDIA_PREFETCH_LIMIT });
      }
      setFeed(data);
      feedCacheKeyRef.current = cacheKey;
      writeCacheEntry(FEED_CACHE_STORAGE_KEY, cacheKey, data);
    } catch (err) {
      if (!cachedData || cachedData.length === 0) {
        notify('danger', err.message);
        setFeed([]);
      }
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadAdPublications = async () => {
    if (!shouldShowPublicFeed) {
      setAdPublications([]);
      setLoadingAds(false);
      return;
    }
    let cachedData = null;
    try {
      const params = new URLSearchParams();
      const tenantParam = currentUser ? selectedTenantId || currentUser?.tenantId : selectedTenantId;
      if (tenantParam) params.set('tenantId', tenantParam);
      const query = params.toString();
      const cacheKey = buildAdsCacheKey(query, tenantParam);
      const cachedEntry = readCacheEntry(ADS_CACHE_STORAGE_KEY, cacheKey);
      cachedData = Array.isArray(cachedEntry?.data) ? cachedEntry.data : null;
      if (cachedData && cachedData.length) {
        setAdPublications(cachedData);
        adsCacheKeyRef.current = cacheKey;
        prefetchMediaAssets(cachedData, { limit: ADS_MEDIA_PREFETCH_LIMIT });
      } else if (adsCacheKeyRef.current !== cacheKey) {
        setAdPublications([]);
      }
      setLoadingAds(true);
      const data = await fetchJson(`/feed/ads${query ? `?${query}` : ''}`, { headers: authHeaders });
      if (cachedData && cachedData.length) {
        await prefetchMediaAssets(data, { limit: ADS_MEDIA_PREFETCH_LIMIT });
      }
      setAdPublications(data);
      adsCacheKeyRef.current = cacheKey;
      writeCacheEntry(ADS_CACHE_STORAGE_KEY, cacheKey, data);
    } catch (err) {
      if (!cachedData || cachedData.length === 0) {
        notify('danger', err.message);
        setAdPublications([]);
      }
    } finally {
      setLoadingAds(false);
    }
  };

  const resetBusinessProfileView = () => {
    setBusinessProfile(null);
    setBusinessProfilePublications([]);
    setLoadingBusinessProfile(false);
  };

  const handleHome = () => {
    resetBusinessProfileView();
    setTopHeartsMode(false);
    const isDefault =
      filters.search === defaultFilters.search &&
      filters.categoryId === defaultFilters.categoryId &&
      filters.businessId === defaultFilters.businessId &&
      filters.businessType === defaultFilters.businessType &&
      filters.region === defaultFilters.region &&
      filters.city === defaultFilters.city &&
      (!filters.amenities || filters.amenities.length === 0) &&
      filters.sortBy === defaultFilters.sortBy &&
      filters.sortDir === defaultFilters.sortDir;
    if (!isDefault) {
      setFilters({ ...defaultFilters });
    } else {
      loadFeed();
    }
  };

  const handleTopHearts = () => {
    setTopHeartsMode(true);
    setFilters({ ...defaultFilters, sortBy: 'hearts', sortDir: 'desc' });
  };

  const loadMyPublications = async () => {
    if (!isOferente) {
      setMyPublications([]);
      setLoadingMyPublications(false);
      return;
    }
    if (!selectedTenantId && !currentUser?.tenantId) {
      setMyPublications([]);
      setLoadingMyPublications(false);
      return;
    }
    setLoadingMyPublications(true);
    try {
      const params = new URLSearchParams();
      if (selectedTenantId) params.set('tenantId', selectedTenantId);
      const query = params.toString();
      const data = await fetchJson(`/publications/mine${query ? `?${query}` : ''}`, { headers: authHeaders });
      const decorated = data.map((item, idx) => {
        const fallbackCover = placeholderImages[(Number(item.id) || idx) % placeholderImages.length];
        const coverUrl = item.coverUrl || fallbackCover;
        const coverType = item.coverType || detectMediaTypeFromUrl(item.coverUrl || '');
        const normalizedCategories = (item.categories || [])
          .map((cat) => normalizeCategory(cat, categories))
          .filter(Boolean);
        const categoryIds = normalizedCategories.map((c) => c.id);
        return {
          ...item,
          coverUrl,
          coverType,
          categories: normalizedCategories,
          categoryIds: item.categoryIds || categoryIds,
          business: item.business || businesses.find((b) => String(b.id) === String(item.businessId)) || null,
        };
      });
      setMyPublications(decorated);
    } catch (err) {
      notify('danger', err.message);
      setMyPublications([]);
    } finally {
      setLoadingMyPublications(false);
    }
  };

  const loadAdminQueues = async () => {
    if (!isAdmin) return;
    try {
      const publicationsPending = await fetchJson('/admin/publications/pending', { headers: authHeaders });
      setAdminQueues({ publications: publicationsPending });
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const loadAdminAds = async () => {
    if (!isAdmin) return;
    setLoadingAdminAds(true);
    try {
      const params = new URLSearchParams();
      if (adminAdsTenantId) params.set('tenantId', adminAdsTenantId);
      const query = params.toString();
      const data = await fetchJson(`/admin/publications/ads${query ? `?${query}` : ''}`, { headers: authHeaders });
      setAdminAdPublications(data);
    } catch (err) {
      notify('danger', err.message);
      setAdminAdPublications([]);
    } finally {
      setLoadingAdminAds(false);
    }
  };

  const handleToggleAdminAd = async (publication, enabled) => {
    if (!isAdmin || !publication?.id) return;
    const targetId = String(publication.id);
    setSavingAdminAds((prev) => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });
    try {
      const params = new URLSearchParams();
      if (adminAdsTenantId) params.set('tenantId', adminAdsTenantId);
      const query = params.toString();
      await fetchJson(`/admin/publications/${publication.id}/ads${query ? `?${query}` : ''}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ enabled }),
      });
      setAdminAdPublications((prev) =>
        prev.map((item) => (String(item.id) === targetId ? { ...item, esPublicidad: enabled } : item))
      );
      notify('success', enabled ? 'Publicidad activada' : 'Publicidad desactivada');
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setSavingAdminAds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    }
  };

  useEffect(() => {
    loadPublicTenants();
    loadCategoryTypes();
  }, []);

  useEffect(() => {
    loadTenantInfo();
  }, [token, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setSelectedTenantId('');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.tenantId && String(selectedTenantId || '') !== String(currentUser.tenantId)) {
      const normalized = String(currentUser.tenantId);
      setSelectedTenantId(normalized);
      localStorage.setItem('tenantId', normalized);
    }
  }, [currentUser, selectedTenantId]);

  useEffect(() => {
    if (selectedTenantId || isAdmin) return;
    if (currentUser && currentUser.rol && currentUser.rol !== 'CLIENTE') return;
    if (!tenants.length) return;
    const fallbackTenant = tenants[0];
    if (!fallbackTenant?.id) return;
    const normalized = String(fallbackTenant.id);
    setSelectedTenantId(normalized);
    localStorage.setItem('tenantId', normalized);
  }, [tenants, selectedTenantId, currentUser, isAdmin]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mediaQuery = window.matchMedia('(max-width: 1200px)');
    const handleChange = () => {
      const isNarrow = mediaQuery.matches;
      setIsAdPanelNarrow(isNarrow);
      if (isNarrow) {
        setAdPanelOpen(false);
      } else if (!adPanelUserClosed) {
        setAdPanelOpen(true);
      }
    };
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [adPanelUserClosed]);

  useEffect(() => {
    if (selectedTenantId) {
      loadCategories();
    }
    if (selectedTenantId || isAdmin) {
      loadBusinesses();
    }
  }, [selectedTenantId, isAdmin]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFeed();
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters.search, filters.categoryId, filters.businessId, currentUser, selectedTenantId]);

  useEffect(() => {
    loadAdPublications();
  }, [shouldShowPublicFeed, selectedTenantId, currentUser, token]);

  useEffect(() => {
    loadAdminQueues();
  }, [currentUser]);

  useEffect(() => {
    loadAdminAds();
  }, [isAdmin, adminAdsTenantId]);

  useEffect(() => {
    if (isOferente) {
      loadMyPublications();
    }
  }, [isOferente, selectedTenantId]);

  useEffect(() => {
    if (currentUser?.rol === 'CLIENTE') {
      loadMyReservations();
    } else {
      setReservations([]);
    }
  }, [currentUser, token]);

  useEffect(() => {
    if (reservationAdminBusinessId) {
      loadReservationTables(reservationAdminBusinessId, { force: true });
      loadReservationAdminReservations(reservationAdminBusinessId);
    }
  }, [reservationAdminBusinessId]);

  useEffect(() => {
    if (reservationBusinessId && reservationOpen) {
      loadReservationTables(reservationBusinessId, { force: true });
    }
  }, [reservationBusinessId, reservationOpen]);

  useEffect(() => {
    if (!reservationBusinessId) return;
    const business =
      businesses.find((b) => String(b.id) === String(reservationBusinessId)) || null;
    if (!business) return;
    if (reservationTime && !isTimeAllowedForBusiness(business, reservationTime)) {
      setReservationTime('');
    }
  }, [businesses, reservationBusinessId, reservationTime]);

  useEffect(() => {
    if (!reservationScanOpen) {
      if (reservationScannerRef.current) {
        reservationScannerRef.current.stop?.();
        reservationScannerRef.current = null;
      }
      return;
    }
    let active = true;
    setReservationScanStatus('scanning');
    setReservationScanError('');
    setReservationScanResult(null);
    setReservationScanOverlayOpen(false);

    const startScanner = async () => {
      try {
        const module = await import('@zxing/browser');
        if (!active) return;
        const Reader = module?.BrowserQRCodeReader;
        if (!Reader) {
          setReservationScanError('No se pudo iniciar el lector de QR.');
          setReservationScanStatus('error');
          return;
        }

        const codeReader = new Reader();
        const videoElement = reservationScanVideoRef.current;

        if (!videoElement) {
          setReservationScanError('No se pudo iniciar la cámara.');
          setReservationScanStatus('error');
          return;
        }

        const controls = await codeReader.decodeFromVideoDevice(null, videoElement, (result, error, controls) => {
          if (!active) {
            controls?.stop?.();
            return;
          }
          if (error) {
            return;
          }
          if (!result) return;
          active = false;
          controls?.stop?.();
          reservationScannerRef.current = null;
          const payload = typeof result.getText === 'function' ? result.getText() : result.text || '';
          const code = extractReservationCode(payload);
          verifyReservationByCode(code);
        });
        if (!active) {
          controls?.stop?.();
          return;
        }
        reservationScannerRef.current = controls;
      } catch (err) {
        if (!active) return;
        setReservationScanError(err.message || 'No se pudo cargar el lector de QR.');
        setReservationScanStatus('error');
      }
    };

    startScanner();

    return () => {
      active = false;
      if (reservationScannerRef.current) {
        reservationScannerRef.current.stop?.();
        reservationScannerRef.current = null;
      }
    };
  }, [reservationScanOpen, reservationScanSession]);

  const reservationScanFeedback = buildReservationScanFeedback(reservationScanResult);

  const myBusinesses = useMemo(() => {
    if (isAdmin) return businesses;
    if (!currentUser) return [];
    return businesses.filter((b) => String(b.ownerId) === String(currentUser.id));
  }, [businesses, isAdmin, currentUser]);

  const businessListForForms = isAdmin ? businesses : myBusinesses;
  const showClientBottomNav = currentUser?.rol === 'CLIENTE';
  const reservationsForUser = useMemo(() => {
    if (!currentUser?.id) return [];
    return (Array.isArray(reservations) ? reservations : []).filter(
      (reservation) => String(reservation.userId) === String(currentUser.id)
    );
  }, [reservations, currentUser]);
  const clientComments = useMemo(() => {
    if (!currentUser?.id) return [];
    const list = clientCommentsByUser?.[String(currentUser.id)];
    return Array.isArray(list) ? list : [];
  }, [clientCommentsByUser, currentUser]);
  const reservationBusiness = useMemo(() => {
    if (!reservationBusinessId) return null;
    return businesses.find((b) => String(b.id) === String(reservationBusinessId)) || null;
  }, [businesses, reservationBusinessId]);
  const reservationBusinessOptions = useMemo(() => {
    const searchValue = normalizeSearchValue(reservationSearch);
    return (Array.isArray(businesses) ? businesses : [])
      .filter((business) => (!reservationType ? true : business.type === reservationType))
      .filter((business) => {
        if (!searchValue) return true;
        return normalizeSearchValue(business.name || '').includes(searchValue);
      });
  }, [businesses, reservationSearch, reservationType]);
  const reservationTablesForSelectedBusiness = useMemo(
    () => getReservationTablesForBusiness(reservationBusinessId),
    [reservationBusinessId, reservationTablesByBusiness]
  );
  const reservationSelectedTables = useMemo(() => {
    if (!reservationTablesForSelectedBusiness.length || !reservationTableSelection.length) return [];
    return reservationTablesForSelectedBusiness.filter((table) =>
      reservationTableSelection.includes(String(table.id))
    );
  }, [reservationTablesForSelectedBusiness, reservationTableSelection]);
  const reservationAdminTables = useMemo(
    () => getReservationTablesForBusiness(reservationAdminBusinessId),
    [reservationAdminBusinessId, reservationTablesByBusiness]
  );
  const reservationTimeOptions = useMemo(
    () => buildReservationTimeOptions(reservationBusiness),
    [reservationBusiness]
  );
  const reservationHoursLabel = useMemo(() => {
    const ranges = getBusinessTimeRanges(reservationBusiness);
    if (!ranges.length) return '';
    const formatted = ranges.map((range) => `${formatMinutesToTime(range.start)} - ${formatMinutesToTime(range.end)}`);
    if (formatted.length === 2) return `Mañana ${formatted[0]} · Tarde ${formatted[1]}`;
    return `Horario ${formatted[0]}`;
  }, [reservationBusiness]);
  const reservationDateClosure = useMemo(
    () => getBusinessClosureInfo(reservationBusiness, reservationDate),
    [reservationBusiness, reservationDate]
  );
  const reservationDateClosed = Boolean(reservationDateClosure);

  const savedPublicationIdsForUser = useMemo(() => {
    if (!currentUser?.id) return [];
    const list = savedPublicationsByUser?.[String(currentUser.id)];
    return Array.isArray(list) ? list.map((id) => String(id)) : [];
  }, [savedPublicationsByUser, currentUser]);
  const savedPublicationIdSet = useMemo(
    () => new Set(savedPublicationIdsForUser),
    [savedPublicationIdsForUser]
  );
  const savedPublicationsLookup = useMemo(() => {
    const map = new Map();
    const sources = [feed, adPublications, businessProfilePublications, myPublications];
    sources.forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((pub) => {
        if (!pub?.id) return;
        map.set(String(pub.id), pub);
      });
    });
    return map;
  }, [feed, adPublications, businessProfilePublications, myPublications]);
  const savedLikedPublications = useMemo(() => {
    const items = savedPublicationIdsForUser
      .map((id) => savedPublicationsLookup.get(id))
      .filter(Boolean);
    return items.filter((pub) => likedById[String(pub.id)]);
  }, [savedPublicationIdsForUser, savedPublicationsLookup, likedById]);

  const activePublicationBusinessId = useMemo(() => {
    return publicationForm.businessId || filters.businessId || businessListForForms[0]?.id || '';
  }, [publicationForm.businessId, filters.businessId, businessListForForms]);

  const selectedBusinessForPublication = useMemo(() => {
    return businessListForForms.find((b) => String(b.id) === String(activePublicationBusinessId)) || null;
  }, [businessListForForms, activePublicationBusinessId]);

  const allowedCategoryTypesForBusiness = useMemo(() => {
    const businessType = selectedBusinessForPublication?.type;
    if (businessType && categoriesByBusinessType[businessType]) {
      return categoriesByBusinessType[businessType];
    }
    return categoryTypes;
  }, [selectedBusinessForPublication, categoryTypes]);

  useEffect(() => {
    if (!publicationForm.businessId && businessListForForms.length) {
      setPublicationForm((prev) => ({ ...prev, businessId: businessListForForms[0].id }));
    }
  }, [businessListForForms, publicationForm.businessId]);

  useEffect(() => {
    const allowed = new Set((allowedCategoryTypesForBusiness || []).map((t) => String(t)));
    setPublicationForm((prev) => {
      const current = (prev.categoryTypes || []).filter(Boolean);
      const filteredTypes = current.filter((t) => allowed.has(String(t))).slice(0, 1);
      const changed = filteredTypes[0] !== current[0] || filteredTypes.length !== current.length;
      if (!changed) return prev;
      return { ...prev, categoryTypes: filteredTypes, categoryIds: filteredTypes.length ? (prev.categoryIds || []).slice(0, 1) : [] };
    });
  }, [allowedCategoryTypesForBusiness]);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(SESSION_LIKES_STORAGE_KEY, JSON.stringify(likedById));
    } catch {
      // no-op
    }
  }, [likedById]);

  useEffect(() => {
    writeStorageJson(CLIENT_COMMENTS_STORAGE_KEY, clientCommentsByUser);
  }, [clientCommentsByUser]);

  useEffect(() => {
    writeStorageJson(CLIENT_SAVED_PUBLICATIONS_STORAGE_KEY, savedPublicationsByUser);
  }, [savedPublicationsByUser]);

  useEffect(() => {
    if (!reservationPendingAuth) return;
    if (currentUser) {
      if (currentUser.rol === 'CLIENTE') {
        setReservationStep('business');
      } else {
        notify('warning', 'Para reservar con registro necesitas ingresar como cliente.');
      }
      setReservationPendingAuth(false);
    }
  }, [reservationPendingAuth, currentUser]);

  useEffect(() => {
    if (!authOpen && reservationPendingAuth && !currentUser) {
      setReservationPendingAuth(false);
    }
  }, [authOpen, reservationPendingAuth, currentUser]);

  useEffect(() => {
    if (!businessListForForms.length) {
      setProfileBusinessId('');
      return;
    }
    if (!profileBusinessId || !businessListForForms.some((b) => String(b.id) === String(profileBusinessId))) {
      setProfileBusinessId(String(businessListForForms[0].id));
    }
  }, [businessListForForms, profileBusinessId]);

  useEffect(() => {
    const selected = businessListForForms.find((b) => String(b.id) === String(profileBusinessId));
    if (!selected) return;
    setBusinessProfileForm((prev) => ({
      ...prev,
      name: selected.name || '',
      description: selected.description || '',
      address: selected.address || '',
      city: selected.city || '',
      region: selected.region || '',
      amenities: Array.isArray(selected.amenities) ? selected.amenities : [],
      imageUrl: selected.imageUrl || '',
      phone: selected.phone || '',
    }));
  }, [businessListForForms, profileBusinessId]);

  useEffect(() => {
    if (!businessListForForms.length) {
      setReservationAdminBusinessId('');
      setReservationAdminReservations([]);
      return;
    }
    if (
      !reservationAdminBusinessId ||
      !businessListForForms.some((b) => String(b.id) === String(reservationAdminBusinessId))
    ) {
      setReservationAdminBusinessId(String(businessListForForms[0].id));
    }
  }, [businessListForForms, reservationAdminBusinessId]);

  useEffect(() => {
    const selected = businessListForForms.find((b) => String(b.id) === String(reservationAdminBusinessId));
    if (!selected) return;
    setReservationHoursDraft({
      morningStart: selected.morningStart || '',
      morningEnd: selected.morningEnd || '',
      afternoonStart: selected.afternoonStart || '',
      afternoonEnd: selected.afternoonEnd || '',
    });
  }, [businessListForForms, reservationAdminBusinessId]);

  useEffect(() => {
    if (!reservationBusinessId || !reservationDate || !reservationTime) return;
    loadReservationTables(reservationBusinessId, {
      force: true,
      date: reservationDate,
      time: reservationTime,
    });
  }, [reservationBusinessId, reservationDate, reservationTime]);

  useEffect(() => {
    const selected = businessListForForms.find((b) => String(b.id) === String(reservationAdminBusinessId));
    if (!selected) return;
    const operatingDays = normalizeOperatingDaysList(selected.operatingDays);
    setReservationAvailabilityDraft({
      operatingDays: operatingDays === null ? DEFAULT_OPERATING_DAYS : operatingDays,
      holidayDates: Array.isArray(selected.holidayDates) ? selected.holidayDates : [],
      vacationRanges: Array.isArray(selected.vacationRanges) ? selected.vacationRanges : [],
      temporaryClosureActive: Boolean(selected.temporaryClosureActive),
      temporaryClosureStart: selected.temporaryClosureStart || '',
      temporaryClosureEnd: selected.temporaryClosureEnd || '',
      temporaryClosureMessage: selected.temporaryClosureMessage || '',
    });
    setReservationHolidayDraft('');
    setReservationVacationDraft({ start: '', end: '', label: '' });
  }, [businessListForForms, reservationAdminBusinessId]);

  const handleLogin = async (credentials) => {
    setAuthLoading(true);
    try {
      const data = await fetchJson('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setToken(data.token);
      localStorage.setItem('token', data.token);
      const user = data.admin ? { ...data.admin, role: 'admin' } : data.user;
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      if (user?.tenantId) {
        setSelectedTenantId(String(user.tenantId));
        localStorage.setItem('tenantId', String(user.tenantId));
      }
      setAuthOpen(false);
      notify('success', 'Sesión iniciada');
      loadTenantInfo();
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setAuthLoading(true);
    try {
      await fetchJson('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      notify('success', 'Usuario creado, ahora inicia sesión');
      setAuthOpen(true);
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    setMyPublications([]);
    setEditingPublicationId(null);
    resetPublicationForm();
    setTenantInfo(null);
    setSelectedTenantId('');
    notify('info', 'Sesión cerrada');
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const data = await fetchJson('/tenants', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(tenantForm),
      });
      setTenantInfo(data.tenant);
      setSelectedTenantId(String(data.tenant.id));
      localStorage.setItem('tenantId', String(data.tenant.id));
      setTenantForm({ nombre: '', dominio: '' });
      notify('success', 'Tenant creado');
      setCreateOpen(false);
      loadPublicTenants();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const tenantId = categoryForm.tenantId || selectedTenantId || tenantInfo?.id;
    if (!tenantId) return notify('danger', 'Selecciona un tenant antes de crear categorías');
    try {
      await fetchJson('/categories', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...categoryForm, tenantId }),
      });
      notify('success', 'Categoría creada');
      setCategoryForm({ name: '', type: '', tenantId: '' });
      loadCategories();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...businessForm,
        description: businessForm.description || null,
        address: businessForm.address || null,
        city: businessForm.city || null,
        region: businessForm.region || null,
        phone: businessForm.phone || null,
        amenities: Array.isArray(businessForm.amenities) ? businessForm.amenities : [],
      };
      const data = await fetchJson('/businesses', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const tenantIdFromResponse = data?.tenant?.id ? String(data.tenant.id) : null;
      if (tenantIdFromResponse) {
        setTenantInfo(data.tenant);
        setSelectedTenantId(tenantIdFromResponse);
        localStorage.setItem('tenantId', tenantIdFromResponse);
        if (currentUser) {
          const updatedUser = { ...currentUser, tenantId: data.tenant.id };
          setCurrentUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
      notify('success', 'Negocio creado');
      setBusinessForm({
        name: '',
        type: 'RESTAURANTE',
        description: '',
        address: '',
        city: '',
        region: '',
        amenities: [],
        phone: '',
      });
      if (!tenantIdFromResponse || tenantIdFromResponse === selectedTenantId) {
        loadBusinesses();
      }
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleEditPublication = (publication) => {
    setEditingPublicationId(publication.id);
    const firstCategoryId =
      (publication.categoryIds && publication.categoryIds.length ? publication.categoryIds[0] : null) ||
      (publication.categories || []).map((c) => c?.id || c).find(Boolean) ||
      '';
    const firstCategoryType = (publication.categories || []).map((c) => c?.type).find(Boolean) || '';
    setPublicationForm({
      titulo: publication.titulo || '',
      contenido: publication.contenido || '',
      tipo: publication.tipo || 'AVISO_GENERAL',
      fechaFinVigencia: publication.fechaFinVigencia ? String(publication.fechaFinVigencia).slice(0, 10) : '',
      categoryIds: firstCategoryId ? [String(firstCategoryId)] : [],
      categoryTypes: firstCategoryType ? [firstCategoryType] : [],
      businessId: publication.businessId || publication.business?.id || '',
      mediaUrl: publication.coverUrl || '',
      mediaType: publication.coverType || detectMediaTypeFromUrl(publication.coverUrl || ''),
      precio: publication.precio === null || publication.precio === undefined ? '' : publication.precio,
      extras: Array.isArray(publication.extras) ? publication.extras : [],
    });
    setCreateDialogTab('publicacion');
    setCreateOpen(true);
  };

  const handleDeletePublication = async (publicationId) => {
    const confirmed = window.confirm('¿Eliminar esta publicación?');
    if (!confirmed) return;
    try {
      await fetchJson(`/publications/${publicationId}`, { method: 'DELETE', headers: authHeaders });
      notify('success', 'Publicación eliminada');
      loadFeed();
      loadMyPublications();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleCreatePublication = async (e) => {
    e.preventDefault();
    const businessId = activePublicationBusinessId;
    if (!businessId) return notify('danger', 'Selecciona un negocio para publicar');
    const rawPrice = publicationForm.precio;
    const parsedPrice = Number(rawPrice);
    if (rawPrice === '' || rawPrice === null || rawPrice === undefined) {
      return notify('danger', 'El precio es obligatorio');
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return notify('danger', 'El precio debe ser un número válido');
    }
    const isEditing = Boolean(editingPublicationId);
    const businessForPublication =
      businessListForForms.find((b) => String(b.id) === String(businessId)) || selectedBusinessForPublication;
    const tenantForCategories =
      businessForPublication?.tenantId || selectedTenantId || tenantInfo?.id || currentUser?.tenantId || null;
    const selectedCategoryType = (publicationForm.categoryTypes || [])[0] || '';
    let categoryIdsToSend = (publicationForm.categoryIds || []).slice(0, 1);
    if (!selectedCategoryType && !categoryIdsToSend.length) {
      return notify('danger', 'Selecciona una categoría para esta publicación');
    }
    if (selectedCategoryType) {
      if (!tenantForCategories) return notify('danger', 'No se pudo determinar el tenant para las categorías');
      try {
        const existing = categories.find(
          (c) => c.type === selectedCategoryType && String(c.tenantId) === String(tenantForCategories)
        );
        if (existing) {
          categoryIdsToSend = [String(existing.id)];
        } else {
          const name = humanizeCategoryType(selectedCategoryType);
          try {
            const created = await fetchJson('/categories', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({ name, type: selectedCategoryType, tenantId: tenantForCategories }),
            });
            categoryIdsToSend = [String(created.id)];
          } catch (err) {
            // Si ya existe, recarga y busca de nuevo
            const refreshed = await loadCategories(tenantForCategories);
            const found = refreshed.find(
              (c) => c.type === selectedCategoryType && String(c.tenantId) === String(tenantForCategories)
            );
            if (found) categoryIdsToSend = [String(found.id)];
            else throw err;
          }
        }
        await loadCategories(tenantForCategories);
      } catch (err) {
        notify('danger', err.message);
        return;
      }
    }
    const extrasNormalized = [];
    const extrasSource = Array.isArray(publicationForm.extras) ? publicationForm.extras : [];
    for (const extra of extrasSource) {
      const nombre = String(extra?.nombre || '').trim();
      const precioRaw = extra?.precio;
      const precio =
        precioRaw === undefined || precioRaw === null || precioRaw === '' ? null : Number(precioRaw);
      const imagenUrl = String(extra?.imagenUrl || '').trim();
      if (!nombre && precio === null && !imagenUrl) continue;
      if (!nombre) {
        notify('warning', 'Cada agregado debe tener un nombre.');
        return;
      }
      if (precio === null || !Number.isFinite(precio) || precio < 0) {
        notify('warning', 'Cada agregado debe tener un precio válido.');
        return;
      }
      extrasNormalized.push({
        nombre,
        precio,
        imagenUrl: imagenUrl || null,
      });
    }
    if (extrasNormalized.length > PUBLICATION_EXTRAS_LIMIT) {
      notify('warning', 'Solo puedes agregar hasta 3 adicionales.');
      return;
    }
    try {
      await fetchJson(isEditing ? `/publications/${editingPublicationId}` : `/businesses/${businessId}/publications`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          titulo: publicationForm.titulo,
          contenido: publicationForm.contenido,
          tipo: publicationForm.tipo,
          businessId,
          categoryIds: categoryIdsToSend,
          fechaFinVigencia: publicationForm.fechaFinVigencia || undefined,
          mediaUrl: publicationForm.mediaUrl || undefined,
          mediaType: publicationForm.mediaType,
          precio: parsedPrice,
          extras: extrasNormalized,
        }),
      });
      notify('success', isEditing ? 'Publicación actualizada' : 'Publicación creada y enviada a validación');
      resetPublicationForm();
      setCreateOpen(false);
      loadFeed();
      loadMyPublications();
      loadAdminQueues();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleSaveBusinessProfile = async (e) => {
    e?.preventDefault?.();
    if (!profileBusinessId) return notify('danger', 'Selecciona un negocio para editar su perfil');
    try {
      await fetchJson(`/businesses/${profileBusinessId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: businessProfileForm.name,
          description: businessProfileForm.description,
          imageUrl: businessProfileForm.imageUrl || null,
          phone: businessProfileForm.phone || null,
          address: businessProfileForm.address,
          city: businessProfileForm.city,
          region: businessProfileForm.region,
          amenities: Array.isArray(businessProfileForm.amenities) ? businessProfileForm.amenities : [],
        }),
      });
      notify('success', 'Perfil de negocio actualizado');
      loadBusinesses();
      loadFeed();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleApprovePublication = async (id, approve = true) => {
    try {
      const endpoint = approve ? `/admin/publications/${id}/approve` : `/admin/publications/${id}/reject`;
      const body = approve ? undefined : JSON.stringify({ comentarios: window.prompt('Motivo del rechazo') || '' });
      await fetchJson(endpoint, {
        method: 'POST',
        headers: authHeaders,
        body,
      });
      notify('success', `Publicación ${approve ? 'aprobada' : 'rechazada'}`);
      loadAdminQueues();
      loadFeed();
    } catch (err) {
      notify('danger', err.message);
    }
  };

  const handleRegisterVisit = async (publication) => {
    const tenantForVisit = publication?.business?.tenantId || selectedTenantId;
    if (!publication?.id || !tenantForVisit || publication.estado !== 'PUBLICADA') return;
    try {
      const publicationId = String(publication.id);
      const currentVisits = getVisitsValue(publication);
      const optimisticVisits = currentVisits + 1;
      applyVisitsUpdate(publicationId, optimisticVisits);
      const data = await fetchJson(`/publications/${publication.id}/visit?tenantId=${tenantForVisit}`, { method: 'POST' });
      const serverVisits = Number(data?.visitas ?? data?.visits ?? data?.visitCount);
      if (Number.isFinite(serverVisits)) {
        applyVisitsUpdate(publicationId, serverVisits);
      }
    } catch {
      // silencioso
    }
  };

  const ensureClientAccess = () => {
    if (!currentUser) {
      notify('warning', 'Para comentar primero debes registrarte como cliente.');
      setAuthOpen(true);
      return false;
    }
    if (currentUser.rol !== 'CLIENTE') {
      notify('warning', 'Para comentar primero debes registrarte como cliente.');
      return false;
    }
    return true;
  };

  const loadPublicationComments = async (publicationId, { force = false } = {}) => {
    if (!publicationId) return;
    const key = String(publicationId);
    if (!force && commentsByPublication[key]) return;
    setCommentsLoadingByPublication((prev) => ({ ...prev, [key]: true }));
    try {
      const data = await fetchJson(`/publications/${key}/comments`, { headers: authHeaders });
      const list = Array.isArray(data?.comments) ? data.comments : Array.isArray(data) ? data : [];
      setCommentsByPublication((prev) => ({ ...prev, [key]: list }));
      return list;
    } catch (err) {
      notify('danger', err.message);
      return [];
    } finally {
      setCommentsLoadingByPublication((prev) => ({ ...prev, [key]: false }));
    }
  };

  const resolvePublicationTitle = (publicationId) => {
    const targetId = String(publicationId);
    if (selectedPublication && String(selectedPublication.id) === targetId) {
      return selectedPublication.titulo || selectedPublication.title || 'Publicación';
    }
    const sources = [
      ...(Array.isArray(feed) ? feed : []),
      ...(Array.isArray(businessProfilePublications) ? businessProfilePublications : []),
      ...(Array.isArray(myPublications) ? myPublications : []),
    ];
    const found = sources.find((item) => String(item?.id) === targetId);
    return found?.titulo || found?.title || 'Publicación';
  };

  const trackClientComment = (comment, publicationId) => {
    if (!comment || !currentUser?.id || currentUser.rol !== 'CLIENTE') return;
    const key = String(currentUser.id);
    const entry = {
      id: comment.id,
      publicationId: String(publicationId),
      publicationTitle: resolvePublicationTitle(publicationId),
      content: comment.contenido,
      createdAt: comment.fechaCreacion || new Date().toISOString(),
      replyCount: 0,
    };
    setClientCommentsByUser((prev) => {
      const currentList = Array.isArray(prev?.[key]) ? prev[key] : [];
      if (currentList.some((item) => String(item.id) === String(entry.id))) {
        return prev;
      }
      return { ...prev, [key]: [entry, ...currentList] };
    });
  };

  const refreshClientCommentReplies = async () => {
    if (!currentUser?.id) return;
    const key = String(currentUser.id);
    const list = Array.isArray(clientCommentsByUser?.[key]) ? clientCommentsByUser[key] : [];
    if (!list.length) return;
    const publicationIds = Array.from(new Set(list.map((item) => String(item.publicationId))));
    if (!publicationIds.length) return;
    setClientCommentsRefreshing(true);
    try {
      const results = await Promise.all(
        publicationIds.map((publicationId) => loadPublicationComments(publicationId, { force: true }))
      );
      const byPublication = publicationIds.reduce((acc, publicationId, index) => {
        acc[publicationId] = Array.isArray(results[index]) ? results[index] : [];
        return acc;
      }, {});
      setClientCommentsByUser((prev) => {
        const current = Array.isArray(prev?.[key]) ? prev[key] : [];
        const updated = current.map((item) => {
          const comments = byPublication[String(item.publicationId)] || [];
          const replies = comments.filter((comment) => String(comment.parentId) === String(item.id));
          return {
            ...item,
            replyCount: replies.length,
            lastReplyAt: replies.length ? replies[replies.length - 1]?.fechaCreacion : item.lastReplyAt,
          };
        });
        return { ...prev, [key]: updated };
      });
    } finally {
      setClientCommentsRefreshing(false);
    }
  };

  const handleSubmitComment = async ({ publicationId, contenido, parentId }) => {
    if (!publicationId || !currentUser || currentUser.rol !== 'CLIENTE') return false;
    if (!contenido || !contenido.trim()) return false;
    if (commentSubmitting) return false;
    setCommentSubmitting(true);
    try {
      const payload = { contenido: contenido.trim(), parentId: parentId || null };
      const data = await fetchJson(`/publications/${publicationId}/comments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const comment = data?.comment || null;
      if (comment) {
        const key = String(publicationId);
        setCommentsByPublication((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), comment],
        }));
        trackClientComment(comment, publicationId);
      } else {
        await loadPublicationComments(publicationId, { force: true });
      }
      return true;
    } catch (err) {
      notify('danger', err.message);
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSubmitRating = async ({ publicationId, contenido, calificacion }) => {
    if (!publicationId || !currentUser || currentUser.rol !== 'CLIENTE') return false;
    if (!contenido || !contenido.trim()) return false;
    const ratingValue = Number(calificacion);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) return false;
    if (ratingSubmitting) return false;
    setRatingSubmitting(true);
    try {
      const payload = { contenido: contenido.trim(), calificacion: Math.floor(ratingValue) };
      const data = await fetchJson(`/publications/${publicationId}/ratings`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const comment = data?.comment || null;
      if (comment) {
        const key = String(publicationId);
        setCommentsByPublication((prev) => {
          const current = prev[key] || [];
          if (current.some((entry) => String(entry.id) === String(comment.id))) return prev;
          return { ...prev, [key]: [...current, comment] };
        });
      } else {
        await loadPublicationComments(publicationId, { force: true });
      }

      const summary = data?.ratingSummary || null;
      if (summary) {
        applyRatingUpdate(String(publicationId), summary.ratingAverage, summary.ratingCount, data?.userRating ?? ratingValue);
      } else {
        applyRatingUpdate(String(publicationId), null, null, data?.userRating ?? ratingValue);
      }
      return true;
    } catch (err) {
      notify('danger', err.message);
      return false;
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSelectPublication = (publication) => {
    if (!publication) return;
    setSelectedPublication(publication);
    setSimilarSource(publication);
    const similarList = findSimilarPublications(publication);
    setSimilarItems(similarList);
    setHasNewSimilar(similarList.length > 0);
  };

  const handleViewBusinessProfile = async (payload) => {
    const businessId = payload?.id || payload?.businessId;
    if (!businessId) return notify('danger', 'No se pudo abrir el negocio');
    const tenantId = payload?.tenantId || selectedTenantId || currentUser?.tenantId || '';
    setSelectedPublication(null);
    setBusinessProfile(payload || null);
    setBusinessProfilePublications([]);
    setLoadingBusinessProfile(true);
    try {
      const params = new URLSearchParams();
      if (tenantId) params.set('tenantId', tenantId);
      const query = params.toString();
      const detail = await fetchJson(`/businesses/${businessId}${query ? `?${query}` : ''}`, { headers: authHeaders });
      setBusinessProfile(detail);
      const publications = await fetchJson(`/businesses/${businessId}/publications${query ? `?${query}` : ''}`, {
        headers: authHeaders,
      });
      setBusinessProfilePublications(publications);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      notify('danger', err.message);
    } finally {
      setLoadingBusinessProfile(false);
    }
  };

  const handleOpenNotifications = () => {
    setNotificationsOpen(true);
    setHasNewSimilar(false);
  };

  const handleSelectFromNotifications = (publication) => {
    if (!publication) return;
    setNotificationsOpen(false);
    handleSelectPublication(publication);
  };

  const decoratePublicationList = (items = []) =>
    items.map((item, idx) => {
      const fallbackCover = placeholderImages[(Number(item.id) || idx) % placeholderImages.length];
      const coverUrl = item.coverUrl || fallbackCover;
      const coverType = item.coverType || detectMediaTypeFromUrl(item.coverUrl || '');
      const precio =
        item.precio === null || item.precio === undefined
          ? null
          : Number.isFinite(Number(item.precio))
          ? Number(item.precio)
          : null;
      const rawCategories =
        item.categories && item.categories.length
          ? item.categories
          : (item.categoryIds || []).map(
              (cid) => categories.find((c) => String(c.id) === String(cid)) || { id: cid, name: cid }
            );
      const normalizedCategories = rawCategories.map((cat) => normalizeCategory(cat, categories)).filter(Boolean);
      return {
        ...item,
        coverUrl,
        coverType,
        precio,
        categories: normalizedCategories,
        categoryIds: item.categoryIds || normalizedCategories.map((c) => c.id),
        business: item.business || businesses.find((b) => b.id === item.businessId),
      };
    });

  const businessProfileDecorated = useMemo(() => {
    if (!businessProfilePublications.length) return [];
    const enriched = businessProfilePublications.map((item) => ({
      ...item,
      business: item.business || businessProfile,
    }));
    return decoratePublicationList(enriched);
  }, [businessProfilePublications, businessProfile, categories, businesses]);

  const normalizedSearch = useMemo(() => normalizeSearchValue(filters.search), [filters.search]);

  const businessProfileFiltered = useMemo(() => {
    if (!normalizedSearch) return businessProfileDecorated;
    return businessProfileDecorated.filter((pub) => {
      const categoryValues = (pub.categories || []).flatMap((cat) => [
        cat?.name,
        cat?.type,
        cat?.slug,
        cat?.id,
      ]);
      const searchable = [
        pub.titulo,
        pub.contenido,
        pub.business?.name,
        pub.authorName,
        ...categoryValues,
      ]
        .filter(Boolean)
        .map((value) => normalizeSearchValue(value));
      return searchable.some((value) => value.includes(normalizedSearch));
    });
  }, [businessProfileDecorated, normalizedSearch]);

  const feedWithDecorations = useMemo(
    () => decoratePublicationList(feed),
    [feed, categories, businesses]
  );

  const adsWithDecorations = useMemo(
    () => decoratePublicationList(adPublications),
    [adPublications, categories, businesses]
  );

  const adminAdsWithDecorations = useMemo(() => {
    const decorated = decoratePublicationList(adminAdPublications);
    return decorated.sort((a, b) => Number(Boolean(b.esPublicidad)) - Number(Boolean(a.esPublicidad)));
  }, [adminAdPublications, categories, businesses]);

  const derivedCategories = useMemo(() => {
    const map = new Map();
    feedWithDecorations.forEach((pub) => {
      (pub.categories || []).forEach((cat) => {
        const normalized = normalizeCategory(cat, categories);
        if (!normalized) return;
        const labelKey = String(normalized.name || normalized.type || normalized.id || '').trim().toLowerCase();
        if (!labelKey) return;
        const existing = map.get(labelKey) || { ...normalized, id: normalized.id, ids: new Set() };
        if (normalized.id) existing.ids.add(String(normalized.id));
        map.set(labelKey, existing);
      });
    });
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      ids: Array.from(entry.ids || []),
    }));
  }, [feedWithDecorations, categories]);

  const resolveCategoryIdsForFilter = (selectedId) => {
    const target = String(selectedId || '').trim();
    if (!target) return [];
    const normalizeKey = (cat) => String(cat?.name || cat?.type || cat?.id || '').trim().toLowerCase();
    const sources = [
      ...categories,
      ...derivedCategories.map((c) => ({
        ...c,
        ids: Array.isArray(c.ids) ? c.ids : [],
      })),
    ];
    const matched = sources.find((cat) => String(cat.id) === target || (cat.ids || []).some((id) => String(id) === target));
    const key = matched ? normalizeKey(matched) : normalizeKey({ id: target });
    const ids = sources
      .filter((cat) => normalizeKey(cat) === key)
      .flatMap((cat) => {
        const collected = [];
        if (cat.id) collected.push(cat.id);
        if (Array.isArray(cat.ids)) collected.push(...cat.ids);
        return collected;
      })
      .filter(Boolean)
      .map(String);
    return Array.from(new Set(ids.length ? ids : [target]));
  };

  const getVisitsValue = (pub) => {
    const value = pub?.visitas ?? pub?.visits ?? pub?.visitCount ?? 0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getBaseHeartsValue = (pub) => {
    const value =
      pub?.corazones ??
      pub?.hearts ??
      pub?.likes ??
      pub?.likesCount ??
      pub?.meGusta ??
      pub?.favoritos ??
      pub?.favorites ??
      pub?.reactions ??
      0;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const getHeartsValue = (pub) => {
    if (!pub) return 0;
    return getBaseHeartsValue(pub);
  };

  const getPublicationLabel = (pub) => {
    const title = String(pub?.titulo || '').trim();
    if (title) return title;
    const businessName = String(pub?.business?.name || '').trim();
    if (businessName) return `Publicación de ${businessName}`;
    const fallbackId = pub?.id ? `#${pub.id}` : 'sin id';
    return `Publicación ${fallbackId}`;
  };

  const buildTopStats = (items, valueAccessor, limit = 5) => {
    const entries = (items || []).map((pub, index) => {
      const value = valueAccessor(pub);
      return {
        id: pub?.id ?? `pub-${index}`,
        label: getPublicationLabel(pub),
        value: Number.isFinite(value) ? value : 0,
      };
    });
    const sorted = [...entries].sort((a, b) => b.value - a.value).slice(0, limit);
    const maxValue = sorted.reduce((max, item) => Math.max(max, item.value), 0);
    const bars = sorted.map((item) => ({
      ...item,
      percent: maxValue > 0 ? Math.round((item.value / maxValue) * 100) : 0,
    }));
    return { bars, maxValue };
  };

  const hasLikedInSession = (pub) => {
    const key = pub?.id ? String(pub.id) : '';
    return key ? Boolean(likedById[key]) : false;
  };

  const updatePublicationLikes = (items, publicationId, nextLikes) => {
    if (!Array.isArray(items) || !items.length) return items;
    const normalized = Math.max(0, Math.floor(Number(nextLikes) || 0));
    let changed = false;
    const updated = items.map((item) => {
      if (String(item.id) !== publicationId) return item;
      const current = getBaseHeartsValue(item);
      if (current === normalized) return item;
      changed = true;
      return { ...item, likes: normalized };
    });
    return changed ? updated : items;
  };

  const updatePublicationVisits = (items, publicationId, nextVisits) => {
    if (!Array.isArray(items) || !items.length) return items;
    const normalized = Math.max(0, Math.floor(Number(nextVisits) || 0));
    let changed = false;
    const updated = items.map((item) => {
      if (String(item.id) !== publicationId) return item;
      const current = getVisitsValue(item);
      if (current === normalized) return item;
      changed = true;
      return { ...item, visitas: normalized };
    });
    return changed ? updated : items;
  };

  const normalizeRatingAverage = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return Math.max(1, Math.min(5, num));
  };

  const normalizeRatingCount = (value) => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
  };

  const updatePublicationRatings = (items, publicationId, ratingAverage, ratingCount, userRating) => {
    if (!Array.isArray(items) || !items.length) return items;
    let changed = false;
    const updated = items.map((item) => {
      if (String(item.id) !== publicationId) return item;
      changed = true;
      const next = { ...item };
      if (ratingAverage !== undefined) next.ratingAverage = ratingAverage;
      if (ratingCount !== undefined) next.ratingCount = ratingCount;
      if (userRating !== undefined) next.userRating = userRating;
      return next;
    });
    return changed ? updated : items;
  };

  const applyLikesUpdate = (publicationId, nextLikes) => {
    const normalized = Math.max(0, Math.floor(Number(nextLikes) || 0));
    setFeed((prev) => {
      const updated = updatePublicationLikes(prev, publicationId, normalized);
      if (updated !== prev) syncFeedCache(updated);
      return updated;
    });
    setMyPublications((prev) => updatePublicationLikes(prev, publicationId, normalized));
    setSelectedPublication((prev) => {
      if (!prev || String(prev.id) !== publicationId) return prev;
      return { ...prev, likes: normalized };
    });
  };

  const applyVisitsUpdate = (publicationId, nextVisits) => {
    const normalized = Math.max(0, Math.floor(Number(nextVisits) || 0));
    setFeed((prev) => {
      const updated = updatePublicationVisits(prev, publicationId, normalized);
      if (updated !== prev) syncFeedCache(updated);
      return updated;
    });
    setMyPublications((prev) => updatePublicationVisits(prev, publicationId, normalized));
    setSelectedPublication((prev) => {
      if (!prev || String(prev.id) !== publicationId) return prev;
      return { ...prev, visitas: normalized };
    });
  };

  const applyRatingUpdate = (publicationId, ratingAverage, ratingCount, userRating) => {
    const normalizedAverage = normalizeRatingAverage(ratingAverage);
    const normalizedCount = normalizeRatingCount(ratingCount);
    setFeed((prev) => {
      const updated = updatePublicationRatings(prev, publicationId, normalizedAverage, normalizedCount, userRating);
      if (updated !== prev) syncFeedCache(updated);
      return updated;
    });
    setMyPublications((prev) => updatePublicationRatings(prev, publicationId, normalizedAverage, normalizedCount, userRating));
    setBusinessProfilePublications((prev) =>
      updatePublicationRatings(prev, publicationId, normalizedAverage, normalizedCount, userRating)
    );
    setAdminAdPublications((prev) => updatePublicationRatings(prev, publicationId, normalizedAverage, normalizedCount, userRating));
    setSelectedPublication((prev) => {
      if (!prev || String(prev.id) !== publicationId) return prev;
      return {
        ...prev,
        ratingAverage: normalizedAverage,
        ratingCount: normalizedCount,
        userRating: userRating ?? prev.userRating,
      };
    });
  };

  const handleLike = async (publication) => {
    const id = publication?.id;
    const tenantForLike = publication?.business?.tenantId || selectedTenantId;
    if (!id || !tenantForLike || publication.estado !== 'PUBLICADA') return;
    const key = String(id);
    if (likedById[key]) return;
    const currentLikes = getHeartsValue(publication);
    const optimisticLikes = currentLikes + 1;
    setLikedById((prev) => ({ ...prev, [key]: true }));
    applyLikesUpdate(key, optimisticLikes);
    try {
      const data = await fetchJson(`/publications/${id}/like?tenantId=${tenantForLike}`, { method: 'POST' });
      const serverLikes = Number(data?.likes);
      if (Number.isFinite(serverLikes)) {
        applyLikesUpdate(key, serverLikes);
      } else {
        loadFeed();
      }
    } catch (err) {
      setLikedById((prev) => {
        if (!prev[key]) return prev;
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
      applyLikesUpdate(key, currentLikes);
      notify('danger', err.message);
    }
  };

  const handleSavePublication = (publication) => {
    if (!publication?.id) return;
    if (!currentUser || currentUser.rol !== 'CLIENTE') {
      notify('warning', 'Debes iniciar sesión como cliente para guardar publicaciones.');
      return;
    }
    const userKey = String(currentUser.id);
    const publicationId = String(publication.id);
    const isAlreadySaved = savedPublicationIdSet.has(publicationId);
    setSavedPublicationsByUser((prev) => {
      const current = Array.isArray(prev?.[userKey]) ? prev[userKey].map((id) => String(id)) : [];
      const next = isAlreadySaved
        ? current.filter((id) => id !== publicationId)
        : Array.from(new Set([...current, publicationId]));
      return { ...prev, [userKey]: next };
    });
    notify('success', isAlreadySaved ? 'Publicación quitada de guardados.' : 'Publicación guardada.');
  };

  const extractCategoryKeys = (pub) => {
    if (!pub) return [];
    const keys = new Set();
    const baseCategories =
      (pub.categories && pub.categories.length
        ? pub.categories
        : (pub.categoryIds || []).map((cid) => ({ id: cid }))
      ) || [];
    const categoriesWithTypes =
      Array.isArray(pub.categoryTypes) && pub.categoryTypes.length
        ? [...baseCategories, ...pub.categoryTypes.map((type) => ({ id: type, type, name: type, slug: type }))]
        : baseCategories;
    categoriesWithTypes.forEach((cat) => {
      const normalized = normalizeCategory(cat, categories);
      if (!normalized) return;
      [normalized.id, normalized.slug, normalized.type, normalized.name].forEach((val) => {
        const key = String(val || '').trim().toLowerCase();
        if (key) keys.add(key);
      });
    });
    (pub.categoryIds || []).forEach((cid) => {
      const key = String(cid || '').trim().toLowerCase();
      if (key) keys.add(key);
    });
    return Array.from(keys);
  };

  const findSimilarPublications = (publication) => {
    if (!publication) return [];
    const targetKeys = extractCategoryKeys(publication);
    if (!targetKeys.length) return [];
    const targetSet = new Set(targetKeys);
    return feedWithDecorations
      .filter((item) => String(item.id) !== String(publication.id))
      .filter((item) => {
        const itemKeys = extractCategoryKeys(item);
        return itemKeys.some((key) => targetSet.has(key));
      })
      .sort((a, b) => getVisitsValue(b) - getVisitsValue(a))
      .slice(0, 6);
  };

  const businessTypeOptions = useMemo(() => {
    const types = new Set(defaultBusinessTypes);
    feedWithDecorations.forEach((pub) => {
      if (pub.business?.type) types.add(String(pub.business.type).toUpperCase());
    });
    businesses.forEach((b) => {
      if (b.type) types.add(String(b.type).toUpperCase());
    });
    return Array.from(types);
  }, [feedWithDecorations, businesses]);

  const categoryFilterOptions = useMemo(() => {
    const normalizeKey = (value) => String(value || '').trim().toLowerCase();
    const readTypeValue = (entry) => {
      if (!entry) return '';
      if (typeof entry === 'object') {
        return entry.type || entry.name || entry.id || '';
      }
      return entry;
    };

    const businessTypeKey = String(filters.businessType || '').trim().toUpperCase();
    const mappedTypes = businessTypeKey && categoriesByBusinessType[businessTypeKey]
      ? categoriesByBusinessType[businessTypeKey]
      : null;
    const baseTypes = mappedTypes?.length ? mappedTypes : categoryTypes.length ? categoryTypes : defaultCategoryTypes;

    let typeValues = baseTypes
      .map((entry) => readTypeValue(entry))
      .filter(Boolean)
      .map((value) => String(value));

    if (!typeValues.length && categories.length) {
      typeValues = categories
        .map((cat) => cat?.type || cat?.name || cat?.id)
        .filter(Boolean)
        .map((value) => String(value));
    }

    const categoriesByKey = new Map();
    categories.forEach((cat) => {
      const key = normalizeKey(cat?.type || cat?.name || cat?.id);
      if (!key || categoriesByKey.has(key)) return;
      categoriesByKey.set(key, cat);
    });

    const seen = new Set();
    return typeValues
      .filter((value) => {
        const key = normalizeKey(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((value) => {
        const key = normalizeKey(value);
        const existing = categoriesByKey.get(key) || null;
        return {
          ...(existing || {}),
          id: String(value),
          name: existing?.name || humanizeCategoryType(value),
          type: existing?.type || String(value),
        };
      });
  }, [filters.businessType, categoryTypes, categories]);

  const filteredPublicFeed = useMemo(() => {
    let list = feedWithDecorations;
    const categoryIdsToMatch = resolveCategoryIdsForFilter(filters.categoryId);
    if (categoryIdsToMatch.length) {
      const targets = categoryIdsToMatch.map(String);
      list = list.filter((pub) => {
        const catIds = (pub.categoryIds || []).map(String);
        return catIds.some((id) => targets.includes(id));
      });
    }
    if (filters.businessType) {
      const target = String(filters.businessType).toUpperCase();
      list = list.filter((pub) => String(pub.business?.type || '').toUpperCase() === target);
    }
    if (filters.region) {
      const target = normalizeLocationValue(filters.region);
      list = list.filter((pub) => normalizeLocationValue(pub.business?.region) === target);
    }
    if (filters.city) {
      const target = normalizeLocationValue(filters.city);
      list = list.filter((pub) => normalizeLocationValue(pub.business?.city) === target);
    }
    const selectedAmenities = Array.isArray(filters.amenities)
      ? filters.amenities.map(normalizeAmenityValue).filter(Boolean)
      : [];
    if (selectedAmenities.length) {
      list = list.filter((pub) => {
        const businessAmenities = Array.isArray(pub.business?.amenities) ? pub.business.amenities : [];
        const normalizedAmenities = businessAmenities.map(normalizeAmenityValue);
        return selectedAmenities.every((amenity) => normalizedAmenities.includes(amenity));
      });
    }
    const sortBy = topHeartsMode ? 'hearts' : filters.sortBy;
    const sortDir = topHeartsMode ? 'desc' : filters.sortDir;
    const sorted = [...list];
    if (sortBy === 'visits') {
      sorted.sort((a, b) => {
        const diff = getVisitsValue(b) - getVisitsValue(a);
        return sortDir === 'asc' ? -diff : diff;
      });
    } else if (sortBy === 'hearts') {
      sorted.sort((a, b) => {
        const diff = getHeartsValue(b) - getHeartsValue(a);
        return sortDir === 'asc' ? -diff : diff;
      });
    }
    return topHeartsMode ? sorted.slice(0, 100) : sorted;
  }, [feedWithDecorations, filters, derivedCategories, categories, topHeartsMode]);

  const feedFilterKey = useMemo(
    () =>
      JSON.stringify({
        search: filters.search || '',
        categoryId: filters.categoryId || '',
        businessType: filters.businessType || '',
        region: filters.region || '',
        city: filters.city || '',
        amenities: Array.isArray(filters.amenities) ? filters.amenities.slice().sort() : [],
        sortBy: filters.sortBy || '',
        sortDir: filters.sortDir || '',
        topHeartsMode,
      }),
    [filters, topHeartsMode]
  );

  useEffect(() => {
    setFeedVisibleCount(FEED_PAGE_INITIAL);
  }, [feedFilterKey, feedWithDecorations.length]);

  const visiblePublicFeed = useMemo(
    () => filteredPublicFeed.slice(0, Math.max(FEED_PAGE_INITIAL, feedVisibleCount)),
    [filteredPublicFeed, feedVisibleCount]
  );
  const canLoadMoreFeed = filteredPublicFeed.length > visiblePublicFeed.length;

  useEffect(() => {
    if (!similarSource) return;
    const updated = findSimilarPublications(similarSource);
    setSimilarItems(updated);
    if (!updated.length) {
      setHasNewSimilar(false);
    }
  }, [feedWithDecorations, similarSource]);

  const selectedCategoryType = (publicationForm.categoryTypes || [])[0] || '';
  const panelPublications = useMemo(() => {
    if (isAdmin) return feedWithDecorations;
    if (currentUser?.rol === 'OFERENTE') return myPublications;
    return [];
  }, [isAdmin, feedWithDecorations, myPublications, currentUser]);
  const statsSummary = useMemo(() => {
    const totalPublications = panelPublications.length;
    const totalVisits = panelPublications.reduce((sum, pub) => sum + getVisitsValue(pub), 0);
    const totalLikes = panelPublications.reduce((sum, pub) => sum + getHeartsValue(pub), 0);
    const topVisits = buildTopStats(panelPublications, getVisitsValue);
    const topLikes = buildTopStats(panelPublications, getHeartsValue);
    return { totalPublications, totalVisits, totalLikes, topVisits, topLikes };
  }, [panelPublications]);
  const businessLogoValue = typeof businessProfileForm.imageUrl === 'string' ? businessProfileForm.imageUrl : '';
  const hasBusinessLogo = Boolean(businessLogoValue);
  const selectedBusinessLogoUrl = (() => {
    const businessId = selectedPublication?.business?.id ?? selectedPublication?.businessId;
    if (!businessId) return '';
    if (selectedPublication?.business?.imageUrl) return selectedPublication.business.imageUrl;
    const match = businesses.find((b) => String(b.id) === String(businessId));
    return match?.imageUrl || '';
  })();
  const businessFormCityOptions = buildCityOptions(businessForm.region, businessForm.city);
  const businessProfileCityOptions = buildCityOptions(businessProfileForm.region, businessProfileForm.city);
  const showBusinessProfile = Boolean(businessProfile) || loadingBusinessProfile;
  const businessProfileEmail =
    businessProfile?.contactEmail || businessProfile?.email || businessProfile?.ownerEmail || '';
  const businessProfilePhone = businessProfile?.phone || '';
  const businessProfileImage = businessProfile?.imageUrl || businessProfile?.logoUrl || '';
  const hasSimilarNotifications = similarItems.length > 0;
  const similarNotificationsLabel = hasSimilarNotifications ? (similarItems.length > 9 ? '9+' : similarItems.length) : null;
  const showFeedLoading = loadingFeed && feed.length === 0;
  const showAdsLoading = loadingAds && adsWithDecorations.length === 0;
  const selectedPublicationId = selectedPublication?.id ? String(selectedPublication.id) : null;
  const selectedPublicationComments = selectedPublicationId ? commentsByPublication[selectedPublicationId] || [] : [];
  const selectedPublicationCommentsLoading = selectedPublicationId
    ? Boolean(commentsLoadingByPublication[selectedPublicationId])
    : false;
  const reservationTotalSelectedSeats = reservationSelectedTables.reduce(
    (acc, table) => acc + (Number(table.seats) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        search={filters.search}
        onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        onExplore={() => setExploreOpen(true)}
        onReservations={openReservationDialog}
        onTopHearts={handleTopHearts}
        onNotifications={handleOpenNotifications}
        hasNotifications={hasNewSimilar}
        notificationsCount={similarItems.length}
        onCreate={openCreateDialog}
        onHome={handleHome}
        onAuth={() => setAuthOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className={cn('container px-4 py-6 space-y-6', showClientBottomNav && 'pb-24')}>
        {showBusinessProfile ? (
          <section className="space-y-6">
            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={resetBusinessProfileView}
                    aria-label="Volver al feed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <p className="text-sm text-muted-foreground">Perfil del negocio</p>
                    <h4 className="text-xl font-semibold">{businessProfile?.name || 'Negocio'}</h4>
                  </div>
                </div>
                {businessProfile?.type && (
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {businessProfile.type}
                  </span>
                )}
              </div>
              <div className="mt-6 flex flex-col items-center text-center">
                <Avatar
                  src={businessProfileImage}
                  alt={`Logo de ${businessProfile?.name || 'negocio'}`}
                  className="h-24 w-24"
                >
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(businessProfile?.name || 'N')[0]}
                  </AvatarFallback>
                </Avatar>
                <p className="mt-3 text-2xl font-bold">{businessProfile?.name || 'Negocio'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {businessProfile?.description || 'Sin descripción registrada.'}
                </p>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/30 text-center p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Correo</p>
                  <p className="mt-2 text-sm font-semibold">{businessProfileEmail || 'No disponible'}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 text-center p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
                  <p className="mt-2 text-sm font-semibold">{businessProfilePhone || 'No disponible'}</p>
                </div>
              </div>
            </div>

            <section className="rounded-2xl bg-card p-5 shadow-soft">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Publicaciones del negocio</p>
                  <h4 className="text-xl font-semibold">Todas las publicaciones</h4>
                </div>
                {loadingBusinessProfile && <p className="text-xs text-muted-foreground">Cargando publicaciones...</p>}
              </div>
              {loadingBusinessProfile ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  Cargando publicaciones...
                </div>
              ) : businessProfileFiltered.length ? (
                <MasonryGrid className="mt-4">
                  {businessProfileFiltered.map((pub) => (
                    <PinCard
                      key={pub.id}
                      publication={pub}
                      likesCount={getHeartsValue(pub)}
                      liked={hasLikedInSession(pub)}
                      onLike={handleLike}
                      onSelect={handleSelectPublication}
                    />
                  ))}
                </MasonryGrid>
              ) : businessProfileDecorated.length ? (
                <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  No hay publicaciones que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                  Este negocio aún no tiene publicaciones.
                </div>
              )}
            </section>
          </section>
        ) : (
          <>
            {shouldShowPublicFeed && (
              <div className="space-y-6">
                <section className="relative" ref={publicFeedRef}>
                  <div className="sr-only">Feed de publicaciones</div>
                  <div className={cn('flex flex-col gap-6 lg:flex-row lg:items-start', isAdPanelExpanded && 'lg:gap-4')}>
                    <div className={cn('min-w-0 flex-1', isAdPanelNarrow && !adPanelOpen && 'pr-20')}>
                {showFeedLoading ? (
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
                    Cargando feed...
                  </div>
                ) : filteredPublicFeed.length ? (
                  <>
                    <MasonryGrid className="mt-1">
                      {visiblePublicFeed.map((pub) => (
                        <PinCard
                          key={pub.id}
                          publication={pub}
                          likesCount={getHeartsValue(pub)}
                          liked={hasLikedInSession(pub)}
                          onLike={handleLike}
                          onSelect={handleSelectPublication}
                          compact={isAdPanelExpanded}
                        />
                      ))}
                    </MasonryGrid>
                    {canLoadMoreFeed && (
                      <div className="mt-6 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setFeedVisibleCount((prev) =>
                              Math.min(prev + FEED_PAGE_STEP, filteredPublicFeed.length)
                            )
                          }
                        >
                          Ver más
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    No hay publicaciones que coincidan con los filtros.
                  </div>
                )}
              </div>

              {!isAdPanelNarrow && adPanelOpen && (
                <div className="lg:basis-[320px] lg:min-w-[320px] lg:max-w-[320px] lg:shrink-0">
                  <AdPanel
                    open={adPanelOpen}
                    floating
                    publications={adsWithDecorations}
                    loading={showAdsLoading}
                    onToggle={toggleAdPanel}
                    onSelect={handleSelectPublication}
                  />
                </div>
              )}
            </div>

            {!adPanelOpen && !isAdPanelNarrow && (
              <Button
                variant="outline"
                size="icon"
                className="fixed right-4 top-20 z-40 h-11 w-11 rounded-full bg-card/95 shadow-soft backdrop-blur"
                onClick={toggleAdPanel}
                aria-label="Abrir espacio publicitario"
                title="Espacio publicitario"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {isAdPanelNarrow && !adPanelOpen && (
              <div className="fixed right-4 top-20 z-40 flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-card/95 shadow-soft backdrop-blur"
                  onClick={toggleAdPanel}
                  aria-label="Abrir espacio publicitario"
                  title="Espacio publicitario"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <AdRail
                  open
                  publications={adsWithDecorations}
                  loading={showAdsLoading}
                  onSelect={handleSelectPublication}
                />
              </div>
            )}

            {isAdPanelNarrow && adPanelOpen && (
              <AdPanel
                open={adPanelOpen}
                floating
                publications={adsWithDecorations}
                loading={showAdsLoading}
                onToggle={toggleAdPanel}
                onSelect={handleSelectPublication}
              />
            )}
            <button
              type="button"
              className={cn(
                'fixed right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-card/95 text-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 md:hidden',
                showClientBottomNav ? 'bottom-32' : 'bottom-20',
                hasNewSimilar && 'notification-attention bg-rose-100 text-rose-600'
              )}
              onClick={handleOpenNotifications}
              aria-label="Abrir notificaciones"
              title="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              {hasSimilarNotifications && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold leading-none text-white">
                  {similarNotificationsLabel}
                </span>
              )}
            </button>
            <button
              type="button"
              className={cn(
                'fixed right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/60',
                showClientBottomNav ? 'bottom-24' : 'bottom-6'
              )}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Volver arriba"
              title="Volver arriba"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </section>
        </div>
      )}
        {(isOferente || isAdmin) && (
          <section className="rounded-2xl bg-card p-5 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{isAdmin ? 'Panel del administrador' : 'Panel del oferente'}</p>
                <h4 className="text-xl font-semibold">Centro de gestión</h4>
                <p className="text-sm text-muted-foreground">
                  {isAdmin
                    ? 'Administra publicaciones, publicidad y validaciones en un solo lugar.'
                    : 'Actualiza tu perfil, publicaciones, catálogo y publicidad de forma clara.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openCreateDialog('negocio')} className="gap-2">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  Agregar negocio
                </Button>
                <Button variant="outline" onClick={() => openCreateDialog('publicacion')} className="gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Agregar alimentos
                </Button>
                {isAdmin && (
                  <Button variant="outline" onClick={loadAdminQueues} className="gap-2">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Actualizar pendientes
                  </Button>
                )}
              </div>
            </div>
            <Tabs value={adminPanelTab} onValueChange={setAdminPanelTab} className="mt-5">
              <TabsList
                className={cn(
                  'grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0',
                  isAdmin ? 'sm:grid-cols-4 xl:grid-cols-6' : 'sm:grid-cols-5 xl:grid-cols-5'
                )}
              >
                <TabsTrigger
                  value="perfil"
                  className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">Perfil</span>
                    <span className="text-xs text-muted-foreground">Datos del negocio</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="publicaciones"
                  className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">Publicaciones</span>
                    <span className="text-xs text-muted-foreground">Crear, editar y revisar</span>
                  </span>
                </TabsTrigger>
                {isOferente && !isAdmin && (
                  <TabsTrigger
                    value="publicidad"
                    className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                      <Megaphone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">Publicidad</span>
                      <span className="text-xs text-muted-foreground">Planes y visibilidad</span>
                    </span>
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="estadisticas"
                  className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                    <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">Estadísticas</span>
                    <span className="text-xs text-muted-foreground">Rendimiento y visitas</span>
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="reservas"
                  className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">Reservas</span>
                    <span className="text-xs text-muted-foreground">Mesas y disponibilidad</span>
                  </span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger
                    value="aprobaciones"
                    className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">Aprobaciones</span>
                      <span className="text-xs text-muted-foreground">
                        {adminQueues.publications.length} pendientes
                      </span>
                    </span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger
                    value="publicidad"
                    className="h-auto w-full items-start justify-start gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/60"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground shadow-soft">
                      <Megaphone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">Publicidad</span>
                      <span className="text-xs text-muted-foreground">Destacados del feed</span>
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="perfil" className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground shadow-soft">
                    <Building2 className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Perfil del negocio</p>
                    <h4 className="text-lg font-semibold">Actualiza la información visible</h4>
                  </div>
                </div>
                {businessListForForms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Aún no tienes negocios activos en este tenant.
                  </div>
                ) : (
                  <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSaveBusinessProfile}>
                    <div className="md:col-span-2">
                      <Label>Negocio</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={profileBusinessId}
                        onChange={(e) => setProfileBusinessId(e.target.value)}
                        required
                      >
                        {businessListForForms.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} · {b.type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Nombre del restaurante</Label>
                      <Input
                        className="h-12"
                        value={businessProfileForm.name}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Imagen de perfil</Label>
                      <div className="mt-0 flex items-start justify-between gap-3 lg:items-center lg:justify-start">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-muted/60 px-3 py-2 text-sm font-medium hover:bg-muted">
                            <input type="file" accept="image/*" className="sr-only" onChange={handleBusinessLogoUpload} />
                            Subir imagen
                          </label>
                          {hasBusinessLogo && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setBusinessProfileForm((prev) => ({ ...prev, imageUrl: '' }))}
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={businessLogoValue}
                            alt={`Logo de ${businessProfileForm.name || 'negocio'}`}
                            className="h-12 w-12"
                          >
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              <User className="h-5 w-5" aria-hidden="true" />
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">Máx 1MB.</p>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descripción</Label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        rows={3}
                        value={businessProfileForm.description}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Input
                        value={businessProfileForm.address}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Teléfono de contacto</Label>
                      <Input
                        type="tel"
                        value={businessProfileForm.phone}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>
                    <div>
                      <Label>Región</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={businessProfileForm.region || ''}
                        onChange={(e) =>
                          setBusinessProfileForm((prev) => ({ ...prev, region: e.target.value, city: '' }))
                        }
                      >
                        <option value="">Selecciona región</option>
                        {chileRegions.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Ciudad</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={businessProfileForm.city || ''}
                        onChange={(e) => setBusinessProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                        disabled={!businessProfileForm.region}
                      >
                        <option value="">
                          {businessProfileForm.region ? 'Selecciona ciudad' : 'Selecciona región primero'}
                        </option>
                        {businessProfileCityOptions.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Servicios y espacios</Label>
                      <p className="mt-1 text-xs text-muted-foreground">Selecciona todo lo que aplique.</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {businessAmenityOptions.map((amenity) => {
                          const isChecked = businessProfileForm.amenities.includes(amenity.value);
                          return (
                            <label
                              key={amenity.value}
                              className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-soft transition hover:border-destructive/60"
                            >
                              <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isChecked}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setBusinessProfileForm((prev) => {
                                    const current = Array.isArray(prev.amenities) ? prev.amenities : [];
                                    const next = new Set(current);
                                    if (checked) next.add(amenity.value);
                                    else next.delete(amenity.value);
                                    return { ...prev, amenities: Array.from(next) };
                                  });
                                }}
                              />
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background text-transparent transition peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-background peer-checked:border-destructive peer-checked:bg-destructive peer-checked:text-white">
                                <svg viewBox="0 0 12 9" className="h-3 w-3" aria-hidden="true">
                                  <path
                                    d="M1 4.5L4.25 7.5L11 1.25"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                              <span className="text-sm font-medium">{amenity.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <br></br>
                    <div className="md:col-span-2 flex flex-wrap gap-2 justify-center items-center">
                      <Button variant="danger" type="submit">Guardar perfil</Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              <TabsContent value="publicaciones" className="mt-6 space-y-6">
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isAdmin ? 'Feed general' : 'Vista previa del feed'}
                      </p>
                      <h4 className="text-lg font-semibold">
                        {isAdmin ? 'Publicaciones publicadas' : 'Así verán tus publicaciones'}
                      </h4>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={isAdmin ? loadFeed : loadMyPublications}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Actualizar
                    </Button>
                  </div>
                  {panelPublications.length ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {panelPublications.map((pub) => (
                        <PinCard
                          key={pub.id}
                          publication={pub}
                          likesCount={getHeartsValue(pub)}
                          liked={hasLikedInSession(pub)}
                          onLike={handleLike}
                          onSelect={handleSelectPublication}
                          showActions
                          onEdit={handleEditPublication}
                          onDelete={handleDeletePublication}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                      No hay publicaciones para mostrar.
                    </div>
                  )}
                </div>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="aprobaciones" className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground shadow-soft">
                          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Aprobación de publicaciones</p>
                          <h4 className="text-lg font-semibold">Pendientes por validar</h4>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={loadAdminQueues} className="gap-2">
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Recargar
                      </Button>
                    </div>
                    <div className="mt-4">
                      <div className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between">
                          <h6 className="font-semibold">Publicaciones</h6>
                          <span className="text-xs text-muted-foreground">{adminQueues.publications.length}</span>
                        </div>
                        <div className="mt-2 space-y-2">
                          {adminQueues.publications.map((p) => (
                            <div key={p.id} className="flex flex-col gap-3 rounded-lg bg-muted/60 p-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold">{p.titulo}</p>
                                <p className="text-xs text-muted-foreground">
                                  {p.business?.name ? `${p.business.name} · #${p.businessId}` : `Negocio #${p.businessId}`}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSelectPublication(p)} className="gap-2">
                                  <Eye className="h-4 w-4" aria-hidden="true" />
                                  Ver más
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleApprovePublication(p.id, true)} className="gap-2">
                                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                  Aprobar
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleApprovePublication(p.id, false)} className="gap-2">
                                  <XCircle className="h-4 w-4" aria-hidden="true" />
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          ))}
                          {!adminQueues.publications.length && <p className="text-sm text-muted-foreground">Sin pendientes</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {isAdmin && (
                <TabsContent value="publicidad" className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground shadow-soft">
                          <Megaphone className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Espacio publicitario</p>
                          <h4 className="text-lg font-semibold">Selecciona publicaciones destacadas</h4>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={loadAdminAds} className="gap-2">
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        Recargar
                      </Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <Label>Tenant</Label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft md:w-64"
                            value={adminAdsTenantId}
                            onChange={(e) => setAdminAdsTenantId(e.target.value)}
                          >
                            <option value="">Todos los tenants</option>
                            {tenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-muted-foreground">Solo publicaciones publicadas pueden aparecer aquí.</p>
                      </div>

                      {loadingAdminAds && (
                        <p className="text-sm text-muted-foreground">Cargando publicaciones publicitarias...</p>
                      )}
                      {!loadingAdminAds && !adminAdsWithDecorations.length && (
                        <p className="text-sm text-muted-foreground">Sin publicaciones disponibles para este espacio.</p>
                      )}

                      <div className="space-y-3">
                        {adminAdsWithDecorations.map((pub) => {
                          const mediaSrc = pub.coverUrl || '';
                          const isVideo =
                            pub.coverType === 'VIDEO' || detectMediaTypeFromUrl(pub.coverUrl || '') === 'VIDEO';
                          const isSaving = savingAdminAds.has(String(pub.id));
                          return (
                            <div
                              key={pub.id}
                              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:items-center md:justify-between"
                            >
                              <button
                                type="button"
                                className="flex items-center gap-3 text-left"
                                onClick={() => handleSelectPublication(pub)}
                              >
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                  {isVideo ? (
                                    <video src={mediaSrc} className="h-full w-full object-cover" muted loop playsInline />
                                  ) : (
                                    <img src={mediaSrc} alt={pub.titulo} className="h-full w-full object-cover" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {pub.business?.name || 'Negocio'}
                                  </p>
                                  <p className="text-sm font-semibold line-clamp-1">{pub.titulo}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {pub.esPublicidad ? 'Visible en publicidad' : 'No visible'}
                                  </p>
                                </div>
                              </button>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant={pub.esPublicidad ? 'outline' : 'danger'}
                                  disabled={isSaving}
                                  onClick={() => handleToggleAdminAd(pub, !pub.esPublicidad)}
                                  className="gap-2"
                                >
                                  {pub.esPublicidad ? (
                                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                                  ) : (
                                    <Eye className="h-4 w-4" aria-hidden="true" />
                                  )}
                                  {pub.esPublicidad ? 'Quitar' : 'Mostrar'}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}

              {isOferente && !isAdmin && (
                <TabsContent value="publicidad" className="mt-6 space-y-6">
                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground shadow-soft">
                          <Megaphone className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Planes de publicidad</p>
                          <h4 className="text-lg font-semibold">Elige el nivel de visibilidad de tu negocio</h4>
                          <p className="text-sm text-muted-foreground">
                            Mientras más alto el plan, más presencia tendrás en la webapp.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                        Precios en pesos chilenos (CLP)
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-3">
                      {oferenteAdPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            'relative flex h-full flex-col rounded-2xl border p-4 shadow-soft',
                            plan.accentClass
                          )}
                        >
                          {plan.badge ? (
                            <span className="absolute right-4 top-4 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-soft">
                              {plan.badge}
                            </span>
                          ) : null}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Plan</p>
                              <h5 className="text-lg font-semibold">{plan.name}</h5>
                              <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-3xl font-semibold">$ {formatNumber(plan.price)}</p>
                            <p className="text-xs text-muted-foreground">CLP / mes</p>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Nivel de presencia</span>
                              <span>{plan.presenceLabel}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-muted">
                              <div className={cn('h-full rounded-full', plan.barClass)} style={{ width: `${plan.presence}%` }} />
                            </div>
                          </div>
                          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                            {plan.benefits.map((benefit) => (
                              <li key={benefit} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-5">
                            <Button type="button" variant={plan.buttonVariant} className="w-full">
                              Comprar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-xs text-muted-foreground">
                      La compra se habilitará más adelante. Por ahora esta sección es solo visual.
                    </p>
                  </div>
                </TabsContent>
              )}

              <TabsContent value="estadisticas" className="mt-6 space-y-6">
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-foreground shadow-soft">
                        <BarChart3 className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tablero de rendimiento</p>
                        <h4 className="text-lg font-semibold">Visualizaciones y me gusta</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isAdmin ? 'Resumen global de publicaciones publicadas' : 'Resumen de tus publicaciones'}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Publicaciones</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(statsSummary.totalPublications)}</p>
                      <p className="text-xs text-muted-foreground">Total en el tablero</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Visitas</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(statsSummary.totalVisits)}</p>
                      <p className="text-xs text-muted-foreground">Suma de visualizaciones</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Me gusta</p>
                      <p className="mt-2 text-2xl font-semibold">{formatNumber(statsSummary.totalLikes)}</p>
                      <p className="text-xs text-muted-foreground">Reacciones acumuladas</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold">Más visitadas</h5>
                      <span className="text-xs text-muted-foreground">Top 5</span>
                    </div>
                    {statsSummary.topVisits.bars.length && statsSummary.topVisits.maxValue > 0 ? (
                      <div className="mt-4 space-y-3">
                        {statsSummary.topVisits.bars.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="max-w-[70%] truncate font-medium">{item.label}</span>
                              <span className="text-muted-foreground">{formatNumber(item.value)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">Aún no hay visualizaciones registradas.</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold">Más me gusta</h5>
                      <span className="text-xs text-muted-foreground">Top 5</span>
                    </div>
                    {statsSummary.topLikes.bars.length && statsSummary.topLikes.maxValue > 0 ? (
                      <div className="mt-4 space-y-3">
                        {statsSummary.topLikes.bars.map((item) => (
                          <div key={item.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="max-w-[70%] truncate font-medium">{item.label}</span>
                              <span className="text-muted-foreground">{formatNumber(item.value)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-rose-500"
                                style={{ width: `${item.percent}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">Aún no hay me gusta registrados.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reservas" className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground shadow-soft">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gestión de reservas</p>
                    <h4 className="text-lg font-semibold">Mesas y disponibilidad</h4>
                  </div>
                </div>
                {businessListForForms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Necesitas crear un negocio antes de configurar mesas.
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <Label>Negocio</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={reservationAdminBusinessId}
                        onChange={(e) => setReservationAdminBusinessId(e.target.value)}
                      >
                        {businessListForForms.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.name} · {business.type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                        <div>
                          <h5 className="font-semibold">Agregar mesas</h5>
                          <p className="text-xs text-muted-foreground">
                            Define la cantidad de sillas y el estado inicial.
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mesa individual</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Nombre de la mesa</Label>
                                <Input
                                  placeholder="Ej: Mesa 1"
                                  value={reservationTableDraft.label}
                                  aria-label="Nombre de la mesa"
                                  onChange={(e) =>
                                    setReservationTableDraft((prev) => ({ ...prev, label: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Cantidad de sillas</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Ej: 4"
                                  value={reservationTableDraft.seats}
                                  aria-label="Cantidad de sillas"
                                  onChange={(e) =>
                                    setReservationTableDraft((prev) => ({ ...prev, seats: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Estado inicial</Label>
                                <select
                                  className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                                  value={reservationTableDraft.status}
                                  onChange={(e) =>
                                    setReservationTableDraft((prev) => ({ ...prev, status: e.target.value }))
                                  }
                                >
                                  {TABLE_STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <Button type="button" variant="outline" className="mt-3" onClick={handleReservationAdminAddTable}>
                              Agregar mesa
                            </Button>
                          </div>

                          <div className="border-t border-border/70 pt-4 space-y-3">
                            <div>
                              <h6 className="font-semibold">Horario de funcionamiento</h6>
                              <p className="text-xs text-muted-foreground">
                                Define los rangos en los que el local acepta reservas.
                              </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Mañana desde</Label>
                                <Input
                                  type="time"
                                  value={reservationHoursDraft.morningStart}
                                  onChange={(e) =>
                                    setReservationHoursDraft((prev) => ({ ...prev, morningStart: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Mañana hasta</Label>
                                <Input
                                  type="time"
                                  value={reservationHoursDraft.morningEnd}
                                  onChange={(e) =>
                                    setReservationHoursDraft((prev) => ({ ...prev, morningEnd: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Tarde desde</Label>
                                <Input
                                  type="time"
                                  value={reservationHoursDraft.afternoonStart}
                                  onChange={(e) =>
                                    setReservationHoursDraft((prev) => ({ ...prev, afternoonStart: e.target.value }))
                                  }
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Tarde hasta</Label>
                                <Input
                                  type="time"
                                  value={reservationHoursDraft.afternoonEnd}
                                  onChange={(e) =>
                                    setReservationHoursDraft((prev) => ({ ...prev, afternoonEnd: e.target.value }))
                                  }
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={reservationHoursSaving}
                                onClick={handleSaveReservationHours}
                              >
                                {reservationHoursSaving ? 'Guardando...' : 'Guardar horarios'}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Si dejas un rango vacío, no se considerará en la disponibilidad.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-border/70 pt-4 space-y-4">
                            <div>
                              <h6 className="font-semibold">Disponibilidad semanal y cierres</h6>
                              <p className="text-xs text-muted-foreground">
                                Define los días de funcionamiento, feriados propios, vacaciones y cierres temporales.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Días de funcionamiento</Label>
                              <div className="flex flex-wrap gap-2">
                                {WEEKDAY_OPTIONS.map((day) => {
                                  const isActive = Array.isArray(reservationAvailabilityDraft.operatingDays)
                                    ? reservationAvailabilityDraft.operatingDays.includes(day.value)
                                    : false;
                                  return (
                                    <Button
                                      key={day.value}
                                      type="button"
                                      size="sm"
                                      variant={isActive ? 'danger' : 'outline'}
                                      aria-pressed={isActive}
                                      onClick={() => toggleReservationOperatingDay(day.value)}
                                    >
                                      {day.label}
                                    </Button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Si no seleccionas días, no se podrán recibir reservas.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Feriados propios</Label>
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="space-y-1 sm:col-span-2">
                                  <Input
                                    type="date"
                                    value={reservationHolidayDraft}
                                    onChange={(e) => setReservationHolidayDraft(e.target.value)}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <Button type="button" variant="outline" onClick={handleAddReservationHoliday}>
                                    Agregar feriado
                                  </Button>
                                </div>
                              </div>
                              {Array.isArray(reservationAvailabilityDraft.holidayDates) &&
                              reservationAvailabilityDraft.holidayDates.length ? (
                                <div className="space-y-2">
                                  {reservationAvailabilityDraft.holidayDates.map((date) => (
                                    <div
                                      key={date}
                                      className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs"
                                    >
                                      <span>{date}</span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Eliminar feriado"
                                        onClick={() => handleRemoveReservationHoliday(date)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No hay feriados propios cargados.</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Vacaciones</Label>
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">Desde</Label>
                                  <Input
                                    type="date"
                                    value={reservationVacationDraft.start}
                                    onChange={(e) =>
                                      setReservationVacationDraft((prev) => ({ ...prev, start: e.target.value }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">Hasta</Label>
                                  <Input
                                    type="date"
                                    value={reservationVacationDraft.end}
                                    onChange={(e) =>
                                      setReservationVacationDraft((prev) => ({ ...prev, end: e.target.value }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">Motivo (opcional)</Label>
                                  <Input
                                    placeholder="Ej: mantenimiento"
                                    value={reservationVacationDraft.label}
                                    onChange={(e) =>
                                      setReservationVacationDraft((prev) => ({ ...prev, label: e.target.value }))
                                    }
                                  />
                                </div>
                              </div>
                              <Button type="button" variant="outline" size="sm" onClick={handleAddReservationVacation}>
                                Agregar semanas de vacaciones
                              </Button>
                              {Array.isArray(reservationAvailabilityDraft.vacationRanges) &&
                              reservationAvailabilityDraft.vacationRanges.length ? (
                                <div className="space-y-2">
                                  {reservationAvailabilityDraft.vacationRanges.map((range, index) => (
                                    <div
                                      key={`${range?.start || 'start'}-${range?.end || 'end'}-${index}`}
                                      className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs"
                                    >
                                      <div>
                                        <p className="text-xs font-semibold">
                                          {range?.start || '--'} → {range?.end || '--'}
                                        </p>
                                        {range?.label ? (
                                          <p className="text-[11px] text-muted-foreground">{range.label}</p>
                                        ) : null}
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        aria-label="Eliminar vacaciones"
                                        onClick={() => handleRemoveReservationVacation(index)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">No hay semanas de vacaciones definidas.</p>
                              )}
                            </div>

                            <div className="rounded-xl border border-border/70 bg-muted/40 p-3 space-y-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">Cierre temporal</p>
                                  <p className="text-xs text-muted-foreground">
                                    Activa un cierre temporal y agrega un mensaje para los clientes.
                                  </p>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-semibold">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={reservationAvailabilityDraft.temporaryClosureActive}
                                    onChange={(e) =>
                                      setReservationAvailabilityDraft((prev) => ({
                                        ...prev,
                                        temporaryClosureActive: e.target.checked,
                                      }))
                                    }
                                  />
                                  {reservationAvailabilityDraft.temporaryClosureActive ? 'Activo' : 'Inactivo'}
                                </label>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Desde</Label>
                                  <Input
                                    type="date"
                                    value={reservationAvailabilityDraft.temporaryClosureStart}
                                    disabled={!reservationAvailabilityDraft.temporaryClosureActive}
                                    onChange={(e) =>
                                      setReservationAvailabilityDraft((prev) => ({
                                        ...prev,
                                        temporaryClosureStart: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Hasta</Label>
                                  <Input
                                    type="date"
                                    value={reservationAvailabilityDraft.temporaryClosureEnd}
                                    disabled={!reservationAvailabilityDraft.temporaryClosureActive}
                                    onChange={(e) =>
                                      setReservationAvailabilityDraft((prev) => ({
                                        ...prev,
                                        temporaryClosureEnd: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Mensaje para clientes</Label>
                                <textarea
                                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-soft"
                                  rows={2}
                                  value={reservationAvailabilityDraft.temporaryClosureMessage}
                                  disabled={!reservationAvailabilityDraft.temporaryClosureActive}
                                  onChange={(e) =>
                                    setReservationAvailabilityDraft((prev) => ({
                                      ...prev,
                                      temporaryClosureMessage: e.target.value,
                                    }))
                                  }
                                  placeholder="Ej: Cerrado por remodelación."
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                disabled={reservationAvailabilitySaving}
                                onClick={handleSaveReservationAvailability}
                              >
                                {reservationAvailabilitySaving ? 'Guardando...' : 'Guardar disponibilidad'}
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Esta configuración aplica a nuevas reservas.
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-border/70 pt-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h6 className="font-semibold">Reservas realizadas</h6>
                                <p className="text-xs text-muted-foreground">
                                  Revisa quién reservó y abre el detalle completo con el ícono del ojo.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => loadReservationAdminReservations(reservationAdminBusinessId)}
                              >
                                Actualizar
                              </Button>
                            </div>
                            {reservationAdminReservationsLoading ? (
                              <p className="text-sm text-muted-foreground">Cargando reservas...</p>
                            ) : reservationAdminReservations.length ? (
                              <div className="space-y-2">
                                {reservationAdminReservations.map((reservation) => (
                                  <div
                                    key={reservation.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-3"
                                  >
                                    <div>
                                      <p className="text-sm font-semibold">
                                        {reservation.holderName ||
                                          reservation.guestName ||
                                          reservation.userName ||
                                          'Cliente'}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Código: {reservation.code || '--'}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {reservation.date} · {reservation.time}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      aria-label="Ver detalles de la reserva"
                                      onClick={() => {
                                        setReservationAdminDetail(reservation);
                                        setReservationAdminDetailOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Aún no hay reservas para este negocio.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div>
                          <h5 className="font-semibold">Mesas configuradas</h5>
                          <p className="text-xs text-muted-foreground">
                            Cambia el estado para marcar disponibles, ocupadas o en mantenimiento.
                          </p>
                        </div>
                        {reservationTablesLoading && !reservationAdminTables.length ? (
                          <p className="text-sm text-muted-foreground">Cargando mesas...</p>
                        ) : reservationAdminTables.length ? (
                          <div className="space-y-2">
                            {reservationAdminTables.map((table) => {
                              const statusMeta = getTableStatusMeta(table.status);
                              return (
                                <div
                                  key={table.id}
                                  className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 md:flex-row md:items-center"
                                >
                                  <Input
                                    className="md:max-w-[200px]"
                                    value={table.label}
                                    placeholder="Nombre de mesa"
                                    aria-label="Nombre de la mesa"
                                    onChange={(e) =>
                                      handleReservationAdminUpdateTable(table.id, { label: e.target.value })
                                    }
                                  />
                                  <Input
                                    type="number"
                                    min="1"
                                    className="md:w-24"
                                    value={table.seats}
                                    aria-label="Cantidad de sillas"
                                    onChange={(e) =>
                                      handleReservationAdminUpdateTable(table.id, {
                                        seats: Math.max(1, Number(e.target.value) || 1),
                                      })
                                    }
                                  />
                                  <select
                                    className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                                    value={table.status}
                                    onChange={(e) =>
                                      handleReservationAdminUpdateTable(table.id, { status: e.target.value })
                                    }
                                  >
                                    {TABLE_STATUS_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                  <span
                                    className={cn(
                                      'rounded-full border px-2 py-1 text-xs font-semibold',
                                      statusMeta?.badgeClass
                                    )}
                                  >
                                    {statusMeta?.label}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReservationAdminRemoveTable(table.id)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Aún no hay mesas configuradas.</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

            </Tabs>
          </section>
        )}

          </>
        )}
      </main>

      {(isOferente || isAdmin) && (
        <>
          <Button
            size="lg"
            className="fixed bottom-20 right-6 z-40 rounded-full px-6 shadow-soft hover:shadow-hover"
            onClick={() => setReservationScanOpen(true)}
            aria-label="Escanear reserva"
            variant="outline"
          >
            Escanea reserva
            <QrCode className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            size="lg"
            className="fixed bottom-6 right-6 z-40 rounded-full px-6 shadow-soft hover:shadow-hover"
            onClick={() => setContactOpen(true)}
            aria-label="Abrir contacto"
            variant="danger"
          >
            ¡Contáctenos!
            <User className="h-4 w-4" aria-hidden="true" />
          </Button>
        </>
      )}

      <footer className="border-t border-border bg-card/80">
        <div className="container px-4 py-8 space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sobre la app</p>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Match Coffee es la red social autogestionable para negocios gastronómicos: comparte novedades, gestiona tus
              locales y deja que la comunidad descubra tus productos en un feed curado.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <p>Creado para comunidades que se autogestionan y comparten gastronomía local.</p>
            <p>© {currentYear} Match Coffee. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {showClientBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur">
          <div className="container flex items-center justify-around px-4 py-3">
            <button
              type="button"
              className={cn(
                'flex flex-col items-center gap-1 text-xs font-semibold',
                clientPortalTab === 'reservas' ? 'text-rose-600' : 'text-muted-foreground'
              )}
              onClick={() => {
                setClientPortalTab('reservas');
                setClientPortalOpen(true);
              }}
            >
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              Reservas
            </button>
            <button
              type="button"
              className={cn(
                'flex flex-col items-center gap-1 text-xs font-semibold',
                clientPortalTab === 'comentarios' ? 'text-rose-600' : 'text-muted-foreground'
              )}
              onClick={() => {
                setClientPortalTab('comentarios');
                setClientPortalOpen(true);
              }}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Comentarios
            </button>
            <button
              type="button"
              className={cn(
                'flex flex-col items-center gap-1 text-xs font-semibold',
                clientPortalTab === 'guardadas' ? 'text-rose-600' : 'text-muted-foreground'
              )}
              onClick={() => {
                setClientPortalTab('guardadas');
                setClientPortalOpen(true);
              }}
            >
              <span className="flex items-center gap-1">
                <Heart className="h-5 w-5" aria-hidden="true" />
                <span className="text-[10px] font-bold">/</span>
                <Download className="h-5 w-5" aria-hidden="true" />
              </span>
              Publicaciones guardadas
            </button>
          </div>
        </nav>
      )}

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={authLoading}
      />

      <ExploreDialog
        open={exploreOpen}
        onOpenChange={setExploreOpen}
        categories={categoryFilterOptions}
        businessTypes={businessTypeOptions}
        regions={chileRegions}
        citiesByRegion={chileCitiesByRegion}
        amenities={businessAmenityOptions}
        filters={filters}
        onChange={(partial) => {
          setTopHeartsMode(false);
          setFilters((prev) => ({ ...prev, ...partial }));
        }}
        onClear={() => {
          setTopHeartsMode(false);
          setFilters((prev) => ({
            ...prev,
            categoryId: '',
            businessType: '',
            region: '',
            city: '',
            amenities: [],
            sortBy: '',
            sortDir: 'desc',
          }));
        }}
      />

      <Dialog
        open={reservationOpen}
        onOpenChange={(open) => {
          setReservationOpen(open);
          if (!open) resetReservationFlow();
        }}
        overlayClassName="z-[60]"
      >
        <DialogContent className="sm:max-w-4xl">
          {reservationStep === 'mode' && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Reservas</DialogTitle>
                <DialogDescription>Elige la forma en que quieres reservar tu mesa.</DialogDescription>
              </DialogHeader>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Con registro</p>
                    <h4 className="text-lg font-semibold">Reservar como cliente</h4>
                    <p className="text-sm text-muted-foreground">
                      Accede a tus reservas y notificaciones de confirmación.
                    </p>
                  </div>
                  <Button type="button" variant="danger" onClick={handleReservationRegisteredStart} className="w-full">
                    Reservar con registro
                  </Button>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Sin registro</p>
                    <h4 className="text-lg font-semibold">Reservar como invitado</h4>
                    <p className="text-sm text-muted-foreground">
                      Completa tus datos básicos para asegurar la reserva.
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={handleReservationGuestStart} className="w-full">
                    Reservar sin registro
                  </Button>
                </div>
              </div>
            </>
          )}

          {reservationStep === 'guest' && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Reserva sin registro</DialogTitle>
                <DialogDescription>Ingresa los datos de la persona que realizará la reserva.</DialogDescription>
              </DialogHeader>
              <form className="mt-6 space-y-4" onSubmit={handleReservationGuestSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      value={reservationGuest.nombre}
                      onChange={(e) => setReservationGuest((prev) => ({ ...prev, nombre: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellido</Label>
                    <Input
                      value={reservationGuest.apellido}
                      onChange={(e) => setReservationGuest((prev) => ({ ...prev, apellido: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>RUT</Label>
                  <Input
                    placeholder="12.345.678-9"
                    value={reservationGuest.rut}
                    onChange={(e) => setReservationGuest((prev) => ({ ...prev, rut: formatRut(e.target.value) }))}
                    required
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="outline" onClick={() => setReservationStep('mode')}>
                    Volver
                  </Button>
                  <Button type="submit" variant="danger">
                    Continuar
                  </Button>
                </div>
              </form>
            </>
          )}

          {reservationStep === 'business' && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Selecciona un local</DialogTitle>
                <DialogDescription>Elige el tipo de local y el negocio donde deseas reservar.</DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold">¿En qué tipo de local desea reservar?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {defaultBusinessTypes.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={reservationType === type ? 'danger' : 'outline'}
                        onClick={() => setReservationType(type)}
                      >
                        {humanizeCategoryType(type)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Buscar local</Label>
                  <Input
                    placeholder="Escribe el nombre del local"
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  {reservationBusinessOptions.length ? (
                    reservationBusinessOptions.map((business) => (
                      <button
                        key={business.id}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card/80 px-4 py-3 text-left transition hover:border-primary/40 hover:bg-muted/40"
                        onClick={() => handleReservationBusinessSelect(business.id)}
                      >
                        <Avatar src={business.imageUrl} alt={business.name} className="h-10 w-10">
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {(business.name || 'N')[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{business.name}</p>
                          <p className="text-xs text-muted-foreground">{humanizeCategoryType(business.type)}</p>
                        </div>
                        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                          {business.city || business.region || 'Chile'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No hay locales disponibles con los filtros seleccionados.
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReservationStep(reservationMode === 'guest' ? 'guest' : 'mode')}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            </>
          )}

          {reservationStep === 'tables' && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Selecciona mesas y hora</DialogTitle>
                <DialogDescription>
                  {reservationBusiness
                    ? `Reserva en ${reservationBusiness.name}`
                    : 'Selecciona las mesas disponibles.'}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Mesas disponibles</p>
                    <span className="text-xs text-muted-foreground">
                      {reservationTablesForSelectedBusiness.length} configuradas
                    </span>
                  </div>
                  {reservationTablesLoading && !reservationTablesForSelectedBusiness.length ? (
                    <p className="mt-3 text-sm text-muted-foreground">Cargando mesas...</p>
                  ) : reservationTablesForSelectedBusiness.length ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {reservationTablesForSelectedBusiness.map((table) => {
                        const availabilityStatus = table.availabilityStatus || table.status || 'DISPONIBLE';
                        const statusMeta = getTableStatusMeta(availabilityStatus);
                        const isAvailable = availabilityStatus === 'DISPONIBLE';
                        const isSelected = reservationTableSelection.includes(String(table.id));
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => isAvailable && handleReservationTableToggle(table.id)}
                            disabled={!isAvailable}
                            className={cn(
                              'flex flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition',
                              isAvailable
                                ? 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                                : 'cursor-not-allowed border-dashed border-border/70 bg-muted/40 text-muted-foreground',
                              isSelected && 'ring-2 ring-rose-400/60'
                            )}
                          >
                            <div className="flex w-full items-center justify-between">
                              <p className="font-semibold">{table.label}</p>
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                                  statusMeta?.badgeClass
                                )}
                              >
                                {statusMeta?.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{table.seats} sillas disponibles</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Este local aún no tiene mesas configuradas.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora</Label>
                    {reservationTimeOptions.length ? (
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={reservationTime}
                        disabled={reservationDateClosed}
                        onChange={(e) => setReservationTime(e.target.value)}
                      >
                        <option value="">Selecciona una hora</option>
                        {reservationTimeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type="time"
                        value={reservationTime}
                        disabled={reservationDateClosed}
                        onChange={(e) => setReservationTime(e.target.value)}
                      />
                    )}
                  </div>
                </div>
                {reservationHoursLabel && (
                  <p className="text-xs text-muted-foreground">
                    Horarios disponibles para reservas: {reservationHoursLabel}
                  </p>
                )}
                {reservationDateClosure && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                    <p className="font-semibold">No hay disponibilidad para esa fecha</p>
                    <p>{reservationDateClosure.message}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notas adicionales (opcional)</Label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                    rows={3}
                    value={reservationNotes}
                    onChange={(e) => setReservationNotes(e.target.value)}
                    placeholder="Ej: necesitamos silla de bebé, celebrar cumpleaños..."
                  />
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">Resumen</p>
                  <p className="mt-1 text-muted-foreground">
                    {reservationTableSelection.length} mesas seleccionadas · {reservationTotalSelectedSeats} sillas
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="outline" onClick={() => setReservationStep('business')}>
                    Volver
                  </Button>
                  <Button type="button" variant="danger" disabled={reservationDateClosed} onClick={handleReservationToPayment}>
                    Continuar al pago
                  </Button>
                </div>
              </div>
            </>
          )}

          {reservationStep === 'payment' && (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Pasarela de pago</DialogTitle>
                <DialogDescription>
                  Se cobrará un monto fijo de $ {formatNumber(RESERVATION_PRICE)} por la reserva.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">Resumen de la reserva</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Local:</span>{' '}
                      {reservationBusiness?.name || 'Sin seleccionar'}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Mesas:</span>{' '}
                      {reservationSelectedTables.map((table) => table.label).join(', ')}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Fecha:</span> {reservationDate} · {reservationTime}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Total sillas:</span>{' '}
                      {reservationTotalSelectedSeats}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <p className="font-semibold">Pago con tarjeta (demo)</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2 space-y-2">
                      <Label>Nombre en la tarjeta</Label>
                      <Input
                        value={reservationPayment.name}
                        onChange={(e) => setReservationPayment((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label>Número de tarjeta</Label>
                      <Input
                        value={reservationPayment.number}
                        onChange={(e) => setReservationPayment((prev) => ({ ...prev, number: e.target.value }))}
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vencimiento</Label>
                      <Input
                        value={reservationPayment.expiry}
                        onChange={(e) => setReservationPayment((prev) => ({ ...prev, expiry: e.target.value }))}
                        placeholder="MM/AA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input
                        value={reservationPayment.cvv}
                        onChange={(e) => setReservationPayment((prev) => ({ ...prev, cvv: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button type="button" variant="outline" onClick={() => setReservationStep('tables')}>
                    Volver
                  </Button>
                  <Button type="button" variant="danger" onClick={handleConfirmReservation}>
                    Confirmar y pagar $ {formatNumber(RESERVATION_PRICE)}
                  </Button>
                </div>
              </div>
            </>
          )}

          {reservationStep === 'success' && (
            <>
              <DialogHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <DialogTitle>¡Felicidades! Su reserva se ha agendado con éxito</DialogTitle>
                <DialogDescription>
                  Guarda este comprobante y preséntalo cuando llegues al negocio.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">Resumen</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Código:</span>{' '}
                      {reservationSuccess?.code || '--'}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Local:</span>{' '}
                      {reservationSuccess?.businessName || ''}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Fecha:</span>{' '}
                      {reservationSuccess?.date || ''} · {reservationSuccess?.time || ''}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Mesas:</span>{' '}
                      {Array.isArray(reservationSuccess?.tables)
                        ? reservationSuccess.tables.map((table) => table.label).join(', ')
                        : ''}
                    </p>
                    {reservationSuccess?.guestRut && (
                      <p>
                        <span className="font-semibold text-foreground">RUT:</span> {reservationSuccess.guestRut}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-muted-foreground">
                    Debe presentar este archivo al momento de presentarse al negocio.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    onClick={() => downloadReservationPdf(reservationSuccess)}
                  >
                    Descargar reserva en PDF
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {reservationMode === 'registered' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setClientPortalTab('reservas');
                        setClientPortalOpen(true);
                      }}
                    >
                      Ver mis reservas
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setReservationOpen(false);
                      resetReservationFlow();
                    }}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reservationAdminDetailOpen}
        onOpenChange={(open) => {
          setReservationAdminDetailOpen(open);
          if (!open) setReservationAdminDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="text-left">
            <DialogTitle>Detalle de reserva</DialogTitle>
            <DialogDescription>Información completa del cliente y la reserva seleccionada.</DialogDescription>
          </DialogHeader>
          {reservationAdminDetail ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reserva</p>
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Código:</span> {reservationAdminDetail.code || '--'}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Local:</span> {reservationAdminDetail.businessName || '--'}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Fecha y hora:</span> {reservationAdminDetail.date} ·{' '}
                    {reservationAdminDetail.time}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Mesas:</span>{' '}
                    {Array.isArray(reservationAdminDetail.tables)
                      ? reservationAdminDetail.tables.map((table) => table.label).join(', ')
                      : 'Sin mesas'}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Sillas:</span> {reservationAdminDetail.totalSeats || 0}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Monto:</span> $
                    {formatNumber(reservationAdminDetail.totalPrice ?? RESERVATION_PRICE)}
                  </p>
                  {reservationAdminDetail.notes && (
                    <p>
                      <span className="font-semibold text-foreground">Notas:</span> {reservationAdminDetail.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
                {reservationAdminDetail.userId ? (
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Registrado:</span>{' '}
                      {reservationAdminDetail.userName || reservationAdminDetail.holderName || 'Cliente'}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Correo:</span>{' '}
                      {reservationAdminDetail.userEmail || '--'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">Invitado:</span>{' '}
                      {reservationAdminDetail.guestName || reservationAdminDetail.holderName || 'Cliente'}
                      {reservationAdminDetail.guestLastName ? ` ${reservationAdminDetail.guestLastName}` : ''}
                    </p>
                    {reservationAdminDetail.guestRut && (
                      <p>
                        <span className="font-semibold text-foreground">RUT:</span> {reservationAdminDetail.guestRut}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona una reserva para ver el detalle.</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={reservationScanOpen}
        onOpenChange={(open) => {
          setReservationScanOpen(open);
          if (!open) {
            setReservationScanOverlayOpen(false);
            setReservationScanStatus('idle');
            setReservationScanError('');
            setReservationScanResult(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle>Escanea reserva</DialogTitle>
            <DialogDescription>Apunta al QR del comprobante para validar la reserva.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 relative">
            <div className="aspect-video overflow-hidden rounded-xl border border-border bg-black/80">
              <video ref={reservationScanVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
            </div>
            {reservationScanOverlayOpen && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
                onMouseDown={handleReservationScanOverlayClose}
              >
                <div
                  className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-4 shadow-hover"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  {reservationScanStatus === 'success' && reservationScanResult?.reservation && (
                    <>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border',
                            reservationScanFeedback?.isValid
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-600'
                              : 'border-rose-200 bg-rose-100 text-rose-600'
                          )}
                        >
                          {reservationScanFeedback?.isValid ? (
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-5 w-5" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">{reservationScanFeedback?.title}</p>
                            <span
                              className={cn(
                                'rounded-full border px-2 py-1 text-xs font-semibold',
                                reservationScanFeedback?.isValid
                                  ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                                  : 'border-rose-200 bg-rose-100 text-rose-700'
                              )}
                            >
                              {reservationScanFeedback?.isValid ? 'VÁLIDA' : 'NO VÁLIDA'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{reservationScanFeedback?.description}</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Código:</span>{' '}
                        {reservationScanResult.reservation.code || '--'}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Cliente:</span>{' '}
                        {reservationScanResult.reservation.userName ||
                          reservationScanResult.reservation.guestName ||
                          reservationScanResult.reservation.holderName ||
                          'Cliente'}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Fecha:</span>{' '}
                        {reservationScanResult.reservation.date} · {reservationScanResult.reservation.time}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Mesas:</span>{' '}
                        {Array.isArray(reservationScanResult.reservation.tables)
                          ? reservationScanResult.reservation.tables.map((table) => table.label).join(', ')
                          : 'Sin mesas'}
                      </p>
                    </>
                  )}
                  {reservationScanStatus === 'success' && !reservationScanResult?.reservation && (
                    <p className="text-sm text-muted-foreground">
                      No se encontró información adicional de la reserva.
                    </p>
                  )}
                  {reservationScanStatus === 'error' && (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-100 text-rose-600">
                        <XCircle className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">No se pudo validar</p>
                        <p className="text-xs text-muted-foreground">
                          {reservationScanError || 'No se pudo verificar la reserva.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button type="button" variant="outline" onClick={handleReservationScanOverlayClose}>
                      Escanear otra
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {reservationScanStatus === 'scanning' && (
              <p className="text-xs text-muted-foreground">Apunta al QR para leer el código de la reserva.</p>
            )}
            {reservationScanStatus === 'verifying' && (
              <p className="text-xs text-muted-foreground">Verificando la reserva...</p>
            )}
            {reservationScanStatus === 'error' && !reservationScanOverlayOpen && (
              <p className="text-sm text-rose-600">{reservationScanError || 'No se pudo verificar la reserva.'}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={clientPortalOpen} onOpenChange={setClientPortalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className="text-left">
            <DialogTitle>Mi actividad</DialogTitle>
            <DialogDescription>Revisa tus reservas, comentarios y publicaciones guardadas.</DialogDescription>
          </DialogHeader>
          <Tabs value={clientPortalTab} onValueChange={setClientPortalTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
              <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
              <TabsTrigger value="guardadas">Guardadas</TabsTrigger>
            </TabsList>

            <TabsContent value="reservas" className="mt-4 space-y-3">
              {reservationsForUser.length ? (
                reservationsForUser.map((reservation) => (
                  <div key={reservation.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">{reservation.businessName}</p>
                        <p className="text-xs text-muted-foreground">Código: {reservation.code || '--'}</p>
                        <p className="text-xs text-muted-foreground">
                          {reservation.date} · {reservation.time}
                        </p>
                      </div>
                      <span className="rounded-full border px-3 py-1 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-100">
                        {reservation.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mesas:{' '}
                      {Array.isArray(reservation.tables)
                        ? reservation.tables.map((table) => table.label).join(', ')
                        : 'Sin mesas'}{' '}
                      · Sillas: {reservation.totalSeats || 0}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const business = businesses.find((b) => String(b.id) === String(reservation.businessId));
                          downloadReservationPdf({
                            ...reservation,
                            businessLogo: reservation.businessLogo || business?.imageUrl || '',
                          });
                        }}
                      >
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Aún no tienes reservas registradas.
                </div>
              )}
            </TabsContent>

            <TabsContent value="comentarios" className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Tus comentarios más recientes.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={refreshClientCommentReplies}
                  disabled={clientCommentsRefreshing}
                >
                  {clientCommentsRefreshing ? 'Actualizando...' : 'Actualizar respuestas'}
                </Button>
              </div>
              {clientComments.length ? (
                clientComments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{comment.publicationTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.createdAt
                          ? new Date(comment.createdAt).toLocaleString('es-CL', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : ''}
                      </p>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Respuestas: {comment.replyCount || 0}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Aún no tienes comentarios guardados.
                </div>
              )}
            </TabsContent>

            <TabsContent value="guardadas" className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" aria-hidden="true" />
                <span className="font-semibold">/</span>
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Publicaciones con me gusta y guardadas.</span>
              </div>
              {savedLikedPublications.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {savedLikedPublications.map((publication) => (
                    <PinCard
                      key={publication.id}
                      publication={publication}
                      likesCount={getHeartsValue(publication)}
                      liked={hasLikedInSession(publication)}
                      onLike={handleLike}
                      onSelect={handleSelectPublication}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  Aún no tienes publicaciones guardadas con me gusta.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {(isOferente || isAdmin) && (
        <Dialog open={contactOpen} onOpenChange={setContactOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="text-left">
              <DialogTitle>¿Necesitas ayuda?</DialogTitle>
              <DialogDescription>
                Escríbenos y te acompañamos con la gestión del panel.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-stretch justify-between gap-4 rounded-xl border border-border bg-muted/50 p-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">WhatsApp</p>
                  <a
                    className="mt-2 inline-flex text-base font-semibold text-primary hover:underline"
                    href="https://wa.me/56978713797"
                    target="_blank"
                    rel="noreferrer"
                  >
                    (+56) 9 7871 3797
                  </a>
                </div>
                <a
                  className="flex w-16 self-stretch items-center justify-center rounded-lg bg-background/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  href="https://wa.me/56978713797"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir WhatsApp"
                >
                  <MessageCircle className="h-9 w-9" aria-hidden="true" />
                </a>
              </div>
              <div className="flex items-stretch justify-between gap-4 rounded-xl border border-border bg-muted/50 p-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Correo</p>
                  <a
                    className="mt-2 inline-flex text-base font-semibold text-primary hover:underline"
                    href="mailto:javiermar1200@gmail.com"
                  >
                    javiermar1200@gmail.com
                  </a>
                </div>
                <a
                  className="flex w-16 self-stretch items-center justify-center rounded-lg bg-background/60 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  href="mailto:javiermar1200@gmail.com"
                  aria-label="Enviar correo"
                >
                  <Mail className="h-9 w-9" aria-hidden="true" />
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={notificationsOpen}
        onOpenChange={(open) => {
          setNotificationsOpen(open);
          if (open) setHasNewSimilar(false);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader className="text-left">
            <DialogTitle>Productos similares</DialogTitle>
            <DialogDescription>
              {similarSource ? `Inspirados en ${similarSource.titulo}` : 'Selecciona una publicación para ver sugerencias.'}
            </DialogDescription>
          </DialogHeader>

          {similarItems.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {similarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectFromNotifications(item)}
                  className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-hover"
                >
                  <div className="relative h-36 w-full overflow-hidden">
                    <img
                      src={item.coverUrl || placeholderImages[0]}
                      alt={item.titulo}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <span className="absolute left-2 bottom-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800">
                      {getVisitsValue(item)} visitas
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="line-clamp-1 text-sm font-semibold">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCategoryLabel((item.categories || [])[0]) || 'Sin categoría'}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.business?.name ? `${item.business.name} · ${item.business.type}` : 'Descubre más detalles'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              {similarSource
                ? 'No encontramos otras publicaciones en esta categoría.'
                : 'Explora una publicación para ver recomendaciones aquí.'}
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="text-left">
            <DialogTitle>Crear o gestionar contenido</DialogTitle>
            <DialogDescription>
              Publica novedades, registra negocios, categorías o crea tu tenant directamente desde aquí.
            </DialogDescription>
          </DialogHeader>

          {!currentUser ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center">
              <p className="text-muted-foreground">Inicia sesión para crear contenido.</p>
              <Button
                className="mt-3"
                variant="danger"
                onClick={() => {
                  setCreateOpen(false);
                  setAuthOpen(true);
                }}
              >
                Abrir login
              </Button>
            </div>
          ) : (
            <Tabs value={createDialogTab} onValueChange={setCreateDialogTab} className="mt-2">
              <TabsList className="w-full grid grid-cols-2 md:grid-cols-2">
                <TabsTrigger value="publicacion">Publicación</TabsTrigger>
                <TabsTrigger value="negocio">Negocio</TabsTrigger>
              </TabsList>

              <TabsContent value="publicacion" className="mt-4">
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreatePublication}>
                  <div className="md:col-span-2">
                    <Label>Título</Label>
                    <Input
                      value={publicationForm.titulo}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, titulo: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={publicationForm.tipo}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, tipo: e.target.value }))}
                    >
                      {publicationTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Negocio</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={publicationForm.businessId}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, businessId: e.target.value }))}
                      required
                    >
                      <option value="">Selecciona negocio</option>
                      {businessListForForms.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Contenido</Label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      rows={3}
                      value={publicationForm.contenido}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, contenido: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Fin de vigencia</Label>
                    <Input
                      type="date"
                      value={publicationForm.fechaFinVigencia}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, fechaFinVigencia: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ej: 4500"
                      value={publicationForm.precio}
                      onChange={(e) => setPublicationForm((prev) => ({ ...prev, precio: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Portada (imagen o video)</Label>
                    <div className="mt-1 space-y-2 rounded-lg border border-dashed border-input p-3">
                      <Input
                        placeholder="https://... o pega un data URL"
                        value={publicationForm.mediaUrl}
                        onChange={(e) => handleMediaUrlChange(e.target.value)}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-muted/60 px-3 py-2 text-sm font-medium hover:bg-muted">
                          <input
                            type="file"
                            accept="image/*,video/mp4,video/webm,video/ogg"
                            className="sr-only"
                            onChange={(e) => handleMediaFileChange(e.target.files?.[0] || null)}
                          />
                          Subir archivo
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Acepta imagen o video corto. La imagen se comprimira antes de enviarse al backend.
                        </p>
                      </div>
                      {publicationForm.mediaUrl && (
                        <div className="overflow-hidden rounded-lg border bg-muted/40">
                          {publicationForm.mediaType === 'VIDEO' ? (
                            <video src={publicationForm.mediaUrl} controls className="h-56 w-full object-cover" />
                          ) : (
                            <img src={publicationForm.mediaUrl} alt="Portada" className="h-56 w-full object-cover" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Agregados adicionales (opcional)</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Puedes agregar hasta {PUBLICATION_EXTRAS_LIMIT} adicionales con nombre, precio e imagen opcional.
                    </p>
                    <div className="mt-3 space-y-3">
                      {(Array.isArray(publicationForm.extras) ? publicationForm.extras : []).length ? (
                        (Array.isArray(publicationForm.extras) ? publicationForm.extras : []).map((extra, index) => (
                          <div key={`extra-${index}`} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                            <div className="grid gap-2 md:grid-cols-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Nombre</Label>
                                <Input
                                  placeholder="Ej: Papas fritas"
                                  value={extra?.nombre || ''}
                                  onChange={(e) => updatePublicationExtra(index, { nombre: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Precio</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Ej: 1500"
                                  value={extra?.precio ?? ''}
                                  onChange={(e) => updatePublicationExtra(index, { precio: e.target.value })}
                                />
                              </div>
                              <div className="flex items-end justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemovePublicationExtra(index)}
                                >
                                  Quitar
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Imagen (opcional)</Label>
                                <Input
                                  placeholder="https://... o pega un data URL"
                                  value={extra?.imagenUrl || ''}
                                  onChange={(e) => updatePublicationExtra(index, { imagenUrl: e.target.value })}
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-muted/60 px-3 py-2 text-sm font-medium hover:bg-muted">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(e) => handleExtraImageFileChange(index, e.target.files?.[0] || null)}
                                  />
                                  Subir imagen
                                </label>
                              </div>
                            </div>
                            {extra?.imagenUrl && (
                              <div className="mt-3 overflow-hidden rounded-lg border bg-muted/40">
                                <img src={extra.imagenUrl} alt={extra?.nombre || 'Extra'} className="h-40 w-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">Aún no agregas adicionales.</p>
                      )}
                    </div>
                    {(Array.isArray(publicationForm.extras) ? publicationForm.extras : []).length < PUBLICATION_EXTRAS_LIMIT && (
                      <Button type="button" variant="outline" size="sm" className="mt-3" onClick={handleAddPublicationExtra}>
                        Agregar adicional
                      </Button>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Categoría</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selecciona una única categoría permitida para este negocio.
                    </p>
                    {!selectedBusinessForPublication && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Selecciona primero un negocio para ver sus categorías disponibles.
                      </p>
                    )}
                    {selectedBusinessForPublication && allowedCategoryTypesForBusiness.length > 0 && (
                      <select
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={selectedCategoryType}
                        onChange={(e) =>
                          setPublicationForm((prev) => ({
                            ...prev,
                            categoryTypes: e.target.value ? [e.target.value] : [],
                            categoryIds: [],
                          }))
                        }
                        required
                      >
                        <option value="">Elige una categoría</option>
                        {allowedCategoryTypesForBusiness.map((type) => {
                          const typeValue = typeof type === 'object' ? type.type || type.name || type.id : type;
                          const optionValue = String(typeValue);
                          return (
                            <option key={optionValue} value={optionValue}>
                              {formatCategoryLabel({ type: optionValue, name: humanizeCategoryType(optionValue) })}
                            </option>
                          );
                        })}
                      </select>
                    )}
                    {selectedBusinessForPublication && !allowedCategoryTypesForBusiness.length && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Este negocio aún no tiene categorías configuradas.
                      </p>
                    )}
                  </div>
                  <br></br>
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                      <Button variant="danger" type="submit">
                        {editingPublicationId ? 'Actualizar publicación' : 'Publicar'}
                      </Button>
                      {editingPublicationId && (
                        <Button variant="danger" type="button" onClick={resetPublicationForm}>
                          Cancelar edición
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="negocio" className="mt-4">
                <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateBusiness}>
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={businessForm.name}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.type}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="RESTAURANTE">Restaurante</option>
                      <option value="CAFETERIA">Cafetería</option>
                      <option value="BAR">Bar</option>
                      <option value="FOODTRUCK">Foodtruck</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descripción</Label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      rows={3}
                      value={businessForm.description}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Región</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.region || ''}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, region: e.target.value, city: '' }))}
                    >
                      <option value="">Selecciona región</option>
                      {chileRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                      </select>
                    </div>
                  <div>
                    <Label>Ciudad</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                      value={businessForm.city || ''}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, city: e.target.value }))}
                      disabled={!businessForm.region}
                    >
                      <option value="">{businessForm.region ? 'Selecciona ciudad' : 'Selecciona región primero'}</option>
                      {businessFormCityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Dirección</Label>
                    <Input
                      value={businessForm.address}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Teléfono de contacto</Label>
                    <Input
                      type="tel"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Servicios y espacios</Label>
                    <p className="mt-1 text-xs text-muted-foreground">Selecciona todo lo que aplique.</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {businessAmenityOptions.map((amenity) => {
                        const isChecked = businessForm.amenities.includes(amenity.value);
                        return (
                          <label
                            key={amenity.value}
                            className="flex items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-soft transition hover:border-destructive/60"
                          >
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBusinessForm((prev) => {
                                  const current = Array.isArray(prev.amenities) ? prev.amenities : [];
                                  const next = new Set(current);
                                  if (checked) next.add(amenity.value);
                                  else next.delete(amenity.value);
                                  return { ...prev, amenities: Array.from(next) };
                                });
                              }}
                            />
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-input bg-background text-transparent transition peer-focus:ring-2 peer-focus:ring-ring peer-focus:ring-offset-2 peer-focus:ring-offset-background peer-checked:border-destructive peer-checked:bg-destructive peer-checked:text-white">
                              <svg viewBox="0 0 12 9" className="h-3 w-3" aria-hidden="true">
                                <path
                                  d="M1 4.5L4.25 7.5L11 1.25"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span className="text-sm font-medium">{amenity.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <br></br>
                  <div className="md:col-span-2 flex flex-wrap gap-2 justify-center items-center">
                    <Button variant="danger" type="submit">Crear negocio</Button>
                  </div>
                </form>
              </TabsContent>

              {(isOferente || isAdmin) && (
                <TabsContent value="tenant" className="mt-4">
                  <form className="space-y-3" onSubmit={handleCreateTenant}>
                    <div>
                      <Label>Nombre del tenant</Label>
                      <Input
                        value={tenantForm.nombre}
                        onChange={(e) => setTenantForm((prev) => ({ ...prev, nombre: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label>Dominio (opcional)</Label>
                      <Input
                        value={tenantForm.dominio}
                        onChange={(e) => setTenantForm((prev) => ({ ...prev, dominio: e.target.value }))}
                      />
                    </div>
                    <Button type="submit">Crear tenant</Button>
                  </form>
                </TabsContent>
              )}

              {(isOferente || isAdmin) && (
                <TabsContent value="categoria" className="mt-4">
                  <form className="grid gap-3 md:grid-cols-3" onSubmit={handleCreateCategory}>
                    <div className="md:col-span-1">
                      <Label>Nombre</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label>Tipo</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-soft"
                        value={categoryForm.type}
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, type: e.target.value }))}
                        required
                      >
                        <option value="">Selecciona tipo</option>
                        {categoryTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isAdmin && (
                      <div className="md:col-span-1">
                        <Label>Tenant ID</Label>
                        <Input
                          value={categoryForm.tenantId}
                          onChange={(e) => setCategoryForm((prev) => ({ ...prev, tenantId: e.target.value }))}
                          placeholder="Opcional"
                        />
                      </div>
                    )}
                    <div className="md:col-span-3">
                      <Button type="submit">Crear categoría</Button>
                    </div>
                  </form>
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <PinDetailDialog
        open={Boolean(selectedPublication)}
        onOpenChange={(open) => !open && setSelectedPublication(null)}
        publication={selectedPublication}
        onRegisterVisit={handleRegisterVisit}
        onLike={handleLike}
        liked={hasLikedInSession(selectedPublication)}
        saved={selectedPublication ? savedPublicationIdSet.has(String(selectedPublication.id)) : false}
        onSave={handleSavePublication}
        businessLogoUrl={selectedBusinessLogoUrl}
        onViewBusiness={handleViewBusinessProfile}
        onEdit={(pub) => {
          if (pub) {
            handleEditPublication(pub);
            setSelectedPublication(null);
          }
        }}
        onDelete={(id) => {
          if (id) {
            handleDeletePublication(id);
            setSelectedPublication(null);
          }
        }}
        currentUser={currentUser}
        comments={selectedPublicationComments}
        commentsLoading={selectedPublicationCommentsLoading}
        commentSubmitting={commentSubmitting}
        onLoadComments={loadPublicationComments}
        onSubmitComment={handleSubmitComment}
        onSubmitRating={handleSubmitRating}
        ratingSubmitting={ratingSubmitting}
        onEnsureCommentAccess={ensureClientAccess}
      />

      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={cn(
              'rounded-xl px-4 py-3 text-sm font-semibold shadow-hover text-white',
              a.variant === 'danger' && 'bg-rose-500',
              a.variant === 'success' && 'bg-emerald-500',
              a.variant === 'info' && 'bg-sky-500',
              a.variant === 'warning' && 'bg-amber-500'
            )}
          >
            {a.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
