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
        <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h1 className="text-lg font-semibold mb-2">No se pudo cargar esta pantalla</h1>
            <p className="text-sm text-gray-400 mb-4">
              Recarga la página. Si vuelve a pasar, revisa la consola para ver el detalle técnico.
            </p>
            <pre className="text-xs text-red-300 bg-red-950 border border-red-900 rounded-lg p-3 overflow-auto">
              {this.state.error?.message || 'Error desconocido'}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
