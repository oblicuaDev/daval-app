import { useState } from 'react';
import { Plus, X, Building, GitBranch, ChevronDown, ChevronUp, Phone, MapPin, Edit2, Trash2, Route, UserCog } from 'lucide-react';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, useCreateBranch, useUpdateBranch, useDeleteBranch } from '../../hooks/useCompanies.js';
import { useUsers } from '../../hooks/useUsers.js';
import { useRoutes } from '../../hooks/useRoutes.js';
import ConfirmDialog from '../../components/ConfirmDialog';

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

const EMPTY_COMPANY = { name: '', nit: '', email: '', phone: '', address: '' };
const EMPTY_SUCURSAL = { name: '', address: '', city: '', routeId: '', advisorId: '' };

export default function AdminCompanies() {
  const { data: companies = [], isLoading } = useCompanies();
  const { data: allUsers = [] } = useUsers({ role: 'advisor' });
  const { data: routes = [] } = useRoutes();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [expandedId, setExpandedId] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY);
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [sucursalTargetCompanyId, setSucursalTargetCompanyId] = useState(null);
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [sucursalForm, setSucursalForm] = useState(EMPTY_SUCURSAL);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const inputClass = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';
  const advisors = allUsers.filter(u => u.role === 'advisor');

  function openCreateCompany() {
    setEditingCompany(null);
    setCompanyForm(EMPTY_COMPANY);
    setShowCompanyModal(true);
  }

  function openEditCompany(company) {
    setEditingCompany(company);
    setCompanyForm({ name: company.name, nit: company.nit, email: company.email, phone: company.phone, address: company.address });
    setShowCompanyModal(true);
  }

  async function handleSaveCompany() {
    if (!companyForm.name) return;
    if (editingCompany) {
      await updateCompany.mutateAsync({ id: editingCompany.id, body: companyForm });
    } else {
      await createCompany.mutateAsync({ ...companyForm, active: true });
    }
    setShowCompanyModal(false);
  }

  async function handleDeleteCompany(id) {
    await deleteCompany.mutateAsync(id);
    if (expandedId === id) setExpandedId(null);
  }

  function openCreateSucursal(companyId) {
    setEditingSucursal(null);
    setSucursalForm(EMPTY_SUCURSAL);
    setSucursalTargetCompanyId(companyId);
    setShowSucursalModal(true);
  }

  function openEditSucursal(companyId, sucursal) {
    setEditingSucursal(sucursal);
    setSucursalForm({
      name: sucursal.name,
      address: sucursal.address,
      city: sucursal.city,
      routeId: sucursal.routeId ? String(sucursal.routeId) : '',
      advisorId: sucursal.advisorId ? String(sucursal.advisorId) : '',
    });
    setSucursalTargetCompanyId(companyId);
    setShowSucursalModal(true);
  }

  async function handleSaveSucursal() {
    if (!sucursalForm.name) return;
    const payload = {
      ...sucursalForm,
      routeId: sucursalForm.routeId || null,
      advisorId: sucursalForm.advisorId || null,
    };
    if (editingSucursal) {
      await updateBranch.mutateAsync({ companyId: sucursalTargetCompanyId, branchId: editingSucursal.id, body: payload });
    } else {
      await createBranch.mutateAsync({ companyId: sucursalTargetCompanyId, body: { ...payload, active: true } });
    }
    setShowSucursalModal(false);
  }

  async function handleDeleteSucursal(companyId, sucursalId) {
    await deleteBranch.mutateAsync({ companyId, branchId: sucursalId });
  }

  function confirmDeleteAction() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'company') {
      handleDeleteCompany(confirmDelete.companyId);
    }
    if (confirmDelete.type === 'sucursal') {
      handleDeleteSucursal(confirmDelete.companyId, confirmDelete.sucursalId);
    }
    setConfirmDelete(null);
  }

  function getRouteName(routeId) {
    return routes.find(route => route.id === routeId)?.name || 'Sin ruta asignada';
  }

  function getAdvisorName(advisorId) {
    return advisors.find(advisor => advisor.id === advisorId)?.name || 'Sin asesor asignado';
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Empresas</h2>
          <p className="text-sm text-gray-400 mt-1">{companies.length} empresas registradas</p>
        </div>
        <button
          onClick={openCreateCompany}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Nueva Empresa
        </button>
      </div>

      <div className="space-y-3">
        {companies.map(company => (
          <div key={company.id} className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 bg-blue-950 text-blue-300 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-100">{company.name}</p>
                  {company.nit && (
                    <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">NIT {company.nit}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                  {company.email && <p className="text-xs text-gray-500">{company.email}</p>}
                  {company.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3" />{company.phone}
                    </span>
                  )}
                  {company.address && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />{company.address}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-gray-500 mr-2">
                  {company.branches.length} sucursal{company.branches.length !== 1 ? 'es' : ''}
                </span>
                <button onClick={() => openEditCompany(company)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirmDelete({ type: 'company', companyId: company.id, label: company.name })} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === company.id ? null : company.id)}
                  className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition ml-1"
                >
                  {expandedId === company.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {expandedId === company.id && (
              <div className="border-t border-gray-700 bg-gray-900 px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Sucursales
                  </p>
                  <button
                    onClick={() => openCreateSucursal(company.id)}
                    className="flex items-center gap-1 text-xs text-blue-400 font-medium hover:text-blue-300 transition px-2 py-1 bg-blue-950 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Agregar sucursal
                  </button>
                </div>

                {company.branches.length === 0 ? (
                  <p className="text-xs text-gray-600 py-2">Sin sucursales registradas</p>
                ) : (
                  <div className="space-y-2">
                    {(company.branches ?? []).map(suc => (
                      <div key={suc.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                        <div className="w-7 h-7 bg-emerald-950 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GitBranch className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200">{suc.name}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {suc.city && <span className="text-xs text-gray-500">{suc.city}</span>}
                            {suc.address && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />{suc.address}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 text-xs ${suc.routeId ? 'text-blue-300' : 'text-gray-600'}`}>
                              <Route className="w-3 h-3" />{getRouteName(suc.routeId)}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${suc.advisorId ? 'text-emerald-300' : 'text-gray-600'}`}>
                              <UserCog className="w-3 h-3" />{getAdvisorName(suc.advisorId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => openEditSucursal(company.id, suc)} className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: 'sucursal', companyId: company.id, sucursalId: suc.id, label: suc.name })} className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {companies.length === 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 px-5 py-12 text-center">
            <Building className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No hay empresas registradas</p>
          </div>
        )}
      </div>

      {showCompanyModal && (
        <Modal title={editingCompany ? 'Editar Empresa' : 'Nueva Empresa'} onClose={() => setShowCompanyModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nombre de la empresa *</label>
              <input className={inputClass} value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Ferretería Industrial Norte S.A.S." />
            </div>
            <div>
              <label className={labelClass}>NIT</label>
              <input className={inputClass} value={companyForm.nit} onChange={e => setCompanyForm(f => ({ ...f, nit: e.target.value }))} placeholder="900.123.456-7" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" value={companyForm.email} onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))} placeholder="contacto@empresa.com" />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input className={inputClass} value={companyForm.phone} onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))} placeholder="601-234-5678" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Dirección principal</label>
              <input className={inputClass} value={companyForm.address} onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))} placeholder="Cra 7 # 15-30, Bogotá" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCompanyModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button onClick={handleSaveCompany} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                {editingCompany ? 'Guardar cambios' : 'Crear Empresa'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSucursalModal && (
        <Modal title={editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'} onClose={() => setShowSucursalModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nombre de la sucursal *</label>
              <input className={inputClass} value={sucursalForm.name} onChange={e => setSucursalForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Sede Norte" />
            </div>
            <div>
              <label className={labelClass}>Ciudad</label>
              <input className={inputClass} value={sucursalForm.city} onChange={e => setSucursalForm(f => ({ ...f, city: e.target.value }))} placeholder="Bogotá" />
            </div>
            <div>
              <label className={labelClass}>Dirección</label>
              <input className={inputClass} value={sucursalForm.address} onChange={e => setSucursalForm(f => ({ ...f, address: e.target.value }))} placeholder="Cra 15 # 85-20" />
            </div>
            <div>
              <label className={labelClass}>Ruta relacionada</label>
              <select className={inputClass} value={sucursalForm.routeId} onChange={e => setSucursalForm(f => ({ ...f, routeId: e.target.value }))}>
                <option value="">Sin ruta asignada</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name} · {route.day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Asesor asignado</label>
              <select className={inputClass} value={sucursalForm.advisorId} onChange={e => setSucursalForm(f => ({ ...f, advisorId: e.target.value }))}>
                <option value="">Sin asesor asignado</option>
                {advisors.map(advisor => (
                  <option key={advisor.id} value={advisor.id}>{advisor.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSucursalModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button onClick={handleSaveSucursal} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                {editingSucursal ? 'Guardar cambios' : 'Agregar Sucursal'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === 'company' ? 'Eliminar empresa' : 'Eliminar sucursal'}
          message={
            confirmDelete.type === 'company'
              ? `Confirma que deseas eliminar la empresa "${confirmDelete.label}" y sus sucursales asociadas.`
              : `Confirma que deseas eliminar la sucursal "${confirmDelete.label}".`
          }
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDeleteAction}
        />
      )}
    </div>
  );
}
