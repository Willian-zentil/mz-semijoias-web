import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig';
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
  const navigate = useNavigate();
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchJoias = async () => {
      const { data, error } = await supabase.from('joias').select('*');
      if (error) setError(error.message);
      else {
        setJoias(data || []);
        setFilteredJoias(data || []);
      }
      setLoading(false);
    };
    fetchJoias();
  }, []);

  useEffect(() => {
    const filtered = joias.filter((joia) =>
      (joia.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (joia.referencia?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredJoias(filtered);
    setCurrentPage(1); // Reseta para a primeira página ao buscar
  }, [searchTerm, joias]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

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
    if (custo === 0) return 0; // Evita divisão por zero
    const lucro = calculateProfit(joia);
    const percentage = (lucro / custo) * 100;
    return percentage.toFixed(2); // Arredonda para 2 casas decimais
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
      setCurrentPage(1); // Reseta para a primeira página após exclusão
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
        <button className={Styles.retryButton} onClick={() => window.location.reload()}>Tentar novamente</button>
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
        <p className={Styles.emptyText}>{searchTerm ? 'Nenhuma joia encontrada com esse termo.' : 'Nenhuma joia encontrada.'}</p>
      ) : (
        <>
          <div className={Styles.joiasList}>
            {currentJoias.map((joia) => (
              <div key={joia.id} className={Styles.card}>
                <div className={Styles.cardContentWrapper} onClick={() => navigate(`/detalhe-joias`, { state: { id: joia.id } })}>
                  {joia.foto ? (
                    <img loading='lazy' src={joia.foto} alt={joia.nome} className={Styles.cardImage} />
                  ) : (
                    <div className={Styles.noImage}>Sem imagem</div>
                  )}
                  <p className={Styles.cardTitle}>{joia.nome}</p>
                  <div className={Styles.cardContent}>
                    <div>
                      <p className={Styles.cardPrice}>Revenda R${joia.valorRevenda?.toFixed(2)}</p>
                      <p className={Styles.cardQuantity}>Quantidade: {joia.quantidade}</p>
                    </div>
                    <div className={Styles.contentLucro}>
                      <p className={Styles.cardProfit}>Lucro: R${calculateProfit(joia).toFixed(2)}</p>
                      <p className={Styles.cardProfitPercentage}>Porcentagem %: {calculateProfitPercentage(joia)}%</p>
                    </div>
                  </div>
                </div>
                <div className={Styles.cardActions}>
                  <button className={Styles.buyButton}>Comprar</button>
                  <button className={Styles.deleteButton} onClick={() => handleDeleteClick(joia)}>Excluir</button>
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
              <button className={`${Styles.modalButton} ${Styles.confirmButton}`} onClick={handleConfirmDelete}>Sim</button>
              <button className={`${Styles.modalButton} ${Styles.cancelButton}`} onClick={handleCancelDelete}>Não</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaJoiasScreen;