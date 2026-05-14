import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, Package, FileText, Paperclip, MessageSquare,
  File, FileText as FilePdf, ImageIcon, Download, User, Calendar, ExternalLink,
} from 'lucide-react';
import { useQuotation } from '../../hooks/useQuotations.js';
import { formatCOP } from '../../utils/format.js';

function fileIcon(type = '') {
  if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-400" />;
  if (type === 'application/pdf') return <FilePdf className="w-4 h-4 text-red-400" />;
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
    admin:   { label: 'Admin',   cls: 'bg-blue-950 text-blue-300' },
    advisor: { label: 'Asesor',  cls: 'bg-purple-950 text-purple-300' },
    client:  { label: 'Cliente', cls: 'bg-emerald-950 text-emerald-300' },
  };
  const r = map[role] || { label: role, cls: 'bg-gray-700 text-gray-400' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.cls}`}>{r.label}</span>;
}

export default function ClientOrderDetail() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const { data: order, isLoading } = useQuotation(orderId);

  if (isLoading) {
    return <div className="py-20 text-center text-sm text-gray-500">Cargando cotización…</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Cotización no encontrada</p>
        <button onClick={() => navigate('/cliente/cotizaciones')} className="mt-4 text-blue-400 text-sm font-medium hover:text-blue-300">
          Volver a mis cotizaciones
        </button>
      </div>
    );
  }

  const comments    = order.comments    || [];
  const attachments = order.attachments || [];

  return (
    <div className="space-y-5">

      <button
        onClick={() => navigate('/cliente/cotizaciones')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis cotizaciones
      </button>

      {order.pricesOutdated && (
        <div className="flex items-start gap-3 bg-amber-950 border border-amber-800 rounded-xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Los precios de esta cotización pueden estar desactualizados</p>
            <p className="text-xs text-amber-400 mt-1">
              Uno o más productos fueron modificados después de crear esta cotización.
              Los precios mostrados son los que se aplicaron al momento de generarla.
              Si necesitas precios actualizados, genera una nueva cotización.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-5 items-start">

        <div className="flex-1 min-w-0 space-y-5">

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold text-gray-100 font-mono">{order.code || order.id}</h2>
                  <span className="text-xs bg-blue-950 text-blue-300 px-2 py-1 rounded-full font-medium capitalize">
                    {order.status || 'pendiente'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Creado: <span className="font-medium text-gray-300">{formatDateTime(order.createdAt)}</span>
                  </p>
                  {order.clientName && (
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Solicitante: <span className="font-medium text-gray-300">{order.clientName}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Sucursal: <span className="font-medium text-gray-300">{order.branchName || '—'}</span>
                  </p>
                  {order.advisorName && (
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Asesor: <span className="font-medium text-gray-300">{order.advisorName}</span>
                    </p>
                  )}
                  {order.siigoUrl && (
                    <p className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Siigo: <a href={order.siigoUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-300 hover:text-blue-200 transition">Ver cotización</a>
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Total</p>
                <p className="text-3xl font-bold text-blue-400">{formatCOP(order.total)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-100">Productos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900">
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
                  <tr className="bg-gray-900 border-t-2 border-gray-600">
                    <td colSpan={5} className="px-5 py-3 text-sm font-bold text-gray-400 text-right">Total</td>
                    <td className="px-5 py-3 text-base font-bold text-blue-400 text-right">{formatCOP(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="bg-yellow-950 border border-yellow-900 rounded-xl p-5">
              <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Mis notas
              </p>
              <p className="text-sm text-yellow-200">{order.notes}</p>
            </div>
          )}

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-100">Comentarios de la cotización</h3>
              {comments.length > 0 && (
                <span className="text-xs bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full font-medium ml-auto">
                  {comments.length}
                </span>
              )}
            </div>
            {comments.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Sin comentarios aún</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {comments.map(c => (
                  <div key={c.id} className="px-6 py-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-950 text-blue-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {(c.authorName || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-100">{c.authorName}</span>
                        {roleBadge(c.authorRole)}
                        <span className="text-xs text-gray-500 ml-auto">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="w-72 flex-shrink-0 space-y-4">

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-700 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-100">Adjuntos</h3>
              <span className="text-xs text-gray-500 ml-auto">{attachments.length}</span>
            </div>
            <div className="p-4 space-y-2">
              {attachments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Sin archivos adjuntos</p>
              ) : (
                attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-2.5 p-2.5 bg-gray-700 rounded-lg border border-gray-600 group">
                    <div className="flex-shrink-0">{fileIcon(att.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 truncate">{att.name}</p>
                      <p className="text-xs text-gray-500">{formatBytes(att.size)}</p>
                    </div>
                    <button title="Descargar" className="p-1 text-gray-600 hover:text-blue-400 transition opacity-0 group-hover:opacity-100">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resumen</h3>
            <div className="space-y-2 text-sm">
              {order.siigoUrl && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Siigo</span>
                  <a href={order.siigoUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-300 hover:text-blue-200 transition">Ver</a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-300">{order.items?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unidades</span>
                <span className="font-medium text-gray-300">{(order.items || []).reduce((s, i) => s + i.quantity, 0)}</span>
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
