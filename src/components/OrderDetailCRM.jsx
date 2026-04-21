/**
 * OrderDetailCRM — CRM-style full-page order detail
 *
 * Props:
 *   order        – order object (with comments[], attachments[])
 *   onBack       – fn() navigate back
 *   editable     – bool: can change status / add comments / upload attachments
 *   canAssign    – bool (admin only): can assign advisor
 *   currentUser  – logged-in user object
 *   users        – full users array (from AuthContext)
 *   updateOrder  – fn(orderId, updates) from AppContext
 */

import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft, Truck, CheckCircle2, Save, Send,
  Paperclip, FileText, File, ImageIcon, X,
  MessageSquare, User, Calendar, Package,
  UserCog, Download, FileDown, Sheet,
} from 'lucide-react';
import { STATUS_STYLES, ORDER_STATUSES, formatCOP } from '../data/mockData';
import ConfirmDialog from './ConfirmDialog';

// ── Helpers ────────────────────────────────────────────────────────────────

function fileIcon(type = '') {
  if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (type === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function roleBadge(role) {
  const map = {
    admin:   { label: 'Admin',   cls: 'bg-blue-950 text-blue-300 border border-blue-800' },
    advisor: { label: 'Asesor',  cls: 'bg-purple-950 text-purple-300 border border-purple-800' },
    client:  { label: 'Cliente', cls: 'bg-emerald-950 text-emerald-300 border border-emerald-800' },
  };
  const r = map[role] || { label: role, cls: 'bg-gray-700 text-gray-300 border border-gray-600' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.cls}`}>{r.label}</span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function OrderDetailCRM({
  order,
  onBack,
  editable = false,
  canAssign = false,
  currentUser,
  users = [],
  updateOrder,
}) {
  const [status, setStatus]   = useState(order.status);
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [saved, setSaved]     = useState(false);
  const [commentText, setCommentText] = useState('');
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const fileInputRef = useRef(null);

  const { products } = useApp();
  const advisors = users.filter(u => u.role === 'advisor');
  const client   = users.find(u => u.id === order.clientId);
  const requestedBy = users.find(u => u.id === (order.requestedById || order.clientId));
  const advisor  = users.find(u => u.id === order.advisorId);

  function getSku(productId) {
    return products.find(p => p.id === productId)?.sku || '—';
  }

  const style    = STATUS_STYLES[status] || {};
  const comments    = order.comments    || [];
  const attachments = order.attachments || [];

  // ── Actions ──────────────────────────────────────────────────────────────

  function handleSave() {
    const updates = { status };
    if (status === 'En Ruta') updates.carrier = carrier;
    updateOrder(order.id, updates);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleAddComment() {
    const text = commentText.trim();
    if (!text) return;
    const newComment = {
      id: `c${Date.now()}`,
      authorId:   currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text,
      createdAt: new Date().toISOString(),
    };
    updateOrder(order.id, { comments: [...comments, newComment] });
    setCommentText('');
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAttachment = {
      id:          `att${Date.now()}`,
      name:        file.name,
      size:        file.size,
      type:        file.type,
      uploadedBy:  currentUser.name,
      uploadedAt:  new Date().toISOString(),
    };
    updateOrder(order.id, { attachments: [...attachments, newAttachment] });
    e.target.value = '';
  }

  function handleRemoveAttachment(attId) {
    updateOrder(order.id, { attachments: attachments.filter(a => a.id !== attId) });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Top bar: back + export buttons */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-300 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-2">
          <button
            disabled
            title="Próximamente"
            className="flex items-center gap-2 px-4 py-2 border border-red-900 text-red-300 bg-red-950 rounded-lg text-sm font-medium opacity-70 cursor-not-allowed select-none"
          >
            <FileDown className="w-4 h-4" />
            Orden de compra PDF
          </button>
          <button
            disabled
            title="Próximamente"
            className="flex items-center gap-2 px-4 py-2 border border-emerald-900 text-emerald-300 bg-emerald-950 rounded-lg text-sm font-medium opacity-70 cursor-not-allowed select-none"
          >
            <Sheet className="w-4 h-4" />
            Plantilla Excel
          </button>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── LEFT: main content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Header card */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-100 font-mono">{order.id}</h2>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  <p className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Cliente: <span className="font-medium text-gray-200">{client?.name || '—'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Solicitante: <span className="font-medium text-gray-200">{order.requestedByName || requestedBy?.name || '—'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Sucursal: <span className="font-medium text-gray-200">{order.sucursalName || 'Sin sucursal'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5" />
                    Asesor: <span className="font-medium text-gray-200">{advisor?.name || 'Sin asignar'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Creado: <span className="font-medium text-gray-200">{order.createdAt}</span>
                    {order.updatedAt !== order.createdAt && (
                      <> · Actualizado: <span className="font-medium text-gray-200">{order.updatedAt}</span></>
                    )}
                  </p>
                  {order.carrier && (
                    <p className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      Transportador: <span className="font-medium text-gray-200">{order.carrier}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Total de la cotización</p>
                <p className="text-3xl font-bold text-blue-400">{formatCOP(order.total)}</p>
              </div>
            </div>
          </div>

          {/* Status management (editable only) */}
          {editable && (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Gestión de la cotización
              </h3>

              {/* Status selector */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map(s => {
                    const st = STATUS_STYLES[s] || {};
                    const isActive = status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition ${
                          isActive
                            ? `${st.bg} ${st.text} ${st.border}`
                            : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-500 hover:bg-gray-600'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carrier field */}
              {status === 'En Ruta' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Transportador</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="Ej: TCC, Envia, Servientrega..."
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Assign advisor (admin only) */}
              {canAssign && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Asesor asignado</label>
                  <select
                    value={order.advisorId || ''}
                    onChange={e => updateOrder(order.id, { advisorId: Number(e.target.value) || null })}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {/* Save button */}
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </button>
                {saved && (
                  <span className="flex items-center gap-1.5 text-emerald-300 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Guardado
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Products table */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-200">Productos de la cotización</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">SKU</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Producto</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Unidad</th>
                    <th className="text-center text-xs font-semibold text-gray-500 uppercase px-5 py-3">Cant.</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Precio unit.</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono text-blue-400 whitespace-nowrap">{getSku(item.productId)}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-100">{item.productName}</td>
                      <td className="px-5 py-3 text-sm text-gray-400">{item.unit}</td>
                      <td className="px-5 py-3 text-sm text-gray-300 text-center">{item.quantity}</td>
                      <td className="px-5 py-3 text-sm text-gray-300 text-right">{formatCOP(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-100 text-right">{formatCOP(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-900 border-t-2 border-gray-700">
                    <td colSpan={5} className="px-5 py-3 text-sm font-bold text-gray-300 text-right">Total</td>
                    <td className="px-5 py-3 text-base font-bold text-blue-400 text-right">{formatCOP(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Client notes (read-only always) */}
          {order.notes && (
            <div className="bg-amber-950 border border-amber-900 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Notas del cliente
              </p>
              <p className="text-sm text-amber-100">{order.notes}</p>
            </div>
          )}

          {/* ── Comments section ─────────────────────────────────────── */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-200">Comentarios internos</h3>
              {comments.length > 0 && (
                <span className="text-xs bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full font-medium ml-auto">
                  {comments.length}
                </span>
              )}
            </div>

            <div className="divide-y divide-gray-700">
              {comments.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Sin comentarios aún</p>
                </div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="px-6 py-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-950 text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {c.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-100">{c.authorName}</span>
                        {roleBadge(c.authorRole)}
                        <span className="text-xs text-gray-400 ml-auto">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add comment (editable only) */}
            {editable && (
              <div className="px-6 py-4 border-t border-gray-700 bg-gray-900">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                    {currentUser?.initials || currentUser?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      rows={3}
                      placeholder="Escribe un comentario interno sobre esta cotización..."
                      className="w-full border border-gray-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-700 text-gray-100 placeholder-gray-500"
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment(); }}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Ctrl + Enter para enviar</p>
                      <button
                        onClick={handleAddComment}
                        disabled={!commentText.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Publicar comentario
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* END left column */}

        {/* ── RIGHT: sidebar ─────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 space-y-4">

          {/* Attachments card */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-200">Adjuntos</h3>
              <span className="text-xs text-gray-400 ml-auto">{attachments.length}</span>
            </div>

            <div className="p-4 space-y-2">
              {attachments.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Sin archivos adjuntos</p>
              )}
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-2.5 p-2.5 bg-gray-900 rounded-lg border border-gray-700 group">
                  <div className="flex-shrink-0">{fileIcon(att.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{att.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(att.size)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      title="Descargar"
                      className="p-1 text-gray-500 hover:text-blue-300 transition opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {editable && (
                      <button
                        onClick={() => setAttachmentToDelete(att)}
                        title="Eliminar"
                        className="p-1 text-gray-500 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Upload button (editable only) */}
              {editable && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-600 rounded-lg text-xs font-medium text-gray-400 hover:border-blue-400 hover:text-blue-300 hover:bg-blue-950 transition mt-2"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Adjuntar archivo
                  </button>
                </>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="px-4 pb-3">
                <p className="text-xs text-gray-400 text-center">
                  Último: {attachments[attachments.length - 1].uploadedBy} · {formatDateTime(attachments[attachments.length - 1].uploadedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Order meta card */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información de la cotización</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Estado</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-200">{order.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidades</span>
                <span className="font-medium text-gray-200">{order.items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-blue-400">{formatCOP(order.total)}</span>
              </div>
              {order.carrier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transportador</span>
                  <span className="font-medium text-gray-200">{order.carrier}</span>
                </div>
              )}
            </div>
          </div>

        </div>
        {/* END sidebar */}

      </div>
      {/* END two-column */}

      {attachmentToDelete && (
        <ConfirmDialog
          title="Eliminar adjunto"
          message={`Confirma que deseas eliminar el archivo "${attachmentToDelete.name}" de esta cotización.`}
          onCancel={() => setAttachmentToDelete(null)}
          onConfirm={() => {
            handleRemoveAttachment(attachmentToDelete.id);
            setAttachmentToDelete(null);
          }}
        />
      )}

    </div>
  );
}
