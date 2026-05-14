import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAddComment, useUpdateQuotation, useSendToSiigo } from '../hooks/useQuotations.js';
import { useUsers } from '../hooks/useUsers.js';
import {
  ArrowLeft, CheckCircle2, Save, Send,
  Paperclip, FileText, File, ImageIcon,
  MessageSquare, User, Calendar, Package,
  UserCog, Download, ExternalLink, RefreshCw, AlertCircle,
} from 'lucide-react';
import { formatCOP } from '../utils/format.js';

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
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function roleBadge(role) {
  const map = {
    admin:   { label: 'Admin',   cls: 'bg-blue-950 text-blue-300 border border-blue-800' },
    advisor: { label: 'Asesor',  cls: 'bg-purple-950 text-purple-300 border border-purple-800' },
    client:  { label: 'Cliente', cls: 'bg-emerald-950 text-emerald-300 border border-emerald-800' },
  };
  const r = map[role] || { label: role, cls: 'bg-gray-700 text-gray-300 border border-gray-600' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.cls}`}>{r.label}</span>;
}

export default function OrderDetailCRM({
  order,
  onBack,
  editable = false,
  canAssign = false,
}) {
  const { currentUser } = useAuth();
  const [siigoUrl, setSiigoUrl]   = useState(order.siigoUrl || '');
  const [advisorId, setAdvisorId] = useState(order.advisorId || '');
  const [saved, setSaved]         = useState(false);
  const [commentText, setCommentText] = useState('');

  const addComment      = useAddComment(order.id);
  const updateQuotation = useUpdateQuotation();
  const sendToSiigo     = useSendToSiigo();
  const { data: advisors = [] } = useUsers({ role: 'advisor' });

  const [siigoError, setSiigoError] = useState(null);

  const comments    = order.comments    || [];
  const attachments = order.attachments || [];

  const isSyncedReal = order.siigoQuotationId && !order.siigoQuotationId.startsWith('SIIGO-');

  async function handleSendToSiigo() {
    setSiigoError(null);
    try {
      await sendToSiigo.mutateAsync(order.id);
    } catch (err) {
      setSiigoError(err?.response?.data?.message || 'Error al enviar a SIIGO');
    }
  }

  async function handleSave() {
    const body = { siigoUrl: siigoUrl.trim() };
    if (canAssign) body.advisorId = advisorId || null;
    await updateQuotation.mutateAsync({ id: order.id, body });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleAddComment() {
    const text = commentText.trim();
    if (!text) return;
    await addComment.mutateAsync(text);
    setCommentText('');
  }

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-300 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-center gap-2">
          {order.siigoUrl ? (
            <a
              href={order.siigoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-blue-700 text-blue-300 bg-transparent hover:bg-blue-950/60 rounded-lg text-sm font-semibold transition"
            >
              <ExternalLink className="w-4 h-4" />
              Ver cotización en Siigo
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex items-center gap-2 px-4 py-2 border border-blue-900 text-blue-500 bg-transparent rounded-lg text-sm font-semibold opacity-60 cursor-not-allowed select-none"
            >
              <ExternalLink className="w-4 h-4" />
              Ver cotización en Siigo
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-5 items-start">

        <div className="flex-1 min-w-0 space-y-5">

          {/* Header card */}
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-100 font-mono">{order.code || order.id}</h2>
                  {order.status && (
                    <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded-full font-medium capitalize">
                      {order.status}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  {order.clientName && (
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Cliente: <span className="font-medium text-gray-200">{order.clientName}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Sucursal: <span className="font-medium text-gray-200">{order.branchName || '—'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <UserCog className="w-3.5 h-3.5" />
                    Asesor: <span className="font-medium text-gray-200">{order.advisorName || 'Sin asignar'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Creado: <span className="font-medium text-gray-200">{formatDateTime(order.createdAt)}</span>
                  </p>
                  {order.siigoUrl && (
                    <p className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Siigo: <a href={order.siigoUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-300 hover:text-blue-200 transition">Ver cotización</a>
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

          {/* Siigo + advisor (editable only) */}
          {editable && (
            <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-400" />
                Integración Siigo
              </h3>

              {currentUser?.role === 'admin' && (
                <div>
                  {isSyncedReal ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>Sincronizado: <span className="font-mono font-semibold">{order.siigoQuotationId}</span></span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSendToSiigo}
                      disabled={sendToSiigo.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-4 h-4 ${sendToSiigo.isPending ? 'animate-spin' : ''}`} />
                      {sendToSiigo.isPending ? 'Enviando…' : 'Enviar a SIIGO'}
                    </button>
                  )}
                  {siigoError && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {siigoError}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Link para ver cotización en Siigo</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={siigoUrl}
                    onChange={e => setSiigoUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {order.siigoUrl && (
                    <a
                      href={order.siigoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 border border-blue-800 text-blue-300 bg-blue-950 rounded-lg text-xs font-semibold hover:bg-blue-900 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir
                    </a>
                  )}
                </div>
              </div>

              {canAssign && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Asesor asignado</label>
                  <select
                    value={advisorId}
                    onChange={e => setAdvisorId(e.target.value)}
                    className="w-full border border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={handleSave}
                  disabled={updateQuotation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-mono text-blue-400 whitespace-nowrap">{item.sku || '—'}</td>
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

          {order.notes && (
            <div className="bg-amber-950 border border-amber-900 rounded-xl p-5">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Notas del cliente
              </p>
              <p className="text-sm text-amber-100">{order.notes}</p>
            </div>
          )}

          {/* Comments */}
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
                      {(c.authorName || '?').charAt(0)}
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

            {editable && (
              <div className="px-6 py-4 border-t border-gray-700 bg-gray-900">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                    {currentUser?.name?.charAt(0) || '?'}
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
                        disabled={!commentText.trim() || addComment.isPending}
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

        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 space-y-4">

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-200">Adjuntos</h3>
              <span className="text-xs text-gray-400 ml-auto">{attachments.length}</span>
            </div>

            <div className="p-4 space-y-2">
              {attachments.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin archivos adjuntos</p>
              ) : (
                attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2.5 p-2.5 bg-gray-900 rounded-lg border border-gray-700 group">
                    <div className="flex-shrink-0">{fileIcon(att.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{att.name}</p>
                      <p className="text-xs text-gray-400">{formatBytes(att.size)}</p>
                    </div>
                    <button
                      title="Descargar"
                      className="p-1 text-gray-500 hover:text-blue-300 transition opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
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

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información de la cotización</h3>
            <div className="space-y-2 text-sm">
              {order.siigoUrl && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Siigo</span>
                  <a href={order.siigoUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-300 hover:text-blue-200 transition">Ver</a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-200">{(order.items || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidades</span>
                <span className="font-medium text-gray-200">{(order.items || []).reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-blue-400">{formatCOP(order.total)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
