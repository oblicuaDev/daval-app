import { useState, useMemo } from 'react';
import {
  Users, Download, Upload, RefreshCw, Search, CheckCircle2,
  AlertCircle, Loader2, Building2, ChevronLeft, ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  useSiigoCustomerPreview,
  useLocalCompaniesSyncStatus,
  useImportSiigoCustomer,
  useImportSiigoBatch,
  useExportCompanyToSiigo,
} from '../../hooks/useSiigo';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(d) {
  return d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function SyncBadge({ status }) {
  const map = {
    synced:       'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
    error:        'bg-red-900/40 text-red-300 border-red-700/40',
    pending:      'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
    local:        'bg-gray-700/60 text-gray-400 border-gray-600/40',
    bidirectional:'bg-blue-900/40 text-blue-300 border-blue-700/40',
  };
  const labels = {
    synced: 'Sincronizado', error: 'Error', pending: 'Pendiente',
    local: 'Solo local', bidirectional: 'Bidireccional',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${map[status] ?? 'bg-gray-700 text-gray-300'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function OriginBadge({ origin }) {
  const map = {
    siigo:         'text-blue-400',
    local:         'text-gray-400',
    bidirectional: 'text-emerald-400',
  };
  const labels = { siigo: 'SIIGO', local: 'Local', bidirectional: 'Bidireccional' };
  return (
    <span className={`text-xs font-medium ${map[origin] ?? 'text-gray-400'}`}>
      {labels[origin] ?? origin}
    </span>
  );
}

function Banner({ kind, children }) {
  const cls = kind === 'success'
    ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-200'
    : 'bg-red-950/40 border-red-700/40 text-red-200';
  return (
    <div className={`border rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${cls}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

// ── Tab: Importar desde SIIGO ──────────────────────────────────────────────────

function ImportTab() {
  const [search,    setSearch]    = useState({ name: '', identification: '' });
  const [committed, setCommitted] = useState({ name: '', identification: '' });
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(new Set());
  const [batchResult, setBatchResult] = useState(null);

  const PAGE_SIZE = 25;
  const importOne  = useImportSiigoCustomer();
  const importMany = useImportSiigoBatch();

  const queryParams = useMemo(() => ({
    page,
    page_size: PAGE_SIZE,
    ...(committed.name           && { name:           committed.name }),
    ...(committed.identification && { identification: committed.identification }),
  }), [page, committed]);

  const { data, isLoading, isError, error, isFetching } = useSiigoCustomerPreview(queryParams);
  const items    = data?.items    ?? [];
  const total    = data?.total    ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearch(e) {
    e.preventDefault();
    setCommitted({ ...search });
    setPage(1);
    setSelected(new Set());
    setBatchResult(null);
  }

  function toggleSelect(siigoId) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(siigoId) ? next.delete(siigoId) : next.add(siigoId);
      return next;
    });
  }

  function toggleSelectAll() {
    const importable = items.filter((c) => !c.alreadyImported).map((c) => c.siigoId);
    if (importable.every((id) => selected.has(id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        importable.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...importable]));
    }
  }

  async function handleImportOne(siigoId) {
    setBatchResult(null);
    await importOne.mutateAsync(siigoId);
  }

  async function handleImportBatch() {
    setBatchResult(null);
    const result = await importMany.mutateAsync([...selected]);
    setBatchResult(result);
    setSelected(new Set());
  }

  const importableSelected = [...selected].filter((id) => {
    const item = items.find((c) => c.siigoId === id);
    return item && !item.alreadyImported;
  });

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search.name}
            onChange={(e) => setSearch({ ...search, name: e.target.value })}
            placeholder="Buscar por nombre…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            value={search.identification}
            onChange={(e) => setSearch({ ...search, identification: e.target.value })}
            placeholder="Buscar por NIT…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm disabled:opacity-50 transition">
          <Search className="w-3.5 h-3.5" />
          Buscar
        </button>
      </form>

      {/* Acciones de selección */}
      {items.length > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={toggleSelectAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition">
            {items.filter((c) => !c.alreadyImported).every((c) => selected.has(c.siigoId))
              ? 'Deseleccionar todos' : 'Seleccionar no importados'}
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleImportBatch}
              disabled={importMany.isPending || importableSelected.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm disabled:opacity-50 transition"
            >
              {importMany.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              Importar seleccionados ({importableSelected.length})
            </button>
          )}
        </div>
      )}

      {/* Resultado batch */}
      {batchResult && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm space-y-2">
          <p className="font-semibold text-gray-200">Resultado de importación masiva</p>
          <div className="flex gap-4 flex-wrap">
            <span className="text-emerald-300">Creados: {batchResult.imported?.length ?? 0}</span>
            <span className="text-blue-300">Actualizados: {batchResult.updated?.length ?? 0}</span>
            <span className="text-red-300">Errores: {batchResult.errors?.length ?? 0}</span>
          </div>
          {batchResult.errors?.length > 0 && (
            <ul className="text-xs text-red-400 space-y-0.5 mt-1">
              {batchResult.errors.map((e) => (
                <li key={e.siigoId}>ID {e.siigoId}: {e.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {importOne.error && <Banner kind="error">{importOne.error?.response?.data?.message ?? importOne.error.message}</Banner>}
      {importMany.error && <Banner kind="error">{importMany.error?.response?.data?.message ?? importMany.error.message}</Banner>}

      {/* Tabla */}
      {isError && <Banner kind="error">{error?.response?.data?.message ?? error?.message}</Banner>}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {isLoading ? 'Consultando SIIGO…' : `${total} clientes en SIIGO`}
          </span>
          {isFetching && !isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">NIT</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {isLoading && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td></tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">
                  Sin resultados. Ajusta los filtros.
                </td></tr>
              )}
              {items.map((c) => (
                <tr key={c.siigoId} className={`hover:bg-gray-700/30 transition-colors ${selected.has(c.siigoId) ? 'bg-blue-950/20' : ''}`}>
                  <td className="px-4 py-3">
                    {!c.alreadyImported && (
                      <input type="checkbox" checked={selected.has(c.siigoId)}
                        onChange={() => toggleSelect(c.siigoId)}
                        className="rounded border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-100">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{c.identification}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.city ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{c.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    {c.alreadyImported ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Importado
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">No importado</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!c.alreadyImported && (
                      <button
                        type="button"
                        onClick={() => handleImportOne(c.siigoId)}
                        disabled={importOne.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/60 text-emerald-300 text-xs font-medium disabled:opacity-50 transition"
                      >
                        {importOne.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Download className="w-3.5 h-3.5" />}
                        Importar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-700 flex items-center justify-between text-sm">
            <span className="text-gray-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-40 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-40 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Estado local ──────────────────────────────────────────────────────────

function LocalTab() {
  const [syncFilter, setSyncFilter] = useState('');
  const [exportError, setExportError] = useState(null);

  const exportCompany = useExportCompanyToSiigo();
  const { data: items = [], isLoading } = useLocalCompaniesSyncStatus(
    syncFilter ? { sync_status: syncFilter } : {}
  );

  async function handleExport(companyId) {
    setExportError(null);
    try {
      await exportCompany.mutateAsync(companyId);
    } catch (err) {
      setExportError(err?.response?.data?.message ?? err.message);
    }
  }

  const filterOptions = [
    { value: '',           label: 'Todos' },
    { value: 'synced',     label: 'Sincronizados' },
    { value: 'local',      label: 'Solo locales' },
    { value: 'error',      label: 'Con error' },
    { value: 'bidirectional', label: 'Bidireccional' },
  ];

  return (
    <div className="space-y-4">
      {/* Filtro de estado */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSyncFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              syncFilter === opt.value
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {exportError && <Banner kind="error">{exportError}</Banner>}

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <span className="text-xs text-gray-400">{isLoading ? 'Cargando…' : `${items.length} empresas`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">NIT</th>
                <th className="px-4 py-3 font-medium">Origen</th>
                <th className="px-4 py-3 font-medium">Estado SIIGO</th>
                <th className="px-4 py-3 font-medium">Última sync</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {isLoading && (
                <tr><td colSpan={6} className="py-10 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500 mx-auto" />
                </td></tr>
              )}
              {!isLoading && items.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-500">Sin empresas.</td></tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-100">{c.name}</div>
                    {c.siigoCustomerId && (
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{c.siigoCustomerId}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-300">{c.nit}</td>
                  <td className="px-4 py-3"><OriginBadge origin={c.siigoOrigin} /></td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <SyncBadge status={c.siigoSyncStatus} />
                      {c.siigoLastError && (
                        <p className="text-xs text-red-400 truncate max-w-[200px]">{c.siigoLastError}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {fmt(c.siigoLastSyncAt ?? c.siigoLastImportAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleExport(c.id)}
                      disabled={exportCompany.isPending}
                      title={c.siigoCustomerId ? 'Actualizar en SIIGO' : 'Crear en SIIGO'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-800 text-blue-300 hover:bg-blue-950/60 text-xs font-medium disabled:opacity-50 transition"
                    >
                      {exportCompany.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Upload className="w-3.5 h-3.5" />}
                      {c.siigoCustomerId ? 'Actualizar' : 'Exportar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────

export default function AdminSiigoCustomers() {
  const [tab, setTab] = useState('import');

  const tabs = [
    { id: 'import', label: 'Importar desde SIIGO', icon: Download },
    { id: 'local',  label: 'Estado sincronización', icon: RefreshCw },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-blue-400" />
        <div>
          <h2 className="text-xl font-semibold text-gray-100">Clientes SIIGO</h2>
          <p className="text-xs text-gray-500 mt-0.5">Sincronización bidireccional de empresas</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-700">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'import' && <ImportTab />}
      {tab === 'local'  && <LocalTab />}
    </div>
  );
}
