import { useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, X, Building2, MapPin, Phone, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';

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

const EMPTY_FORM = { name: '', city: '', address: '', phone: '', active: true };

export default function AdminBranches() {
  const { branches, setBranches } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [nextId, setNextId] = useState(3);

  function openCreate() {
    setEditBranch(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(branch) {
    setEditBranch(branch);
    setForm({ name: branch.name, city: branch.city, address: branch.address, phone: branch.phone, active: branch.active });
    setShowModal(true);
  }

  function handleSave() {
    if (!form.name || !form.city) return;
    if (editBranch) {
      setBranches(prev => prev.map(b => b.id === editBranch.id ? { ...b, ...form } : b));
    } else {
      setBranches(prev => [...prev, { id: nextId, ...form }]);
      setNextId(n => n + 1);
    }
    setShowModal(false);
  }

  function toggleActive(id) {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  }

  const inputClass = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Sedes Comerciales</h2>
          <p className="text-sm text-gray-400 mt-1">{branches.length} sedes configuradas</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Sede
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map(branch => (
          <div key={branch.id} className={`bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-5 ${!branch.active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900 text-blue-300 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-100">{branch.name}</h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${branch.active ? 'bg-green-950 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                    {branch.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(branch)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleActive(branch.id)} className="p-1.5 text-gray-500 hover:text-orange-400 hover:bg-orange-950 rounded-lg transition">
                  {branch.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Globe className="w-4 h-4 text-gray-500" />
                {branch.city}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                {branch.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="w-4 h-4 text-gray-500" />
                {branch.phone}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title={editBranch ? 'Editar Sede' : 'Nueva Sede'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nombre de la sede *</label>
              <input className={inputClass} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sede Centro" />
            </div>
            <div>
              <label className={labelClass}>Ciudad *</label>
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
            <div className="flex items-center gap-2">
              <input type="checkbox" id="branchActive" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="rounded" />
              <label htmlFor="branchActive" className="text-sm text-gray-300">Sede activa</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                {editBranch ? 'Guardar Cambios' : 'Crear Sede'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
