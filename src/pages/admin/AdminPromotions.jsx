import { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Tag,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
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

const CARD_COLORS = ['bg-rose-600', 'bg-amber-600', 'bg-blue-600', 'bg-emerald-600'];

const EMPTY_FORM = {
  name: '',
  scope: 'all',
  clientIds: [],
  startsAt: '',
  endsAt: '',
  fileName: '',
  fileSize: 0,
  itemCount: 0,
  pricesBySku: {},
  importStatus: '',
  importError: '',
};

function formatFileSize(bytes) {
  if (!bytes) return 'Sin archivo';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanCell(value = '') {
  const cleaned = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
  return cleaned.replace(/^"(.*)"$/, '$1').trim();
}

function parsePriceRows(text) {
  if (text.includes('<table') || text.includes('<tr')) {
    const rows = [...text.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(match =>
      [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell => cleanCell(cell[1]))
    );
    return rows.filter(row => row.length >= 3);
  }

  const delimiter = text.includes(';') ? ';' : text.includes('\t') ? '\t' : ',';
  return text
    .split(/\r?\n/)
    .map(line => line.split(delimiter).map(cell => cleanCell(cell)))
    .filter(row => row.some(Boolean));
}

function parsePriceFile(text) {
  const rows = parsePriceRows(text);
  const dataRows = rows.slice(1);
  const pricesBySku = {};
  let invalidRows = 0;

  dataRows.forEach(row => {
    const sku = row[0]?.trim();
    const price = row[2]?.trim();
    if (!sku && !price) return;
    if (!sku || !/^\d+$/.test(price)) {
      invalidRows += 1;
      return;
    }
    pricesBySku[sku] = Number(price);
  });

  return {
    pricesBySku,
    itemCount: Object.keys(pricesBySku).length,
    invalidRows,
  };
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getPromotionState(promotion) {
  const now = Date.now();
  const start = promotion.startsAt ? new Date(promotion.startsAt).getTime() : null;
  const end = promotion.endsAt ? new Date(promotion.endsAt).getTime() : null;

  if (start && now < start) return { label: 'Programada', className: 'text-blue-300 bg-blue-950 border-blue-800' };
  if (end && now > end) return { label: 'Finalizada', className: 'text-gray-300 bg-gray-700 border-gray-600' };
  return { label: 'Activa', className: 'text-emerald-300 bg-emerald-950 border-emerald-800' };
}

export default function AdminPromotions() {
  const { promotions, setPromotions, products } = useApp();
  const { users } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editPromotion, setEditPromotion] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const clients = users.filter(user => user.role === 'client');
  const inputClass = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 placeholder-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  function getAssignedClientIds(promotion) {
    if (promotion.scope === 'all') return clients.map(client => client.id);
    return Array.isArray(promotion.clientIds) ? promotion.clientIds : [];
  }

  function getScopeLabel(promotion) {
    const assignedIds = getAssignedClientIds(promotion);
    if (promotion.scope === 'all' || assignedIds.length === clients.length) return 'Todos los clientes';
    if (assignedIds.length === 1) return '1 cliente seleccionado';
    return `${assignedIds.length} clientes seleccionados`;
  }

  function openCreate() {
    setEditPromotion(null);
    setForm({ ...EMPTY_FORM, clientIds: clients.map(client => client.id) });
    setShowModal(true);
  }

  function openEdit(promotion) {
    setEditPromotion(promotion);
    setForm({
      name: promotion.name || '',
      scope: promotion.scope || 'all',
      clientIds: getAssignedClientIds(promotion),
      startsAt: promotion.startsAt || '',
      endsAt: promotion.endsAt || '',
      fileName: promotion.fileName || '',
      fileSize: promotion.fileSize || 0,
      itemCount: promotion.itemCount || Object.keys(promotion.pricesBySku || {}).length,
      pricesBySku: promotion.pricesBySku || {},
      importStatus: '',
      importError: '',
    });
    setShowModal(true);
  }

  function toggleClient(clientId) {
    setForm(current => ({
      ...current,
      clientIds: current.clientIds.includes(clientId)
        ? current.clientIds.filter(id => id !== clientId)
        : [...current.clientIds, clientId],
    }));
  }

  function downloadTemplate() {
    const rows = [
      ['SKU', 'Nombre producto', 'Precio'],
      ...products.slice(0, 12).map(product => [product.sku, product.name, String(product.basePrice)]),
    ];
    const csv = `\ufeff${rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-promociones-daval.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setForm(current => ({
      ...current,
      fileName: file.name,
      fileSize: file.size,
      importStatus: 'Archivo seleccionado',
      importError: '',
    }));

    const extension = file.name.split('.').pop()?.toLowerCase();
    // Nota dev: el prototipo lee la plantilla CSV descargada. Los .xlsx binarios
    // quedan seleccionados, pero su parseo real debe conectarse al backend o a
    // una libreria dedicada cuando integremos persistencia definitiva.
    if (!['csv', 'txt', 'xls'].includes(extension)) {
      setForm(current => ({
        ...current,
        itemCount: current.itemCount || 0,
        importStatus: 'Archivo listo para guardar',
        importError: 'La vista previa solo lee CSV o la plantilla descargada. El procesamiento XLSX definitivo se conectara con el backend.',
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = parsePriceFile(String(reader.result || ''));
      setForm(current => ({
        ...current,
        pricesBySku: result.pricesBySku,
        itemCount: result.itemCount,
        importStatus: result.itemCount > 0 ? `${result.itemCount} precios detectados` : 'Archivo seleccionado',
        importError: result.invalidRows > 0
          ? `${result.invalidRows} fila${result.invalidRows !== 1 ? 's' : ''} no cumplen la regla: SKU, Nombre producto, Precio solo numerico.`
          : '',
      }));
    };
    reader.readAsText(file);
  }

  function handleSave() {
    if (!form.name || !form.startsAt || !form.endsAt || !form.fileName) return;
    if (form.scope === 'selected' && form.clientIds.length === 0) return;
    if (new Date(form.startsAt).getTime() >= new Date(form.endsAt).getTime()) return;

    const promotionId = editPromotion?.id || promotions.reduce((max, promotion) => Math.max(max, promotion.id), 0) + 1;
    const selectedClientIds = form.scope === 'all'
      ? clients.map(client => client.id)
      : form.clientIds.map(Number);

    const payload = {
      id: promotionId,
      name: form.name,
      description: form.scope === 'all' ? 'Promocion para todos los clientes' : 'Promocion para clientes seleccionados',
      scope: form.scope,
      clientIds: selectedClientIds,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      fileName: form.fileName,
      fileSize: form.fileSize,
      itemCount: form.itemCount,
      pricesBySku: form.pricesBySku,
      updatedAt: new Date().toISOString(),
    };

    if (editPromotion) {
      setPromotions(prev => prev.map(promotion => promotion.id === editPromotion.id ? { ...promotion, ...payload } : promotion));
    } else {
      setPromotions(prev => [...prev, payload]);
    }

    setShowModal(false);
  }

  const hasInvalidDates = form.startsAt && form.endsAt && new Date(form.startsAt).getTime() >= new Date(form.endsAt).getTime();
  const canSave = form.name && form.startsAt && form.endsAt && form.fileName && !hasInvalidDates && (form.scope === 'all' || form.clientIds.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Promociones</h2>
          <p className="text-sm text-gray-400 mt-1">Crea precios promocionales por archivo con vigencia definida</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva promocion
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 px-5 py-16 text-center">
          <Tag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay promociones creadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {promotions.map((promotion, idx) => {
            const state = getPromotionState(promotion);
            const exactPriceCount = promotion.itemCount || Object.keys(promotion.pricesBySku || {}).length;
            return (
              <div key={promotion.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
                <div className={`h-2 ${CARD_COLORS[idx % CARD_COLORS.length]}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${CARD_COLORS[idx % CARD_COLORS.length]} flex-shrink-0`}>
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-100 text-lg truncate">{promotion.name}</h3>
                        <p className="text-xs text-gray-400">{getScopeLabel(promotion)}</p>
                      </div>
                    </div>
                    <button onClick={() => openEdit(promotion)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-sm text-gray-400">Estado</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${state.className}`}>{state.label}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-700">
                      <span className="text-sm text-gray-400">Precios cargados</span>
                      <span className="text-sm font-bold text-emerald-400">{exactPriceCount || 'Pendiente'}</span>
                    </div>
                    <div className="space-y-1 py-2">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Desde: <span className="text-gray-300">{formatDateTime(promotion.startsAt)}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Hasta: <span className="text-gray-300">{formatDateTime(promotion.endsAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      Plantilla requerida: <span className="font-semibold text-gray-200">SKU - Nombre producto - Precio</span>.
                      El precio debe ir solo con numeros.
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editPromotion ? `Editar ${editPromotion.name}` : 'Nueva promocion'} onClose={() => setShowModal(false)}>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Nombre de la promocion *</label>
              <input
                className={inputClass}
                value={form.name}
                onChange={e => setForm(current => ({ ...current, name: e.target.value }))}
                placeholder="Ej. Promocion Abril Ferreterias"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha y hora desde *</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.startsAt}
                  onChange={e => setForm(current => ({ ...current, startsAt: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Fecha y hora hasta *</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.endsAt}
                  onChange={e => setForm(current => ({ ...current, endsAt: e.target.value }))}
                />
              </div>
            </div>
            {hasInvalidDates && (
              <div className="rounded-lg border border-red-900 bg-red-950 p-3">
                <p className="text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  La fecha final debe ser posterior a la fecha inicial.
                </p>
              </div>
            )}

            <div>
              <label className={labelClass}>Aplicacion de la promocion *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm(current => ({ ...current, scope: 'all', clientIds: clients.map(client => client.id) }))}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    form.scope === 'all' ? 'border-blue-500 bg-blue-950 text-blue-200' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Users className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Todos los clientes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm(current => ({ ...current, scope: 'selected', clientIds: current.clientIds.length ? current.clientIds : [] }))}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    form.scope === 'selected' ? 'border-blue-500 bg-blue-950 text-blue-200' : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-semibold">Clientes seleccionados</span>
                </button>
              </div>
            </div>

            {form.scope === 'selected' && (
              <div className="rounded-xl border border-gray-700 bg-gray-900 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-200">Selecciona uno o varios clientes</p>
                  <span className="text-xs text-gray-500">{form.clientIds.length} seleccionados</span>
                </div>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {clients.map(client => (
                    <label key={client.id} className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.clientIds.includes(client.id)}
                        onChange={() => toggleClient(client.id)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span className="flex-1 min-w-0 truncate">{client.name}</span>
                      <span className="text-xs text-gray-500 truncate">{client.email}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    Archivo de precios promocionales *
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Columnas: SKU, Nombre producto, Precio sin puntos ni comas.</p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar plantilla
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition">
                <Upload className="w-9 h-9 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">{form.fileName || 'Selecciona la plantilla diligenciada'}</p>
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-400 hover:text-blue-300">Buscar archivo</span>
                  <input type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={handleFileSelect} />
                </label>
                {form.fileName && (
                  <p className="text-xs text-gray-500 mt-2">
                    {form.fileName} · {formatFileSize(form.fileSize)}
                  </p>
                )}
              </div>

              {(form.importStatus || form.importError) && (
                <div className={`rounded-lg border p-3 ${form.importError ? 'border-amber-800 bg-amber-950' : 'border-emerald-800 bg-emerald-950'}`}>
                  <p className={`text-xs flex items-start gap-2 ${form.importError ? 'text-amber-200' : 'text-emerald-300'}`}>
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{form.importError || form.importStatus}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editPromotion ? 'Guardar cambios' : 'Crear promocion'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
