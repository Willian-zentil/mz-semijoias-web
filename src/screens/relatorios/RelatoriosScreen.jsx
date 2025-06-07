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
  const [endDateJoias, setEndDateJoias] = useState(new Date().toISOString().split('T')[0]);
  const [startDateVendas, setStartDateVendas] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]);
  const [endDateVendas, setEndDateVendas] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const joiasRef = useRef(null);
  const vendasRef = useRef(null);

  useEffect(() => {
    fetchJoiasData();
    fetchVendasData();
  }, [startDateJoias, endDateJoias, startDateVendas, endDateVendas]);

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
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          joias (nome, referencia, valorAtacado, valorBruto, valorBanho)
        `)
        .gte('data_venda', startDateVendas)
        .lte('data_venda', endDateVendas);
      if (error) throw error;
      setVendasData(data || []);
    } catch (error) {
      setError(`Erro ao buscar vendas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalVendas = () => {
    return vendasData.reduce((sum, venda) => sum + venda.valor_venda * venda.quantidade, 0).toFixed(2);
  };

  const calculateTotalCusto = () => {
    return vendasData.reduce((sum, venda) => {
      const joia = venda.joias;
      const custoUnitario = (joia.valorAtacado || 0) + (joia.valorBruto || 0) + (joia.valorBanho || 0);
      return sum + custoUnitario * venda.quantidade;
    }, 0).toFixed(2);
  };

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
            <button className={Styles.exportButton} onClick={exportVendasPDF}>Exportar PDF</button>
          </div>
          <div className={Styles.summary}>
            <p className={Styles.totalVendas}>Total de Vendas: R${calculateTotalVendas()}</p>
            <p className={Styles.totalCusto}>Total de Custos: R${calculateTotalCusto()}</p>
          </div>
          {vendasData.length > 0 ? (
            <table className={Styles.reportTable}>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Joia</th>
                  <th>Referência</th>
                  <th>Valor da Venda</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {vendasData.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.nome_cliente}</td>
                    <td>{venda.joias.nome}</td>
                    <td>{venda.joias.referencia}</td>
                    <td>R${(venda.valor_venda * venda.quantidade).toFixed(2)}</td>
                    <td>{venda.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={Styles.noData}>Nenhuma venda no período selecionado.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default RelatoriosScreen;