import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig';
import Styles from './ListarJoiasScreen.module.css';

const ListaJoiasScreen = () => {
  const [joias, setJoias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
              <button className={Styles.deleteButton}>Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListaJoiasScreen;