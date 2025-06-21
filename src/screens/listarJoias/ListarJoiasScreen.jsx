import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig.js';
import Styles from './ListarJoiasScreen.module.css';

const ListaJoiasScreen = () => {
  const [joias, setJoias] = useState([]);
  const [filteredJoias, setFilteredJoias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [joiaToDelete, setJoiaToDelete] = useState(null);
  const [modalCompraVisible, setModalCompraVisible] = useState(false);
  const [joiaToBuy, setJoiaToBuy] = useState(null);
  const [compraData, setCompraData] = useState({ quantidade: 1, valorVenda: '', nomeCliente: '' });
  const [isRevendedora, setIsRevendedora] = useState(false);
  const [revendedoraSelecionada, setRevendedoraSelecionada] = useState('');
  const [revendedoraValue, setRevendedoraValue] = useState('0.00');
  const [revendedoras, setRevendedoras] = useState([]);
  const navigate = useNavigate();
  const itemsPerPage = 15;

  useEffect(() => {
    const syncUserRole = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Erro ao buscar usuário:', userError.message);
        setError('Erro ao verificar perfil do usuário.');
        setLoading(false);
        return false;
      }
      if (user) {
        const isRevendedora = user.user_metadata?.is_revendedora || false;

        if (isRevendedora) {
          const { data: revendedoraData, error: revError } = await supabase
            .from('revendedoras')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (revError && revError.code !== 'PGRST116') {
            console.error('Erro ao buscar revendedora:', revError.message);
            setError('Erro ao verificar vínculo de revendedora.');
            setLoading(false);
            return false;
          } else if (!revendedoraData) {
            setError('Revendedora não vinculada. Contate o administrador.');
            setLoading(false);
            return false;
          }
        }
        return true;
      }
      setError('Usuário não autenticado.');
      setLoading(false);
      return false;
    };

    const fetchData = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }

      // Verificar role do usuário
      const isAuthorized = await syncUserRole();
      if (!isAuthorized) return;

      const { data: adminCheck, error: adminError } = await supabase
        .from('administradores')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Erro ao verificar administrador:', adminError.message);
      }

      const { data: revendedoraCheck, error: revError } = await supabase
        .from('revendedoras')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (revError && revError.code !== 'PGRST116') {
        console.error('Erro ao verificar revendedora:', revError.message);
      }

      let query;
      if (adminCheck) {
        query = supabase.from('joias').select('*'); // Admin vê todas as joias
      } else if (revendedoraCheck) {
        query = supabase.from('joias').select('*'); // Revendedora vê todas as joias
      } else {
        setError('Usuário não autorizado (nem administrador nem revendedora).');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await query;
      console.log('joias:', data, 'fetchError:', fetchError);

      if (fetchError) {
        setError(`Erro ao carregar joias: ${fetchError.message}`);
      } else {
        setJoias(data || []);
        setFilteredJoias(data || []);
      }

      const { data: revData, error: revFetchError } = await supabase
        .from('revendedoras')
        .select('nome');
      if (revFetchError) {
        setError(`Erro ao carregar revendedoras: ${revFetchError.message}`);
      } else {
        setRevendedoras(revData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = joias.filter((joia) =>
      (joia.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (joia.referencia?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredJoias(filtered);
    setCurrentPage(1);
  }, [searchTerm, joias]);

  useEffect(() => {
    const updateRevendedoraValue = async () => {
      const value = await calculateRevendedoraValue();
      setRevendedoraValue(value);
    };
    if (isRevendedora && joiaToBuy && modalCompraVisible) {
      updateRevendedoraValue();
    } else {
      setRevendedoraValue('0.00');
    }
  }, [isRevendedora, revendedoraSelecionada, joiaToBuy, modalCompraVisible, compraData.valorVenda]);

  const calculateProfit = (joia) => {
    const valorRevenda = joia.valorRevenda || 0;
    const valorBanho = joia.valorBanho || 0;
    const valorAtacado = joia.valorAtacado || 0;
    const valorBruto = joia.valorBruto || 0;
    const custo = valorBanho + valorAtacado + valorBruto;
    const lucro = valorRevenda - custo;
    return lucro;
  };

  const calculateProfitPercentage = (joia) => {
    const valorBanho = joia.valorBanho || 0;
    const valorAtacado = joia.valorAtacado || 0;
    const valorBruto = joia.valorBruto || 0;
    const custo = valorBanho + valorAtacado + valorBruto;
    if (custo === 0) return 0;
    const lucro = calculateProfit(joia);
    const percentage = (lucro / custo) * 100;
    return percentage.toFixed(2);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (joia) => {
    setJoiaToDelete(joia);
    setModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!joiaToDelete) return;

    try {
      const { error } = await supabase.from('joias').delete().eq('id', joiaToDelete.id);
      if (error) throw new Error(error.message);

      const updatedJoias = joias.filter((joia) => joia.id !== joiaToDelete.id);
      setJoias(updatedJoias);
      setFilteredJoias(updatedJoias);
      setCurrentPage(1);
      setModalVisible(false);
      setJoiaToDelete(null);
    } catch (error) {
      setError(`Erro ao excluir joia: ${error.message}`);
      setModalVisible(false);
      setJoiaToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setModalVisible(false);
    setJoiaToDelete(null);
  };

  const handleBuyClick = (joia) => {
    setJoiaToBuy(joia);
    setCompraData({ quantidade: 1, valorVenda: joia.valorRevenda?.toString() || '', nomeCliente: '' });
    setIsRevendedora(false);
    setRevendedoraSelecionada('');
    setModalCompraVisible(true);
  };

  const handleCompraChange = (field, value) => {
    setCompraData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRevendedoraChange = (e) => {
    const checked = e.target.checked;
    setIsRevendedora(checked);
    if (checked && !compraData.valorVenda) {
      const valorRevenda = parseFloat(joiaToBuy?.valorRevenda || '0');
      setCompraData((prev) => ({
        ...prev,
        valorVenda: valorRevenda.toString(),
      }));
    }
  };

  const handleRevendedoraSelect = (e) => {
    setRevendedoraSelecionada(e.target.value);
  };

  const calculateRevendedoraValue = async () => {
    const valorVenda = parseFloat(compraData.valorVenda || joiaToBuy?.valorRevenda || '0');
    let revendedoraComissao = 0;
    if (isRevendedora && revendedoraSelecionada) {
      const { data, error } = await supabase
        .from('revendedoras')
        .select('taxa_de_comissao')
        .eq('nome', revendedoraSelecionada)
        .single();
      if (!error && data) {
        revendedoraComissao = data.taxa_de_comissao / 100;
      }
    }
    const baseValue = valorVenda * revendedoraComissao;
    return baseValue.toFixed(2);
  };

  const handleConfirmCompra = async () => {
    if (!joiaToBuy || !compraData.quantidade || !compraData.valorVenda || !compraData.nomeCliente) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (isRevendedora && !revendedoraSelecionada) {
      alert('Selecione uma revendedora.');
      return;
    }

    const quantidade = parseInt(compraData.quantidade, 10);
    const valorVenda = parseFloat(compraData.valorVenda);
    if (quantidade <= 0 || valorVenda < 0 || quantidade > joiaToBuy.quantidade) {
      alert('Quantidade inválida ou maior que o estoque disponível.');
      return;
    }

    let revendedoraId = null;
    let valorComissao = 0;
    if (isRevendedora) {
      const { data: revendedoraData, error: revendedoraError } = await supabase
        .from('revendedoras')
        .select('id, taxa_de_comissao')
        .eq('nome', revendedoraSelecionada)
        .single();
      if (revendedoraError || !revendedoraData) {
        alert('Revendedora não encontrada.');
        return;
      }
      revendedoraId = revendedoraData.id;
      valorComissao = valorVenda * (revendedoraData.taxa_de_comissao / 100);
    }

    try {
      const { error: vendaError } = await supabase.from('vendas').insert({
        joia_id: joiaToBuy.id,
        quantidade,
        valor_venda: valorVenda,
        nome_cliente: compraData.nomeCliente.trim(),
        data_venda: new Date().toISOString(),
        revendedora_id: revendedoraId,
        valor_comissao: valorComissao,
        nome_joia: joiaToBuy.nome,
        referencia_joia: joiaToBuy.referencia,
      });
      if (vendaError) throw new Error(vendaError.message);

      const novaQuantidade = joiaToBuy.quantidade - quantidade;
      const { error: updateError } = await supabase
        .from('joias')
        .update({ quantidade: novaQuantidade })
        .eq('id', joiaToBuy.id);
      if (updateError) throw new Error(updateError.message);

      const updatedJoias = joias.map((joia) =>
        joia.id === joiaToBuy.id ? { ...joia, quantidade: novaQuantidade } : joia
      );
      setJoias(updatedJoias);
      setFilteredJoias(updatedJoias);
      setModalCompraVisible(false);
      setJoiaToBuy(null);
      setCompraData({ quantidade: 1, valorVenda: '', nomeCliente: '' });
      setIsRevendedora(false);
      setRevendedoraSelecionada('');
      alert('Compra registrada com sucesso!');
    } catch (error) {
      setError(`Erro ao registrar compra: ${error.message}`);
    }
  };

  const handleCancelCompra = () => {
    setModalCompraVisible(false);
    setJoiaToBuy(null);
    setCompraData({ quantidade: 1, valorVenda: '', nomeCliente: '' });
    setIsRevendedora(false);
    setRevendedoraSelecionada('');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJoias = filteredJoias.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredJoias.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  if (loading) {
    return (
      <div className={Styles.loadingContainer}>
        <div className={Styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={Styles.errorContainer}>
        <p className={Styles.errorText}>{error}</p>
        <button className={Styles.retryButton} onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className={Styles.listContainer}>
      <div className={Styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar por nome ou referência..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={Styles.searchInput}
        />
      </div>
      {filteredJoias.length === 0 ? (
        <p className={Styles.emptyText}>
          {searchTerm ? 'Nenhuma joia encontrada com esse termo.' : 'Nenhuma joia encontrada.'}
        </p>
      ) : (
        <>
          <div className={Styles.joiasList}>
            {currentJoias.map((joia) => (
              <div key={joia.id} className={Styles.card}>
                <div
                  className={Styles.cardContentWrapper}
                  onClick={() => navigate(`/detalhe-joias`, { state: { id: joia.id } })}
                >
                  {joia.foto ? (
                    <img loading="lazy" src={joia.foto} alt={joia.nome} className={Styles.cardImage} />
                  ) : (
                    <div className={Styles.noImage}>Sem imagem</div>
                  )}
                  <p className={Styles.cardTitle}>{joia.nome}</p>
                  <div className={Styles.cardContent}>
                    <div>
                      <p className={Styles.cardPrice}>
                        Revenda R${joia.valorRevenda?.toFixed(2) || '0.00'}
                      </p>
                      <p className={Styles.cardQuantity}>Quantidade: {joia.quantidade || 0}</p>
                    </div>
                    <div className={Styles.contentLucro}>
                      <p className={Styles.cardProfit}>
                        Lucro: R${calculateProfit(joia).toFixed(2)}
                      </p>
                      <p className={Styles.cardProfitPercentage}>
                        Porcentagem %: {calculateProfitPercentage(joia)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className={Styles.cardActions}>
                  <button className={Styles.buyButton} onClick={() => handleBuyClick(joia)}>
                    Venda
                  </button>
                  <button className={Styles.deleteButton} onClick={() => handleDeleteClick(joia)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={Styles.pagination}>
            <button
              className={Styles.paginationButton}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span className={Styles.paginationInfo}>
              Página {currentPage} de {totalPages}
            </span>
            <button
              className={Styles.paginationButton}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Próximo
            </button>
          </div>
        </>
      )}

      {modalVisible && (
        <div className={Styles.modalOverlay}>
          <div className={Styles.modalContainer}>
            <h2 className={Styles.modalTitle}>Confirmar Exclusão</h2>
            <p>Deseja realmente excluir a joia "{joiaToDelete?.nome}"?</p>
            <div className={Styles.modalButtons}>
              <button
                className={`${Styles.modalButton} ${Styles.confirmButton}`}
                onClick={handleConfirmDelete}
              >
                Sim
              </button>
              <button
                className={`${Styles.modalButton} ${Styles.cancelButton}`}
                onClick={handleCancelDelete}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      {modalCompraVisible && joiaToBuy && (
        <div className={Styles.modalOverlay}>
          <div className={Styles.modalContainer}>
            <h2 className={Styles.modalTitle}>Registrar Compra</h2>
            <p>Joia: {joiaToBuy.nome}</p>
            <div className={Styles.modalContent}>
              <label className={Styles.modalLabel}>*Quantidade:</label>
              <input
                type="number"
                className={Styles.modalInput}
                value={compraData.quantidade}
                onChange={(e) => handleCompraChange('quantidade', e.target.value)}
                min="1"
                max={joiaToBuy.quantidade}
              />
              <label className={Styles.modalLabel}>*Valor de Venda (R$):</label>
              <input
                type="number"
                step="0.01"
                className={Styles.modalInput}
                value={compraData.valorVenda}
                onChange={(e) => handleCompraChange('valorVenda', e.target.value)}
                disabled={isRevendedora}
              />
              <label className={Styles.modalLabel}>
                <input
                  type="checkbox"
                  checked={isRevendedora}
                  onChange={handleRevendedoraChange}
                /> Venda por Revendedora
              </label>
              <select
                className={`${Styles.modalInput} ${!isRevendedora ? Styles.disabledSelect : ''}`}
                value={revendedoraSelecionada}
                onChange={handleRevendedoraSelect}
                disabled={!isRevendedora}
              >
                <option value="">Selecione uma revendedora</option>
                {revendedoras.map((rev) => (
                  <option key={rev.nome} value={rev.nome}>
                    {rev.nome}
                  </option>
                ))}
              </select>
              <p
                className={`${Styles.revendedoraValue} ${!isRevendedora ? Styles.disabledText : ''}`}
              >
                Valor da Revendedora: R${revendedoraValue}
              </p>
              <label className={Styles.modalLabel}>*Nome do Cliente:</label>
              <input
                type="text"
                className={Styles.modalInput}
                value={compraData.nomeCliente}
                onChange={(e) => handleCompraChange('nomeCliente', e.target.value)}
              />
            </div>
            <div className={Styles.modalButtons}>
              <button
                className={`${Styles.modalButton} ${Styles.confirmButton}`}
                onClick={handleConfirmCompra}
              >
                Confirmar
              </button>
              <button
                className={`${Styles.modalButton} ${Styles.cancelButton}`}
                onClick={handleCancelCompra}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaJoiasScreen;