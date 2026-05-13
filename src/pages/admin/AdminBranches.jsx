import { useState } from 'react';
import { Plus, Pencil, X, Building2, MapPin, Phone, Globe, Building } from 'lucide-react';
import { useCompanies, useCreateBranch, useUpdateBranch } from '../../hooks/useCompanies.js';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md">
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

const EMPTY_FORM = { companyId: '', name: '', city: '', address: '', phone: '' };

export default function AdminBranches() {
  const { data: companies = [], isLoading } = useCompanies();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const allBranches = companies.flatMap(c =>
    (c.branches || []).map(b => ({ ...b, companyName: c.name, companyId: c.id }))
  );

  function openCreate() {
    setEditBranch(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(branch) {
    setEditBranch(branch);
    setForm({
      companyId: String(branch.companyId),
      name: branch.name || '',
      city: branch.city || '',
      address: branch.address || '',
      phone: branch.phone || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.companyId) return;
    const body = { name: form.name, city: form.city, address: form.address, phone: form.phone };
    if (editBranch) {
      await updateBranch.mutateAsync({ companyId: Number(form.companyId), branchId: editBranch.id, body });
    } else {
      await createBranch.mutateAsync({ companyId: Number(form.companyId), body });
    }
    setShowModal(false);
  }

  const isPending = createBranch.isPending || updateBranch.isPending;
  const inputClass = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Sucursales</h2>
          <p className="text-sm text-gray-400 mt-1">{allBranches.length} sucursales configuradas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Sucursal
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 h-40 animate-pulse" />
          ))}
        </div>
      ) : allBranches.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 px-5 py-16 text-center">
          <Building2 className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No hay sucursales registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allBranches.map(branch => (
            <div key={branch.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900 text-blue-300 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">{branch.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Building className="w-3 h-3" />
                      {branch.companyName}
                    </div>
                  </div>
                </div>
                <button onClick={() => openEdit(branch)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {branch.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Globe className="w-4 h-4 text-gray-500" />
                    {branch.city}
                  </div>
                )}
                {branch.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    {branch.address}
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {branch.phone}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editBranch ? 'Editar Sucursal' : 'Nueva Sucursal'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Empresa *</label>
              <select
                className={inputClass}
                value={form.companyId}
                onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                disabled={!!editBranch}
              >
                <option value="">— Seleccionar empresa —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Nombre de la sucursal *</label>
              <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sucursal Norte" />
            </div>
            <div>
              <label className={labelClass}>Ciudad</label>
              <input className={inputClass} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Bogotá" />
            </div>
            <div>
              <label className={labelClass}>Dirección</label>
              <input className={inputClass} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Cra 7 # 15-30" />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input className={inputClass} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="601-234-5678" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isPending || !form.name || !form.companyId}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Guardando…' : editBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
