import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig';
import { AuthContext } from '../../context/AuthContext'; // Importe o contexto
import './LoginScreen.css';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext); // Use o contexto para atualizar o usuário

  const handleLogin = async () => {
    setErrorMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErrorMessage(error.message);
      console.error('Erro ao fazer login:', error.message);
      return;
    }

    setUser(data.session?.user); // Atualiza o estado global do usuário
    navigate('/');
  };

  const handleCadastrar = () => {
    navigate('/criar-conta');
  };

  return (
    <div className="login-container">
      <h1 className="login-header">Login</h1>

      <p className="login-label">E-mail</p>
      <input
        className="login-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Digite seu e-mail"
        autoCapitalize="off"
      />

      <p className="login-label">Senha</p>
      <input
        className="login-input"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Digite sua senha"
      />

      {errorMessage && <p className="login-error">{errorMessage}</p>}

      <button className="login-button" onClick={handleLogin}>
        Entrar
      </button>

      <button className="login-button" onClick={handleCadastrar}>
        Criar Conta
      </button>
    </div>
  );
}