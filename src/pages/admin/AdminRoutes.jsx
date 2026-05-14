import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  Crosshair,
  ExternalLink,
  Loader2,
  Map,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useRoutes, useCreateRoute, useUpdateRoute, useDeleteRoute } from '../../hooks/useRoutes.js';
import ConfirmDialog from '../../components/ConfirmDialog';
import { loadGoogleMaps } from '../../utils/loadGoogleMaps.js';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DEFAULT_CENTER = { lat: 4.711, lng: -74.0721 };
const DEFAULT_BOUNDS = {
  north: 4.735,
  south: 4.685,
  east: -74.045,
  west: -74.105,
};

const EMPTY_FORM = {
  name: '',
  day: 'Lunes',
  cutoffTime: '16:00',
  city: 'Bogotá',
  mapZone: 'Bogotá, Colombia',
  quadrantId: 'custom',
  quadrantName: 'Cobertura personalizada',
  streetFrom: '',
  streetTo: '',
  carreraFrom: '',
  carreraTo: '',
  bounds: DEFAULT_BOUNDS,
  center: DEFAULT_CENTER,
  active: true,
};

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#374151' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#f3f4f6' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function serializeBounds(bounds) {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    north: Number(ne.lat().toFixed(7)),
    south: Number(sw.lat().toFixed(7)),
    east: Number(ne.lng().toFixed(7)),
    west: Number(sw.lng().toFixed(7)),
  };
}

function boundsToGoogle(maps, bounds) {
  return new maps.LatLngBounds(
    { lat: bounds.south, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east }
  );
}

function edgePoints(bounds) {
  const midLat = (bounds.north + bounds.south) / 2;
  const midLng = (bounds.east + bounds.west) / 2;
  
  return {
    streetFrom: { lat: bounds.south, lng: midLng },
    streetTo: { lat: bounds.north, lng: midLng },
    carreraFrom: { lat: midLat, lng: bounds.west },
    carreraTo: { lat: midLat, lng: bounds.east },
  };
}

function routeNameFromResult(result) {
  const route = result?.address_components?.find(component => component.types.includes('route'));
  if (route?.long_name) return route.long_name;
  return result?.formatted_address?.split(',')[0] || '';
}

function geocodeLatLng(geocoder, point) {
  return new Promise(resolve => {
    geocoder.geocode({ location: point }, (results, status) => {
      console.log(results);
      
      if (status !== 'OK' || !results?.length) {
        resolve('');
        return;
      }
      resolve(routeNameFromResult(results[0]));
    });
  });
}

