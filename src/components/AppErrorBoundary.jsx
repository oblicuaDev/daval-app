import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-elevated">
            <h1 className="text-base font-semibold text-zinc-50 mb-2">No se pudo cargar esta pantalla</h1>
            <p className="text-sm text-zinc-500 mb-4">
              Recarga la página. Si el problema persiste, revisa la consola del navegador.
            </p>
            <pre className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg p-3 overflow-auto">
              {this.state.error?.message || 'Error desconocido'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors duration-150"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
