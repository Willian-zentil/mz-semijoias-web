import React, { useState, useContext, useEffect } from 'react';
import { supabase } from '../../superbase/supabaseConfig.js';
import { AuthContext } from '../../context/AuthContext';
import Styles from './PerfilsScreen.module.css';

function PerfilsScreen() {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState('');
  const [taxaDeComissao, setTaxaDeComissao] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      setError('Usuário não autenticado. Faça login novamente.');
    } else {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const [admins, revendedoras] = await Promise.all([
        supabase.from('administradores').select('email, user_id, nome'),
        supabase.from('revendedoras').select('email, user_id, taxa_de_comissao, nome'),
      ]);

      if (admins.error || revendedoras.error) throw admins.error || revendedoras.error;

      const adminUsers = admins.data.map((admin) => ({
        email: admin.email,
        type: 'Administrador',
        nome: admin.nome,
      }));
      const revendaUsers = revendedoras.data.map((revenda) => ({
        email: revenda.email,
        type: 'Revendedora',
        nome: revenda.nome,
      }));

      setUsers([...adminUsers, ...revendaUsers]);
    } catch (err) {
      setError(`Erro ao carregar usuários: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !accountType) {
      setError('Por favor, insira um e-mail e selecione o tipo de conta.');
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase
        .rpc('get_user_by_email', { email_input: email });

      console.log('authData:', authData, 'authError:', authError);

      if (authError || !authData || authData.length === 0) {
        setError('E-mail não encontrado no sistema. O usuário precisa se cadastrar primeiro.');
        return;
      }

      const userData = authData[0];

      if (accountType === 'revendedora') {
        if (!taxaDeComissao) {
          setError('Por favor, insira a taxa de comissão para revendedoras.');
          return;
        }
        const { error: insertError } = await supabase
          .from('revendedoras')
          .upsert(
            {
              email,
              taxa_de_comissao: parseFloat(taxaDeComissao),
              user_id: userData.id,
              nome: userData.user_metadata.display_name || 'Não informado',
            },
            { onConflict: 'email' }
          );
        if (insertError) throw insertError;
      } else if (accountType === 'administrador') {
        const { error: insertError } = await supabase
          .from('administradores')
          .upsert(
            {
              email,
              user_id: userData.id,
              nome: userData.user_metadata.display_name || 'Não informado',
            },
            { onConflict: 'email' }
          );
        if (insertError) throw insertError;
      }
      setMessage(`Usuário vinculado como ${accountType} com sucesso!`);
      fetchUsers();
    } catch (err) {
      setError(`Erro ao vincular perfil: ${err.message}`);
      console.error('Erro no handleSubmit:', err);
    }
  };

  const handleUnlinkUser = async (email, type) => {
    try {
      let { error } = { data: null, error: null };

      if (type === 'Administrador') {
        ({ error } = await supabase
          .from('administradores')
          .delete()
          .eq('email', email));
      } else if (type === 'Revendedora') {
        ({ error } = await supabase
          .from('revendedoras')
          .delete()
          .eq('email', email));
      }

      if (error) throw error;

      setMessage(`Usuário ${email} desvinculado com sucesso!`);
      fetchUsers();
    } catch (err) {
      setError(`Erro ao desvincular usuário: ${err.message}`);
      console.error('Erro no handleUnlinkUser:', err);
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

        <div className={Styles.tableContainer}>
          <h2>Usuários Vinculados</h2>
          {error && <p className={Styles.error}>{error}</p>}
          <table className={Styles.userTable}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Tipo de Conta</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.nome || 'Não informado'}</td>
                    <td>{user.email}</td>
                    <td>{user.type}</td>
                    <td>
                      <button
                        className={Styles.unlinkButton}
                        onClick={() => handleUnlinkUser(user.email, user.type)}
                      >
                        Desvincular
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">Nenhum usuário vinculado encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default PerfilsScreen;