import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig';
import Styles from './ListarJoiasScreen.module.css';

const ListaJoiasScreen = () => {
  const [joias, setJoias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [joiaToDelete, setJoiaToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJoias = async () => {
      const { data, error } = await supabase.from('joias').select('*');
      if (error) setError(error.message);
      else setJoias(data || []);
      setLoading(false);
    };
    fetchJoias();
  }, []);

  const handleDeleteClick = (joia) => {
    setJoiaToDelete(joia);
    setModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!joiaToDelete) return;

    try {
      const { error } = await supabase.from('joias').delete().eq('id', joiaToDelete.id);
      if (error) throw new Error(error.message);

      setJoias(joias.filter((joia) => joia.id !== joiaToDelete.id));
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

  if (joias.length === 0) {
    return (
      <div className={Styles.listContainer}>
        <p className={Styles.emptyText}>Nenhuma joia encontrada.</p>
      </div>
    );
  }

  return (
    <div className={Styles.listContainer}>
      <div className={Styles.joiasList}>
        {joias.map((joia) => (
          <div key={joia.id} className={Styles.card}>
            <div className={Styles.cardContentWrapper} onClick={() => navigate(`/detalhe-joias`, { state: { id: joia.id } })}>
              {joia.foto ? (
                <img src={joia.foto} alt={joia.nome} className={Styles.cardImage} />
              ) : (
                <div className={Styles.noImage}>Sem imagem</div>
              )}
              <div className={Styles.cardContent}>
                <p className={Styles.cardTitle}>{joia.nome}</p>
                <p className={Styles.cardPrice}>R${joia.valorRevenda?.toFixed(2)}</p>
                <p className={Styles.cardQuantity}>Quantidade: {joia.quantidade}</p>
              </div>
            </div>
            <div className={Styles.cardActions}>
              <button className={Styles.buyButton}>Comprar</button>
              <button className={Styles.deleteButton} onClick={() => handleDeleteClick(joia)}>Excluir</button>
            </div>
          </div>
        ))}
      </div>

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