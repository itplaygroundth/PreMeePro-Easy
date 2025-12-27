import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { AddLineOAPrompt } from './components/AddLineOAPrompt';
import { RefreshCw } from 'lucide-react';

function App() {
  const { user, isAuthenticated, loading, login, logout, isNewLineLogin, clearNewLineLogin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <>
      <Dashboard user={user} onLogout={logout} />

      {/* Show LINE OA add friend prompt after LINE Login */}
      <AddLineOAPrompt
        isOpen={isNewLineLogin}
        onClose={clearNewLineLogin}
        onSkip={clearNewLineLogin}
      />
    </>
  );
}

export default App;
