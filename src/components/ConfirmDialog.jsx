import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  title = 'Confirmar accion',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-700 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-red-900 bg-red-950 text-red-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-100">{title}</h3>
              <p className="mt-0.5 text-xs text-gray-500">Esta accion no se puede deshacer.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-700 hover:text-gray-300"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-6 text-gray-300">{message}</p>
        </div>

        <div className="flex gap-3 border-t border-gray-700 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
