import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../superbase/supabaseConfig';
import Styles from './RelatoriosScreen.module.css';

function RelatoriosScreen() {
  const [joiasData, setJoiasData] = useState([]);
  const [vendasData, setVendasData] = useState([]);
  const [joiasCountByMonth, setJoiasCountByMonth] = useState({});
  const [startDateJoias, setStartDateJoias] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]);
  const [endDateJoias, setEndDateJoias] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  );
  const [startDateVendas, setStartDateVendas] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]);
  const [endDateVendas, setEndDateVendas] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [editData, setEditData] = useState({ quantidade: '', valor_venda: '', nome_cliente: '' });
  const [revendedoraSelecionada, setRevendedoraSelecionada] = useState('');
  const [revendedoras, setRevendedoras] = useState([]);
  const joiasRef = useRef(null);
  const vendasRef = useRef(null);

  useEffect(() => {
    fetchJoiasData();
    fetchVendasData();
    fetchRevendedoras();
  }, [startDateJoias, endDateJoias, startDateVendas, endDateVendas, revendedoraSelecionada]);

  const fetchJoiasData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('joias')
        .select('*')
        .gte('createdAt', startDateJoias)
        .lte('createdAt', endDateJoias);
      if (error) throw error;
      setJoiasData(data || []);
      const countByMonth = data.reduce((acc, joia) => {
        const month = new Date(joia.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});
      setJoiasCountByMonth(countByMonth);
    } catch (error) {
      setError(`Erro ao buscar joias: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendasData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vendas')
        .select(`
        *,
        joias:fk_joia (nome, referencia, valorAtacado, valorBruto, valorBanho)
      `)
        .gte('data_venda', startDateVendas)
        .lte('data_venda', endDateVendas);

      if (revendedoraSelecionada) {
        query = query.eq('revendedora_id', revendedoraSelecionada);
      }

      console.log('Query:', query.toString()); // Log para depuração
      const { data, error } = await query;
      if (error) throw error;
      setVendasData(data || []);
    } catch (error) {
      setError(`Erro ao buscar vendas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevendedoras = async () => {
    try {
      const { data, error } = await supabase.from('revendedoras').select('id, nome');
      if (error) throw error;
      setRevendedoras(data || []);
    } catch (error) {
      setError(`Erro ao buscar revendedoras: ${error.message}`);
    }
  };

  const calculateTotalVendas = () => {
    return vendasData.reduce((sum, venda) => sum + venda.valor_venda * venda.quantidade, 0).toFixed(2);
  };

  const calculateTotalCusto = () => {
    return vendasData.reduce((sum, venda) => {
      const joia = venda.joias || {}; // Define como objeto vazio se null/undefined
      const custoUnitario = (joia.valorAtacado || 0) + (joia.valorBruto || 0) + (joia.valorBanho || 0);
      return sum + custoUnitario * venda.quantidade;
    }, 0).toFixed(2);
  };

  const calculateTotalLucro = () => {
    const custoTotal = calculateTotalCusto()
    const vendaTotal = calculateTotalVendas()

    return (vendaTotal - custoTotal).toFixed(2)
  }

  const exportJoiasPDF = async () => {
    const input = joiasRef.current;
    const pdf = new jsPDF();
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const { width } = pdf.internal.pageSize;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`relatorio_joias_${startDateJoias}_a_${endDateJoias}.pdf`);
  };

  const exportVendasPDF = async () => {
    const input = vendasRef.current;
    const pdf = new jsPDF();
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const { width } = pdf.internal.pageSize;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`relatorio_vendas_${startDateVendas}_a_${endDateVendas}.pdf`);
  };

  const handleEditClick = (venda) => {
    setSelectedVenda(venda);
    setEditData({
      quantidade: venda.quantidade.toString(),
      valor_venda: venda.valor_venda.toString(),
      nome_cliente: venda.nome_cliente,
    });
    setEditModalVisible(true);
  };

  const handleDeleteClick = (venda) => {
    setSelectedVenda(venda);
    setDeleteModalVisible(true);
  };

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async () => {
    if (!editData.quantidade || !editData.valor_venda || !editData.nome_cliente) {
      setError('Todos os campos são obrigatórios.');
      return;
    }

    const quantidade = parseInt(editData.quantidade, 10);
    const valor_venda = parseFloat(editData.valor_venda);
    if (quantidade <= 0 || valor_venda <= 0) {
      setError('Quantidade e valor de venda devem ser maiores que zero.');
      return;
    }

    try {
      const { error } = await supabase
        .from('vendas')
        .update({
          quantidade,
          valor_venda,
          nome_cliente: editData.nome_cliente.trim(),
        })
        .eq('id', selectedVenda.id);
      if (error) throw error;

      fetchVendasData(); // Atualiza a lista de vendas
      setEditModalVisible(false);
      setSelectedVenda(null);
      setEditData({ quantidade: '', valor_venda: '', nome_cliente: '' });
    } catch (error) {
      setError(`Erro ao editar venda: ${error.message}`);
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      const { error } = await supabase.from('vendas').delete().eq('id', selectedVenda.id);
      if (error) throw error;

      fetchVendasData(); // Atualiza a lista de vendas
      setDeleteModalVisible(false);
      setSelectedVenda(null);
    } catch (error) {
      setError(`Erro ao excluir venda: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setSelectedVenda(null);
    setEditData({ quantidade: '', valor_venda: '', nome_cliente: '' });
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setSelectedVenda(null);
  };

  // Função para formatar a data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <section className={Styles.relatorios}>
        <div className={Styles.container}>
          <div className={Styles.spinner}></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={Styles.relatorios}>
        <div className={Styles.container}>
          <p className={Styles.errorText}>{error}</p>
          <button className={Styles.retryButton} onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      </section>
    );
  }

  return (
    <section className={Styles.relatorios}>
      <div className={Styles.container}>
        <h1 className={Styles.title}>Relatórios</h1>

        {/* Relatório de Joias Cadastradas */}
        <div className={Styles.reportSection} ref={joiasRef}>
          <h2 className={Styles.sectionTitle}>Joias Cadastradas</h2>
          <div className={Styles.dateFilter}>
            <label>De:</label>
            <input
              type="date"
              value={startDateJoias}
              onChange={(e) => setStartDateJoias(e.target.value)}
              className={Styles.dateInput}
            />
            <label>Até:</label>
            <input
              type="date"
              value={endDateJoias}
              onChange={(e) => setEndDateJoias(e.target.value)}
              className={Styles.dateInput}
            />
            <button className={Styles.exportButton} onClick={exportJoiasPDF}>Exportar PDF</button>
          </div>
          {Object.entries(joiasCountByMonth).length > 0 ? (
            <ul className={Styles.reportList}>
              {Object.entries(joiasCountByMonth).map(([month, count]) => (
                <li key={month} className={Styles.reportItem}>
                  {month}: {count} joia(s)
                </li>
              ))}
            </ul>
          ) : (
            <p className={Styles.noData}>Nenhuma joia cadastrada no período selecionado.</p>
          )}
        </div>

        {/* Relatório de Vendas */}
        <div className={Styles.reportSection} ref={vendasRef}>
          <h2 className={Styles.sectionTitle}>Vendas</h2>
          <div className={Styles.dateFilter}>
            <label>De:</label>
            <input
              type="date"
              value={startDateVendas}
              onChange={(e) => setStartDateVendas(e.target.value)}
              className={Styles.dateInput}
            />
            <label>Até:</label>
            <input
              type="date"
              value={endDateVendas}
              onChange={(e) => setEndDateVendas(e.target.value)}
              className={Styles.dateInput}
            />
            <label>Revendedora:</label>
            <select
              className={Styles.dateInput}
              value={revendedoraSelecionada}
              onChange={(e) => setRevendedoraSelecionada(e.target.value)}
            >
              <option value="">Todas</option>
              {revendedoras.map((rev) => (
                <option key={rev.id} value={rev.id}>{rev.nome}</option>
              ))}
            </select>
            <button className={Styles.exportButton} onClick={exportVendasPDF}>Exportar PDF</button>
          </div>
          <div className={Styles.summary}>
            <p className={Styles.totalVendas}>Total de Vendas: R${calculateTotalVendas()}</p>
            <p className={Styles.totalCusto}>Total de Custos: R${calculateTotalCusto()}</p>
            <p className={Styles.lucroTotal}>Total de Lucro: R${calculateTotalLucro()}</p>
          </div>
          {vendasData.length > 0 ? (
            <table className={Styles.reportTable}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Joia</th>
                  <th>Referência</th>
                  <th>Data da Venda</th>
                  <th>Valor da Venda</th>
                  <th>Quantidade</th>
                  <th>Valor Comissão</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendasData.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.nome_cliente}</td>
                    <td>{venda.joias?.nome || venda.nome_joia || 'Sem Nome'}</td>
                    <td>{venda.joias?.referencia || venda.referencia_joia || 'Sem Referência'}</td>
                    <td>{formatDate(venda.data_venda)}</td>
                    <td>R${(venda.valor_venda * venda.quantidade).toFixed(2)}</td>
                    <td>{venda.quantidade}</td>
                    <td>R${(venda.valor_comissao || 0).toFixed(2)}</td>
                    <td>
                      <button className={Styles.editButton} onClick={() => handleEditClick(venda)}>Editar</button>
                      <button className={Styles.deleteButton} onClick={() => handleDeleteClick(venda)}>Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={Styles.noData}>Nenhuma venda no período selecionado.</p>
          )}
        </div>

        {/* Modal de Edição */}
        {editModalVisible && selectedVenda && (
          <div className={Styles.modalOverlay}>
            <div className={Styles.modalContainer}>
              <h2 className={Styles.modalTitle}>Editar Venda</h2>
              <div className={Styles.modalContent}>
                <label className={Styles.modalLabel}>Quantidade:</label>
                <input
                  type="number"
                  className={Styles.modalInput}
                  value={editData.quantidade}
                  onChange={(e) => handleEditChange('quantidade', e.target.value)}
                  min="1"
                />
                <label className={Styles.modalLabel}>Valor da Venda (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  className={Styles.modalInput}
                  value={editData.valor_venda}
                  onChange={(e) => handleEditChange('valor_venda', e.target.value)}
                  min="0.01"
                />
                <label className={Styles.modalLabel}>Nome do Cliente:</label>
                <input
                  type="text"
                  className={Styles.modalInput}
                  value={editData.nome_cliente}
                  onChange={(e) => handleEditChange('nome_cliente', e.target.value)}
                />
              </div>
              <div className={Styles.modalButtons}>
                <button className={`${Styles.modalButton} ${Styles.confirmButton}`} onClick={handleEditSubmit}>Salvar</button>
                <button className={`${Styles.modalButton} ${Styles.cancelButton}`} onClick={handleCancelEdit}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {deleteModalVisible && selectedVenda && (
          <div className={Styles.modalOverlay}>
            <div className={Styles.modalContainer}>
              <h2 className={Styles.modalTitle}>Confirmar Exclusão</h2>
              <p>Deseja realmente excluir a venda do cliente "{selectedVenda.nome_cliente}"?</p>
              <div className={Styles.modalButtons}>
                <button className={`${Styles.modalButton} ${Styles.confirmButton}`} onClick={handleDeleteSubmit}>Sim</button>
                <button className={`${Styles.modalButton} ${Styles.cancelButton}`} onClick={handleCancelDelete}>Não</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default RelatoriosScreen;