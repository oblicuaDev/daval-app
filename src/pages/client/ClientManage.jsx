import { useState } from 'react';
import { Plus, X, Users, GitBranch, Edit2, Trash2, MapPin, Eye, EyeOff, Route, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '../../hooks/useUsers.js';
import { useCompanies, useCreateBranch, useUpdateBranch, useDeleteBranch } from '../../hooks/useCompanies.js';
import { useRoutes } from '../../hooks/useRoutes.js';
import ConfirmDialog from '../../components/ConfirmDialog';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
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

const EMPTY_USER_FORM = { name: '', email: '', password: '', branchId: '' };
const EMPTY_SUC_FORM  = { name: '', city: '', address: '' };

export default function ClientManage() {
  const { currentUser } = useAuth();

  const { data: companies = [] } = useCompanies();
  const { data: routes = [] } = useRoutes();
  const { data: allUsers = [] } = useUsers({ role: 'client' });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const company = companies.find(c =>
    (c.branches || []).some(b => b.id === currentUser?.branchId)
  ) || null;

  const companyUsers = allUsers.filter(
    u => u.companyId === company?.id && u.id !== currentUser?.id && u.active !== false
  );
  const allCompanyUsers = allUsers.filter(u => u.companyId === company?.id && u.active !== false);
  const branches = company?.branches || [];

  const [tab, setTab]                    = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser]    = useState(null);
  const [userForm, setUserForm]          = useState(EMPTY_USER_FORM);
  const [showPwd, setShowPwd]            = useState(false);
  const [showSucModal, setShowSucModal]  = useState(false);
  const [editingSuc, setEditingSuc]      = useState(null);
  const [sucForm, setSucForm]            = useState(EMPTY_SUC_FORM);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const inputCls = 'w-full border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-500';
  const lblCls   = 'block text-sm font-medium text-gray-300 mb-1';

  function getRouteName(routeId) {
    return routes.find(r => r.id === routeId)?.name || 'Sin ruta asignada';
  }

  function openCreateUser() {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setShowPwd(false);
    setShowUserModal(true);
  }

  function openEditUser(user) {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: '', branchId: user.branchId ? String(user.branchId) : '' });
    setShowPwd(false);
    setShowUserModal(true);
  }

  async function handleSaveUser() {
    if (!userForm.name || !userForm.email) return;
    if (!editingUser && !userForm.password) return;
    if (editingUser) {
      const body = { name: userForm.name, email: userForm.email };
      if (userForm.password) body.password = userForm.password;
      if (userForm.branchId) body.branchId = Number(userForm.branchId);
      await updateUser.mutateAsync({ id: editingUser.id, body });
    } else {
      await createUser.mutateAsync({
        name: userForm.name,
        email: userForm.email,
        password: userForm.password,
        role: 'client',
        branchId: userForm.branchId ? Number(userForm.branchId) : undefined,
      });
    }
    setShowUserModal(false);
  }

  function openCreateSuc() {
    setEditingSuc(null);
    setSucForm(EMPTY_SUC_FORM);
    setShowSucModal(true);
  }

  function openEditSuc(suc) {
    setEditingSuc(suc);
    setSucForm({ name: suc.name, city: suc.city || '', address: suc.address || '' });
    setShowSucModal(true);
  }

  async function handleSaveSuc() {
    if (!sucForm.name || !company) return;
    const body = { name: sucForm.name, city: sucForm.city, address: sucForm.address };
    if (editingSuc) {
      await updateBranch.mutateAsync({ companyId: company.id, branchId: editingSuc.id, body });
    } else {
      await createBranch.mutateAsync({ companyId: company.id, body });
    }
    setShowSucModal(false);
  }

  async function confirmDeleteAction() {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'user') {
      await deactivateUser.mutateAsync(confirmDelete.id);
    }
    if (confirmDelete.type === 'sucursal' && company) {
      await deleteBranch.mutateAsync({ companyId: company.id, branchId: confirmDelete.id });
    }
    setConfirmDelete(null);
  }

  function requestDeleteUser(user) {
    if (user.id === currentUser?.id) return;
    if (allCompanyUsers.length <= 1) {
      setConfirmDelete({
        type: 'blocked',
        title: 'No se puede eliminar el usuario',
        message: 'La empresa debe conservar al menos un usuario activo para acceder a la plataforma.',
      });
      return;
    }
    setConfirmDelete({ type: 'user', id: user.id, label: user.name });
  }

  function requestDeleteSucursal(suc) {
    if (branches.length <= 1) {
      setConfirmDelete({
        type: 'blocked',
        title: 'No se puede eliminar la sucursal',
        message: 'La empresa debe conservar al menos una sucursal para solicitar cotizaciones.',
      });
      return;
    }
    setConfirmDelete({ type: 'sucursal', id: suc.id, label: suc.name });
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-sm">Tu cuenta no tiene empresa asignada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-gray-100">Administrar empresa</h2>
        <p className="text-sm text-gray-400 mt-1">{company.name}</p>
      </div>

      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'users' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios ({allCompanyUsers.length})
        </button>
        <button
          onClick={() => setTab('sucursales')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'sucursales' ? 'bg-gray-800 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Sucursales ({branches.length})
        </button>
      </div>

      {tab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Usuarios con acceso al portal de tu empresa</p>
            <button
              onClick={openCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo usuario
            </button>
          </div>

          {companyUsers.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Sin usuarios creados aún</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 divide-y divide-gray-700 overflow-hidden">
              {companyUsers.map(user => {
                const initials = (user.name || '').substring(0, 2).toUpperCase();
                return (
                  <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 bg-blue-950 text-blue-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditUser(user)}
                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => requestDeleteUser(user)}
                        disabled={allCompanyUsers.length <= 1}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'sucursales' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Sucursales registradas en tu empresa</p>
            <button
              onClick={openCreateSuc}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Nueva sucursal
            </button>
          </div>

          {branches.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col items-center justify-center py-16 text-center">
              <GitBranch className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">Sin sucursales registradas</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 divide-y divide-gray-700 overflow-hidden">
              {branches.map(suc => (
                <div key={suc.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 bg-emerald-950 text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-100">{suc.name}</p>
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
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditSuc(suc)}
                      className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-950 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => requestDeleteSucursal(suc)}
                      disabled={branches.length <= 1}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-950 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showUserModal && (
        <Modal title={editingUser ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setShowUserModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={lblCls}>Nombre completo *</label>
              <input className={inputCls} value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del usuario" />
            </div>
            <div>
              <label className={lblCls}>Email *</label>
              <input className={inputCls} type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@empresa.com" />
            </div>
            <div>
              <label className={lblCls}>{editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
              <div className="relative">
                <input
                  className={inputCls + ' pr-10'}
                  type={showPwd ? 'text' : 'password'}
                  value={userForm.password}
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={lblCls}>Sucursal</label>
              <select className={inputCls} value={userForm.branchId} onChange={e => setUserForm(f => ({ ...f, branchId: e.target.value }))}>
                <option value="">— Sin sucursal —</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.city ? ` — ${b.city}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowUserModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                disabled={createUser.isPending || updateUser.isPending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40"
              >
                {editingUser ? 'Guardar cambios' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showSucModal && (
        <Modal title={editingSuc ? 'Editar sucursal' : 'Nueva sucursal'} onClose={() => setShowSucModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={lblCls}>Nombre de la sucursal *</label>
              <input className={inputCls} value={sucForm.name} onChange={e => setSucForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Sede Norte" />
            </div>
            <div>
              <label className={lblCls}>Ciudad</label>
              <input className={inputCls} value={sucForm.city} onChange={e => setSucForm(f => ({ ...f, city: e.target.value }))} placeholder="Bogotá" />
            </div>
            <div>
              <label className={lblCls}>Dirección</label>
              <input className={inputCls} value={sucForm.address} onChange={e => setSucForm(f => ({ ...f, address: e.target.value }))} placeholder="Cra 15 # 85-20" />
            </div>
            {editingSuc?.routeId && (
              <div>
                <label className={lblCls}>Ruta relacionada</label>
                <div className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-900 text-gray-300">
                  {getRouteName(editingSuc.routeId)}
                </div>
                <p className="text-xs text-gray-500 mt-1">La ruta es asignada por Distribuciones DAVAL.</p>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSucModal(false)} className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                Cancelar
              </button>
              <button
                onClick={handleSaveSuc}
                disabled={createBranch.isPending || updateBranch.isPending || !sucForm.name}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40"
              >
                {editingSuc ? 'Guardar cambios' : 'Crear sucursal'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.title || (confirmDelete.type === 'user' ? 'Eliminar usuario' : 'Eliminar sucursal')}
          message={
            confirmDelete.message ||
            (confirmDelete.type === 'user'
              ? `Confirma que deseas desactivar el usuario "${confirmDelete.label}".`
              : `Confirma que deseas eliminar la sucursal "${confirmDelete.label}".`)
          }
          onCancel={() => setConfirmDelete(null)}
          onConfirm={confirmDelete.type === 'blocked' ? () => setConfirmDelete(null) : confirmDeleteAction}
        />
      )}
    </div>
  );
}