function CoverageMap({ form, onCoverageChange, onGeocodeStatus }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const rectangleRef = useRef(null);
  const geocoderRef = useRef(null);
  const debounceRef = useRef(null);
  const [loadError, setLoadError] = useState('');

  const geocodeBounds = useCallback(async bounds => {
    if (!geocoderRef.current) return;
    onGeocodeStatus('loading');

    const points = edgePoints(bounds);
    const [streetFrom, streetTo, carreraFrom, carreraTo] = await Promise.all([
      geocodeLatLng(geocoderRef.current, points.streetFrom),
      geocodeLatLng(geocoderRef.current, points.streetTo),
      geocodeLatLng(geocoderRef.current, points.carreraFrom),
      geocodeLatLng(geocoderRef.current, points.carreraTo),
    ]);

    onCoverageChange({
      bounds,
      center: {
        lat: Number(((bounds.north + bounds.south) / 2).toFixed(7)),
        lng: Number(((bounds.east + bounds.west) / 2).toFixed(7)),
      },
      streetFrom,
      streetTo,
      carreraFrom,
      carreraTo,
      quadrantName: 'Cobertura personalizada',
      quadrantId: 'custom',
    });
    onGeocodeStatus('ready');
  }, [onCoverageChange, onGeocodeStatus]);

  useEffect(() => {
    let mounted = true;

    loadGoogleMaps()
      .then(maps => {
        if (!mounted || !mapNodeRef.current) return;

        // Detectar error de billing/API de Google Maps antes de inicializar
        if (!maps.Map) {
          setLoadError('Google Maps no pudo inicializar. Verifica que Maps JavaScript API y Geocoding API estén habilitadas en Google Cloud Console y que haya billing configurado.');
          return;
        }

        const map = new maps.Map(mapNodeRef.current, {
          center: form.center || DEFAULT_CENTER,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: MAP_STYLES,
        });
        const rectangle = new maps.Rectangle({
          bounds: boundsToGoogle(maps, form.bounds || DEFAULT_BOUNDS),
          editable: true,
          draggable: true,
          strokeColor: '#60a5fa',
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: '#2563eb',
          fillOpacity: 0.24,
          map,
        });

        map.fitBounds(rectangle.getBounds(), 48);
        mapRef.current = map;
        rectangleRef.current = rectangle;
        geocoderRef.current = new maps.Geocoder();

        const scheduleUpdate = () => {
          window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => {
            const nextBounds = serializeBounds(rectangle.getBounds());
            geocodeBounds(nextBounds);
          }, 450);
        };

        rectangle.addListener('bounds_changed', scheduleUpdate);
        geocodeBounds(serializeBounds(rectangle.getBounds()));
      })
      .catch(error => setLoadError(error.message));

    return () => {
      mounted = false;
      window.clearTimeout(debounceRef.current);
      rectangleRef.current?.setMap(null);
    };
  }, [geocodeBounds]);

  async function centerOnZone() {
    const maps = await loadGoogleMaps();
    if (!mapRef.current || !rectangleRef.current || !geocoderRef.current) return;

    onGeocodeStatus('loading');
    geocoderRef.current.geocode({ address: form.mapZone, region: 'CO' }, (results, status) => {
      if (status !== 'OK' || !results?.length) {
        onGeocodeStatus('ready');
        return;
      }

      const result = results[0];
      const viewport = result.geometry.viewport;
      const map = mapRef.current;
      const rectangle = rectangleRef.current;

      map.fitBounds(viewport, 48);
      const nextBounds = serializeBounds(viewport);
      const latPadding = Math.max((nextBounds.north - nextBounds.south) * 0.28, 0.018);
      const lngPadding = Math.max((nextBounds.east - nextBounds.west) * 0.28, 0.018);
      const center = result.geometry.location;
      const focusedBounds = {
        north: Number((center.lat() + latPadding).toFixed(7)),
        south: Number((center.lat() - latPadding).toFixed(7)),
        east: Number((center.lng() + lngPadding).toFixed(7)),
        west: Number((center.lng() - lngPadding).toFixed(7)),
      };

      rectangle.setBounds(boundsToGoogle(maps, focusedBounds));
      map.fitBounds(rectangle.getBounds(), 48);
      geocodeBounds(focusedBounds);
    });
  }

  if (loadError) {
    return (
      <div className="bg-gray-900 border border-red-900 rounded-xl p-6 space-y-2">
        <div className="flex items-center gap-2 text-red-300 font-semibold">
          <Map className="w-4 h-4" />
          Google Maps no disponible
        </div>
        <p className="text-sm text-gray-400">{loadError}</p>
        <p className="text-xs text-gray-500">
          Verificar en Google Cloud Console: Maps JavaScript API, Geocoding API habilitadas y billing activo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <Map className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-sm font-semibold text-gray-100 truncate">Cobertura Google Maps</p>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.mapZone)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200 transition flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir mapa
        </a>
      </div>

      <div className="px-4 py-3 border-b border-gray-700">
        <button
          type="button"
          onClick={centerOnZone}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
        >
          <Crosshair className="w-4 h-4" />
          Centrar en zona
        </button>
      </div>

      <div ref={mapNodeRef} className="h-[430px] bg-gray-950" />
    </div>
  );
}

export default function AdminRoutes() {
  const { data: routes = [], isLoading } = useRoutes();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const deleteRoute = useDeleteRoute();

  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [geocodeStatus, setGeocodeStatus] = useState('idle');
  const [routeToDelete, setRouteToDelete] = useState(null);

  const inputClass = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500';
  const readOnlyClass = 'w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-gray-300 cursor-default';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  const handleCoverageChange = useCallback(updates => {
    setForm(prev => ({ ...prev, ...updates }));
  }, []);

  function openCreate() {
    setEditingRoute(null);
    setForm(EMPTY_FORM);
    setGeocodeStatus('idle');
    setShowModal(true);
  }

  function openEdit(route) {
    setEditingRoute(route);
    setForm({
      ...EMPTY_FORM,
      name: route.name,
      day: route.day,
      cutoffTime: route.cutoffTime || EMPTY_FORM.cutoffTime,
      city: route.city || EMPTY_FORM.city,
      mapZone: route.mapZone || EMPTY_FORM.mapZone,
      quadrantId: route.quadrantId || 'custom',
      quadrantName: route.quadrantName || 'Cobertura personalizada',
      streetFrom: route.streetFrom || '',
      streetTo: route.streetTo || '',
      carreraFrom: route.carreraFrom || '',
      carreraTo: route.carreraTo || '',
      bounds: route.bounds || EMPTY_FORM.bounds,
      center: route.center || EMPTY_FORM.center,
      active: route.active,
    });
    setGeocodeStatus('idle');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.day || !form.cutoffTime || !form.bounds) return;
    const body = {
      name: form.name,
      day: form.day,
      cutoffTime: form.cutoffTime,
      city: form.city,
      mapZone: form.mapZone,
      quadrantId: form.quadrantId,
      quadrantName: form.quadrantName,
      streetFrom: form.streetFrom,
      streetTo: form.streetTo,
      carreraFrom: form.carreraFrom,
      carreraTo: form.carreraTo,
      bounds: form.bounds,
      center: form.center,
      active: form.active,
    };
    if (editingRoute) {
      await updateRoute.mutateAsync({ id: editingRoute.id, body });
    } else {
      await createRoute.mutateAsync(body);
    }
    setShowModal(false);
  }

  async function handleDelete(routeId) {
    await deleteRoute.mutateAsync(routeId);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Rutas</h2>
          <p className="text-sm text-gray-400 mt-1">{routes.length} ruta{routes.length !== 1 ? 's' : ''} configurada{routes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Ruta
        </button>
      </div>

      {isLoading ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 px-5 py-16 text-center">
          <p className="text-sm text-gray-500">Cargando rutas…</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 px-5 py-16 text-center">
          <Map className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay rutas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {routes.map(route => (
            <div key={route.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="w-11 h-11 bg-blue-950 text-blue-300 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-gray-100">{route.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{route.quadrantName || 'Cobertura personalizada'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    {route.day} · Recibe hasta {route.cutoffTime || 'sin hora definida'}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(route)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setRouteToDelete(route)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-700 border-t border-gray-700">
                <div className="bg-gray-900 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Calle inicial</p>
                  <p className="text-sm font-semibold text-gray-200">{route.streetFrom || 'Por validar'}</p>
                </div>
                <div className="bg-gray-900 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Calle final</p>
                  <p className="text-sm font-semibold text-gray-200">{route.streetTo || 'Por validar'}</p>
                </div>
                <div className="bg-gray-900 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Carrera inicial</p>
                  <p className="text-sm font-semibold text-gray-200">{route.carreraFrom || 'Por validar'}</p>
                </div>
                <div className="bg-gray-900 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">Carrera final</p>
                  <p className="text-sm font-semibold text-gray-200">{route.carreraTo || 'Por validar'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingRoute ? 'Editar Ruta' : 'Nueva Ruta'} onClose={() => setShowModal(false)}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-6">
            <CoverageMap
              form={form}
              onCoverageChange={handleCoverageChange}
              onGeocodeStatus={setGeocodeStatus}
            />

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nombre de la ruta *</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej. Ruta Norte Empresarial"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Día de la semana *</label>
                  <select
                    className={inputClass}
                    value={form.day}
                    onChange={e => setForm(prev => ({ ...prev, day: e.target.value }))}
                  >
                    {WEEK_DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Hora máxima para cotizaciones *</label>
                  <input
                    type="time"
                    className={inputClass}
                    value={form.cutoffTime}
                    onChange={e => setForm(prev => ({ ...prev, cutoffTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Ciudad</label>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={e => setForm(prev => ({ ...prev, city: e.target.value, mapZone: `${e.target.value}, Colombia` }))}
                  placeholder="Bogotá"
                />
              </div>

              <div className="rounded-xl border border-blue-900 bg-blue-950 px-4 py-3">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-1">Regla de recepción</p>
                <p className="text-sm text-blue-100">
                  Los clientes de esta ruta podrán montar cotizaciones hasta el día anterior a la ruta a las {form.cutoffTime || '00:00'}.
                </p>
              </div>

              <div>
                <label className={labelClass}>Zona base de búsqueda</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    className={`${inputClass} pl-9`}
                    value={form.mapZone}
                    onChange={e => setForm(prev => ({ ...prev, mapZone: e.target.value }))}
                    placeholder="Ej. Chapinero, Bogotá, Colombia"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-4 py-3">
                {geocodeStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 text-blue-400" />
                )}
                <p className="text-sm text-gray-300">
                  {geocodeStatus === 'loading' ? 'Actualizando calles y carreras con Google Maps' : 'Mueve o ajusta el rectángulo para recalcular la cobertura'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Calle inicial</label>
                  <input className={readOnlyClass} value={form.streetFrom || 'Por validar'} readOnly />
                </div>
                <div>
                  <label className={labelClass}>Calle final</label>
                  <input className={readOnlyClass} value={form.streetTo || 'Por validar'} readOnly />
                </div>
                <div>
                  <label className={labelClass}>Carrera inicial</label>
                  <input className={readOnlyClass} value={form.carreraFrom || 'Por validar'} readOnly />
                </div>
                <div>
                  <label className={labelClass}>Carrera final</label>
                  <input className={readOnlyClass} value={form.carreraTo || 'Por validar'} readOnly />
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-900 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Coordenadas de cobertura</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <span>Norte: {form.bounds?.north}</span>
                  <span>Sur: {form.bounds?.south}</span>
                  <span>Este: {form.bounds?.east}</span>
                  <span>Oeste: {form.bounds?.west}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!form.name || !form.day || !form.cutoffTime || !form.bounds}
                >
                  {editingRoute ? 'Guardar cambios' : 'Crear Ruta'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {routeToDelete && (
        <ConfirmDialog
          title="Eliminar ruta"
          message={`Confirma que deseas eliminar la ruta "${routeToDelete.name}". Las sucursales que la usen quedaran sin esta referencia cuando se conecte el guardado real.`}
          onCancel={() => setRouteToDelete(null)}
          onConfirm={() => {
            handleDelete(routeToDelete.id);
            setRouteToDelete(null);
          }}
        />
      )}
    </div>
  );
}
