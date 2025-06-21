import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig.js';
import Styles from './CriarContaScreen.module.css';

function CriarContaScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [error, setError] = useState('');
  const [isRevendedora, setIsRevendedora] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem.');
      return;
    }

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      // Registrar o usuário
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { display_name: nome, is_revendedora: isRevendedora },
        },
      });

      if (signUpError) {
        throw new Error(`Erro ao registrar usuário: ${signUpError.message}`);
      }

      if (data.user) {
        console.log('Usuário criado:', data.user.id);
        alert('Cadastro realizado com sucesso! Aguarde a aprovação do administrador.');
        navigate('/login');
      }
    } catch (err) {
      setError(`Erro ao criar conta: ${err.message}`);
      console.error(err);
    }
  };

  return (
    <div className={Styles.criarConta}>
      <div className={Styles.criarContaForm}>
        <h2>Criar Conta</h2>
        {error && <p className={Styles.errorMessage}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={Styles.formGroup}>
            <label htmlFor="nome">Nome</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>
          <div className={Styles.formGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={Styles.formGroup}>
            <label htmlFor="senha">Senha</label>
            <div className={Styles.passwordContainer}>
              <input
                type={showSenha ? 'text' : 'password'}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className={Styles.showPassword}
              >
                {showSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className={Styles.formGroup}>
            <label htmlFor="confirmarSenha">Confirmar Senha</label>
            <div className={Styles.passwordContainer}>
              <input
                type={showConfirmarSenha ? 'text' : 'password'}
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                className={Styles.showPassword}
              >
                {showConfirmarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className={Styles.formGroup}>
            <label>
              <input
                type="checkbox"
                checked={isRevendedora}
                onChange={(e) => setIsRevendedora(e.target.checked)}
              /> É revendedora?
            </label>
          </div>
          <button type="submit" className={Styles.submitButton}>Cadastrar</button>
        </form>
      </div>
    </div>
  );
}

export default CriarContaScreen;