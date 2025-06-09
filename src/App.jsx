import { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './superbase/supabaseConfig';
import { AuthContext } from './context/AuthContext.jsx'; // Importe o contexto
import LoginScreen from './screens/login/LoginScreen.jsx';
import HomeScreen from './screens/home/HomeScreen.jsx';
import CadastroJoiasScreen from './screens/cadastro/CadastroJoiasScreen.jsx';
import ListaJoiasScreen from './screens/listarJoias/ListarJoiasScreen.jsx';
import DetalheJoiaScreen from './screens/detalheJoia/DetalheJoiaScreen.jsx';
import Navbar from './components/navbar/Navbar.jsx';
import CatalogoScreen from './screens/catalogo/CatalogoScreen.jsx';
import RelatoriosScreen from './screens/relatorios/RelatoriosScreen.jsx';
import CriarContaScreen from './screens/criarConta/CriarContaScreen.jsx';
import PerfilsScreen from './screens/perfils/PerfilsScreen.jsx';

const AppLayout = ({ session }) => (
  <>
    {session && <Navbar />}
    <div className="min-h-screen bg-gray-100">
      <Outlet />
    </div>
  </>
);

function App() {
  const { user } = useContext(AuthContext); // Use o contexto de autenticação
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar a sessão atual (já gerenciado pelo AuthProvider, então opcional aqui)
    setLoading(false);
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
        <Route element={<AppLayout session={user} />}>
          {!user ? (
            <>
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/criar-conta" element={<CriarContaScreen />} />
            </>
          ) : (
            <>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/cadastro-joias" element={<CadastroJoiasScreen />} />
              <Route path="/lista-joias" element={<ListaJoiasScreen />} />
              <Route path="/detalhe-joias" element={<DetalheJoiaScreen />} />
              <Route path="/catalogos" element={<CatalogoScreen />} />
              <Route path="/relatorios" element={<RelatoriosScreen />} />
              <Route path="/perfils" element={<PerfilsScreen />} />
            </>
          )}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;