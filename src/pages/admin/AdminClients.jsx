import { useState } from 'react';
import { Plus, X, Phone, MapPin, Calendar, Building, GitBranch } from 'lucide-react';
import { useUsers, useCreateUser } from '../../hooks/useUsers.js';
import { usePriceLists } from '../../hooks/usePriceLists.js';
import { useCompanies } from '../../hooks/useCompanies.js';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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

const EMPTY_FORM = {
  name: '', email: '', password: '',
  priceListId: '', branchId: '', companyId: '',
};

export default function AdminClients() {
  const { data: clients = [], isLoading } = useUsers({ role: 'client' });
  const { data: priceLists = [] } = usePriceLists();
  const { data: companies = [] } = useCompanies();
  const createUser = useCreateUser();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const availableBranches = form.companyId
    ? (companies.find(c => String(c.id) === String(form.companyId))?.branches || [])
    : [];

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function handleCompanyChange(e) {
    setForm(f => ({ ...f, companyId: e.target.value, branchId: '' }));
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.password) return;
    await createUser.mutateAsync({
      name: form.name,
      email: form.email,
      password: form.password,
      role: 'client',
      priceListId: form.priceListId || undefined,
      branchId: form.branchId || undefined,
      companyId: form.companyId || undefined,
    });
    setShowModal(false);
  }

  const inputClass = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Clientes</h2>
          <p className="text-sm text-gray-400 mt-1">{clients.length} clientes registrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Empresa / Sucursal</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Lista de Precios</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">Cargando…</td>
                </tr>
              )}
              {clients.map(client => {
                const initials = (client.name || '').substring(0, 2).toUpperCase();
                return (
                  <tr key={client.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-900 text-emerald-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-100">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {client.companyName ? (
                        <div>
                          <div className="flex items-center gap-1 text-sm text-gray-300">
                            <Building className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            {client.companyName}
                          </div>
                          {client.branchName && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <GitBranch className="w-3 h-3 flex-shrink-0" />
                              {client.branchName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {client.priceListName ? (
                        <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded-full font-medium">
                          {client.priceListName}
                        </span>
                      ) : <span className="text-xs text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${client.active !== false ? 'bg-green-950 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                        {client.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-CO') : '—'}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                    No hay clientes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Nuevo Cliente" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-blue-950 rounded-xl border border-blue-800 space-y-3">
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Empresa y Sucursal</p>
              <div>
                <label className={labelClass}>Empresa</label>
                <select className={inputClass} value={form.companyId} onChange={handleCompanyChange}>
                  <option value="">— Seleccionar empresa —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sucursal</label>
                <select
                  className={inputClass}
                  value={form.branchId}
                  onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  disabled={!form.companyId || availableBranches.length === 0}
                >
                  <option value="">— Seleccionar sucursal —</option>
                  {availableBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}{b.city ? ` — ${b.city}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Nombre usuario / razón social *</label>
              <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ferretería El Tornillo Dorado" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email *</label>
                <input className={inputClass} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="cliente@empresa.com" />
              </div>
              <div>
                <label className={labelClass}>Contraseña *</label>
                <input className={inputClass} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Lista de Precios</label>
              <select className={inputClass} value={form.priceListId} onChange={e => setForm(f => ({ ...f, priceListId: e.target.value }))}>
                <option value="">— Sin lista asignada —</option>
                {priceLists.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={createUser.isPending || !form.name || !form.email || !form.password}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createUser.isPending ? 'Creando…' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
