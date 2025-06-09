import React, { useState, useContext, useEffect } from 'react';
import { supabase } from '../../superbase/supabaseConfig';
import { AuthContext } from '../../context/AuthContext';
import Styles from './PerfilsScreen.module.css';

function PerfilsScreen() {
  const { user } = useContext(AuthContext); // Admin principal autenticado
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState('');
  const [taxaDeComissao, setTaxaDeComissao] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setError('Usuário não autenticado. Faça login novamente.');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !accountType) {
      setError('Por favor, insira um e-mail e selecione o tipo de conta.');
      return;
    }

    try {
      if (accountType === 'revendedora') {
        if (!taxaDeComissao) {
          setError('Por favor, insira a taxa de comissão para revendedoras.');
          return;
        }
        const { error: insertError } = await supabase
          .from('revendedoras')
          .upsert(
            { email, taxa_de_comissao: parseFloat(taxaDeComissao), user_id: null },
            { onConflict: 'email' }
          );
        if (insertError) throw insertError;
      } else if (accountType === 'administrador') {
        const { error: insertError } = await supabase
          .from('administradores')
          .upsert(
            { email, user_id: null },
            { onConflict: 'email' }
          );
        if (insertError) throw insertError;
      }
      setMessage(`Usuário vinculado como ${accountType} com sucesso! Para usuários já criados, o user_id será atualizado após o login ou manualmente.`);
    } catch (err) {
      setError(`Erro ao vincular perfil: ${err.message}`);
    }
  };

  return (
    <section className={Styles.perfils}>
      <div className={Styles.container}>
        <h1>Vincular Usuário ao Sistema</h1>
        {message && <p className={Styles.success}>{message}</p>}
        {error && <p className={Styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={Styles.form}>
          <div className={Styles.formGroup}>
            <label>Email do Usuário:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={Styles.input}
              required
            />
          </div>
          <div className={Styles.formGroup}>
            <label>Tipo de Conta:</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className={Styles.input}
              required
            >
              <option value="">Selecione...</option>
              <option value="revendedora">Revendedora</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          {accountType === 'revendedora' && (
            <div className={Styles.formGroup}>
              <label>Taxa de Comissão (%):</label>
              <input
                type="number"
                step="0.01"
                value={taxaDeComissao}
                onChange={(e) => setTaxaDeComissao(e.target.value)}
                className={Styles.input}
                placeholder="Ex.: 10.50"
                required
              />
            </div>
          )}
          <button type="submit" className={Styles.button}>
            Vincular Perfil
          </button>
        </form>
      </div>
    </section>
  );
}

export default PerfilsScreen;