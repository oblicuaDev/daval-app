import { useState } from 'react';
import { Plug, RefreshCw, ShieldCheck, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  useSiigoSettings, useSaveSiigoSettings, useTestSiigoConnection,
  useSiigoSyncStatus, useStartSiigoSync, useSiigoLogs,
} from '../../hooks/useSiigo';

const fmt = (d) => (d ? new Date(d).toLocaleString('es-CO') : '—');

export default function AdminIntegrations() {
  const { data: settings, isLoading } = useSiigoSettings();
  const save = useSaveSiigoSettings();
  const test = useTestSiigoConnection();
  const startSync = useStartSiigoSync();
  const { data: status } = useSiigoSyncStatus();
  const { data: logs = [] } = useSiigoLogs(20);

  const [form, setForm] = useState({ partnerId: '', username: '', accessKey: '', baseUrl: '' });

  const canSubmit = form.partnerId || form.username || form.accessKey || form.baseUrl;
  const isRunning = !!status?.running;

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {};
    for (const k of ['partnerId', 'username', 'accessKey', 'baseUrl']) {
      if (form[k]) payload[k] = form[k];
    }
    save.mutate(payload, {
      onSuccess: () => setForm((f) => ({ ...f, accessKey: '' })),
    });
  };

  if (isLoading) {
    return <div className="text-gray-400">Cargando configuración…</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <header className="flex items-center gap-3">
        <Plug className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-100">Integraciones · SIIGO</h2>
      </header>

      {/* Configuración */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Configuración</h3>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Partner ID" placeholder={settings?.partnerId ?? '—'}
            value={form.partnerId}
            onChange={(v) => setForm({ ...form, partnerId: v })} />
          <Field label="Username" placeholder={settings?.username ?? '—'}
            value={form.username}
            onChange={(v) => setForm({ ...form, username: v })} />
          <Field label="Access key" type="password"
            placeholder={settings?.accessKeySet ? `actual: ${settings.accessKey}` : 'no configurado'}
            value={form.accessKey}
            onChange={(v) => setForm({ ...form, accessKey: v })}
            help="Solo se actualiza si escribes un valor nuevo." />
          <Field label="Base URL"
            placeholder={settings?.baseUrl ?? 'https://api.siigo.com'}
            value={form.baseUrl}
            onChange={(v) => setForm({ ...form, baseUrl: v })} />

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button type="button"
              disabled={test.isPending}
              onClick={() => test.mutate()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-700 disabled:opacity-50 transition">
              {test.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Probar conexión
            </button>
            <button type="submit"
              disabled={!canSubmit || save.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition">
              {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>

        {test.data && (
          <Banner kind="success">
            Conectado como <b>{test.data.username}</b>. Token expira el {fmt(test.data.tokenExpiresAt)}.
            Productos visibles en SIIGO: {test.data.productCountSample ?? '—'}.
          </Banner>
        )}
        {test.error && <Banner kind="error">{test.error.message}</Banner>}
        {save.error && <Banner kind="error">{save.error.message}</Banner>}
      </section>

      {/* Sincronización */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200">Sincronización de productos</h3>
          <button
            type="button"
            disabled={isRunning || startSync.isPending}
            onClick={() => startSync.mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition">
            {(isRunning || startSync.isPending)
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
            {isRunning ? 'Sincronizando…' : 'Sincronizar ahora'}
          </button>
        </div>

        <SummaryGrid status={status} settings={settings} />
        {startSync.error && <Banner kind="error">{startSync.error.message}</Banner>}
      </section>

      {/* Historial */}
      <section className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Historial</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500 border-b border-gray-700">
              <tr>
                <th className="py-2 pr-4 font-medium">Inicio</th>
                <th className="py-2 pr-4 font-medium">Fin</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
                <th className="py-2 pr-4 font-medium">Procesados</th>
                <th className="py-2 pr-4 font-medium">Creados</th>
                <th className="py-2 pr-4 font-medium">Actualizados</th>
                <th className="py-2 pr-4 font-medium">Por</th>
                <th className="py-2 pr-4 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-gray-500">Sin ejecuciones aún.</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-gray-700/50">
                  <td className="py-2 pr-4 text-gray-300">{fmt(l.started_at)}</td>
                  <td className="py-2 pr-4 text-gray-300">{fmt(l.finished_at)}</td>
                  <td className="py-2 pr-4"><StatusPill status={l.status} /></td>
                  <td className="py-2 pr-4 text-gray-300">{l.items_processed}</td>
                  <td className="py-2 pr-4 text-gray-300">{l.items_created}</td>
                  <td className="py-2 pr-4 text-gray-300">{l.items_updated}</td>
                  <td className="py-2 pr-4 text-gray-400">{l.triggered_by_name ?? '—'}</td>
                  <td className="py-2 pr-4 text-red-400 truncate max-w-xs">{l.error_message ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <ExternalLink className="w-3 h-3" />
        Endpoints: <code className="bg-gray-800 px-1.5 py-0.5 rounded">/integrations/siigo/*</code>
      </p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, help, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-500"
        autoComplete="off"
      />
      {help && <span className="text-[11px] text-gray-500 mt-1 block">{help}</span>}
    </label>
  );
}

function Banner({ kind, children }) {
  const cls = kind === 'success'
    ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-200'
    : 'bg-red-950/40 border-red-700/40 text-red-200';
  return (
    <div className={`mt-4 border rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${cls}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    success: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
    error:   'bg-red-900/40 text-red-300 border-red-700/40',
    running: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${map[status] ?? 'bg-gray-700 text-gray-300'}`}>
      {status}
    </span>
  );
}

function SummaryGrid({ status, settings }) {
  const last = status?.last;
  const items = [
    { label: 'Última ejecución',  value: fmt(last?.started_at) },
    { label: 'Estado',            value: last ? <StatusPill status={last.status} /> : '—' },
    { label: 'Procesados',        value: last?.items_processed ?? 0 },
    { label: 'Creados / Actualizados', value: `${last?.items_created ?? 0} / ${last?.items_updated ?? 0}` },
    { label: 'Token expira',      value: fmt(settings?.tokenExpiresAt) },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {items.map((it) => (
        <div key={it.label} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-500">{it.label}</div>
          <div className="text-sm text-gray-100 mt-1">{it.value}</div>
        </div>
      ))}
      {last?.error_message && (
        <div className="md:col-span-5 text-xs text-red-300 mt-2">{last.error_message}</div>
      )}
    </div>
  );
}
