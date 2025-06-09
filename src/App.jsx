import { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './superbase/supabaseConfig';
import { AuthContext } from './context/AuthContext'; // Importe o contexto
import LoginScreen from './screens/login/LoginScreen';
import HomeScreen from './screens/home/HomeScreen';
import CadastroJoiasScreen from './screens/cadastro/CadastroJoiasScreen';
import ListaJoiasScreen from './screens/listarJoias/ListarJoiasScreen';
import DetalheJoiaScreen from './screens/detalheJoia/DetalheJoiaScreen';
import Navbar from './components/navbar/Navbar';
import CatalogoScreen from './screens/catalogo/catalogoScreen';
import RelatoriosScreen from './screens/relatorios/RelatoriosScreen';
import CriarContaScreen from './screens/criarConta/CriarContaScreen';
import PerfilsScreen from './screens/perfils/PerfilsScreen';

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