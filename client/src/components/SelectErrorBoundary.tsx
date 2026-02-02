import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary específico para capturar erros relacionados ao Select/Portal
 * Especialmente útil para problemas com tradução automática do navegador
 */
class SelectErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Verifica se é o erro específico do removeChild
    const isRemoveChildError = 
      error.message?.includes('removeChild') ||
      error.message?.includes('not a child') ||
      error.name === 'NotFoundError';

    if (isRemoveChildError) {
      console.warn('Erro de removeChild capturado (provavelmente causado por tradução automática do navegador):', error);
      // Não mostra erro para o usuário, apenas loga
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isRemoveChildError = 
      error.message?.includes('removeChild') ||
      error.message?.includes('not a child') ||
      error.name === 'NotFoundError';

    if (isRemoveChildError) {
      // Silenciosamente captura o erro e permite que o componente continue
      console.warn('SelectErrorBoundary capturou erro de removeChild:', {
        error: error.message,
        componentStack: errorInfo.componentStack
      });
      
      // Força um re-render limpo após um pequeno delay
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 0);
    } else {
      console.error('SelectErrorBoundary capturou erro:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-sm text-red-600 p-2">
          Ocorreu um erro. Por favor, recarregue a página.
        </div>
      );
    }

    return this.props.children;
  }
}

export default SelectErrorBoundary;
