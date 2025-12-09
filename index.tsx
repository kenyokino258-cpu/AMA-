
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', direction: 'rtl' }}>
          <h1 style={{ color: '#ef4444', marginBottom: 20 }}>عذراً، حدث خطأ غير متوقع</h1>
          <p style={{ color: '#6b7280', marginBottom: 20 }}>يرجى محاولة تحديث الصفحة. إذا استمرت المشكلة، تواصل مع الدعم الفني.</p>
          <details style={{ textAlign: 'left', background: '#f3f4f6', padding: 20, borderRadius: 8, overflow: 'auto', maxHeight: 300, direction: 'ltr' }}>
            <summary style={{ cursor: 'pointer', marginBottom: 10, fontWeight: 'bold' }}>تفاصيل الخطأ (للمطورين)</summary>
            <pre style={{ margin: 0 }}>{this.state.error?.toString()}</pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: 30, 
              padding: '12px 24px', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            إعادة تحميل النظام
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
