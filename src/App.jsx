import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './superbase/supabaseConfig.js';
import LoginScreen from './screens/login/LoginScreen.jsx';
import HomeScreen from './screens/home/HomeScreen.jsx';
import CadastroJoiasScreen from './screens/cadastro/CadastroJoiasScreen.jsx';
import ListaJoiasScreen from './screens/listarJoias/ListarJoiasScreen.jsx';
import DetalheJoiaScreen from './screens/detalheJoia/DetalheJoiaScreen.jsx';
import Navbar from './components/navbar/Navbar.jsx';

const AppLayout = ({ session }) => (
  <>
    {session && <Navbar />}
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  </>
);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout session={session} />}>
          {!session ? (
            <Route path="/login" element={<LoginScreen />} />
          ) : (
            <>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/cadastro-joias" element={<CadastroJoiasScreen />} />
              <Route path="/lista-joias" element={<ListaJoiasScreen />} />
              <Route path="/detalhe-joias" element={<DetalheJoiaScreen />} />
              <Route path="/catalogos" element={<div className="p-6"><p className="text-lg">Catálogos</p></div>} />
              <Route path="/relatorios" element={<div className="p-6"><p className="text-lg">Relatórios</p></div>} />
              <Route path="/relatorios-revendedoras" element={<div className="p-6"><p className="text-lg">Relatórios de Revendedoras</p></div>} />
            </>
          )}
          <Route path="*" element={<Navigate to={session ? "/" : "/login"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;