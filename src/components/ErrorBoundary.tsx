import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Reset error:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Hoppla, ein Fehler ist aufgetreten
              </h2>
              <p className="text-xs text-slate-500">
                Die Anwendung konnte auf diesem Gerät nicht ordnungsgemäß geladen werden.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-xl text-left text-[11px] font-mono text-slate-700 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full inline-flex items-center justify-center gap-2 bg-school-blue hover:bg-school-darkblue text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow transition min-h-[44px] active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>App neu laden</span>
              </button>

              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition min-h-[44px] active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4 text-slate-500" />
                <span>Cache leeren & neu starten</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
