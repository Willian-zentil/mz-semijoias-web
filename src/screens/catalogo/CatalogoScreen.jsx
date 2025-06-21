import React, { useState, useEffect } from 'react';
import { supabase } from '../../superbase/supabaseConfig.js';
import Styles from './CatalogoScreen.module.css';

const CatalogoScreen = () => {
  const [catalogos, setCatalogos] = useState([]);
  const [selectedCatalogo, setSelectedCatalogo] = useState(null);
  const [joias, setJoias] = useState([]);
  const [allJoias, setAllJoias] = useState([]);
  const [nomeCatalogo, setNomeCatalogo] = useState('');
  const [joiaToAdd, setJoiaToAdd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRevendedora, setIsRevendedora] = useState(false);
  const [revendedoras, setRevendedoras] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revendedoraToLink, setRevendedoraToLink] = useState('');
  const [linkedRevendedoras, setLinkedRevendedoras] = useState([]);
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

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
      setIsAdmin(!!adminCheck);

      const { data: revendedoraCheck, error: revError } = await supabase
        .from('revendedoras')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (revError && revError.code !== 'PGRST116') {
        console.error('Erro ao verificar revendedora:', revError.message);
      }
      setIsRevendedora(!!revendedoraCheck);

      if (!adminCheck && !revendedoraCheck) {
        setError('Usuário não autorizado (nem administrador nem revendedora).');
        setLoading(false);
        return;
      }

      const { data: joiasData, error: fetchError } = await supabase
        .from('joias')
        .select('*');
      console.log('joiasData:', joiasData, 'fetchError:', fetchError);
      if (fetchError) {
        setError(`Erro ao carregar joias: ${fetchError.message}`);
      } else {
        setAllJoias(joiasData || []);
      }

      const { data: catalogosData, error: catalogosError } = await supabase
        .from('catalogos')
        .select('id, nome');
      console.log('catalogosData:', catalogosData, 'catalogosError:', catalogosError);
      if (catalogosError) {
        setError(`Erro ao carregar catálogos: ${catalogosError.message}`);
        setLoading(false);
        return;
      }
      setCatalogos(catalogosData || []);

      const { data: revData, error: revFetchError } = await supabase
        .from('revendedoras')
        .select('id, nome');
      if (revFetchError) {
        setError(`Erro ao carregar revendedoras: ${revFetchError.message}`);
      } else {
        setRevendedoras(revData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleCreateCatalogo = async (e) => {
    e.preventDefault();
    if (!nomeCatalogo.trim()) {
      setError('O nome do catálogo é obrigatório.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('catalogos')
        .insert({ nome: nomeCatalogo, user_id: user.id });
      if (error) throw new Error(error.message);

      setNomeCatalogo('');
      setError(null);
      const { data: catalogosData } = await supabase.from('catalogos').select('id, nome');
      console.log('Novo catálogo criado, catalogosData:', catalogosData);
      setCatalogos(catalogosData || []);
    } catch (error) {
      setError(`Erro ao criar catálogo: ${error.message}`);
    }
  };

  const handleAddJoia = async () => {
    if (!selectedCatalogo || !joiaToAdd) {
      setError('Selecione um catálogo e uma joia primeiro.');
      return;
    }

    try {
      const { error } = await supabase
        .from('catalogo_joias')
        .insert({ catalogo_id: parseInt(selectedCatalogo), joia_id: joiaToAdd });
      if (error) throw new Error(error.message);

      setJoiaToAdd('');
      setError(null);
      await fetchJoias(selectedCatalogo);
    } catch (error) {
      setError(`Erro ao adicionar joia ao catálogo: ${error.message}`);
    }
  };

  const handleLinkRevendedora = async () => {
    if (!selectedCatalogo || !revendedoraToLink) {
      setError('Selecione um catálogo e uma revendedora primeiro.');
      return;
    }

    try {
      const { error } = await supabase
        .from('catalogo_revendedoras')
        .insert({ catalogo_id: parseInt(selectedCatalogo), revendedora_id: revendedoraToLink });
      if (error) throw new Error(error.message);

      setRevendedoraToLink('');
      setError(null);
      await fetchLinkedRevendedoras(selectedCatalogo);
    } catch (error) {
      setError(`Erro ao vincular revendedora ao catálogo: ${error.message}`);
    }
  };

  const handleUnlinkRevendedora = async (revendedoraId) => {
    try {
      const { error } = await supabase
        .from('catalogo_revendedoras')
        .delete()
        .eq('catalogo_id', parseInt(selectedCatalogo))
        .eq('revendedora_id', revendedoraId);
      if (error) throw new Error(error.message);

      setError(null);
      await fetchLinkedRevendedoras(selectedCatalogo);
    } catch (error) {
      setError(`Erro ao desvincular revendedora: ${error.message}`);
    }
  };

  const fetchJoias = async (catalogoId) => {
    const { data, error } = await supabase
      .from('catalogo_joias')
      .select('joia_id, joias(nome, valorRevenda, foto, referencia, quantidade)')
      .eq('catalogo_id', parseInt(catalogoId));
    console.log('catalogoJoiasData:', data, 'catalogoJoiasError:', error);
    if (error) {
      setError(`Erro ao carregar joias do catálogo: ${error.message}`);
      return;
    }
    setJoias(data.map(item => item.joias) || []);
    setCurrentPage(1);
  };

  const fetchLinkedRevendedoras = async (catalogoId) => {
    const { data, error } = await supabase
      .from('catalogo_revendedoras')
      .select('revendedora_id')
      .eq('catalogo_id', parseInt(catalogoId));
    if (error) {
      console.error('Erro ao carregar revendedoras vinculadas:', error.message);
      return;
    }
    const revendedoraIds = data.map(item => item.revendedora_id);
    const { data: revendedoraNames } = await supabase
      .from('revendedoras')
      .select('nome')
      .in('id', revendedoraIds);
    setLinkedRevendedoras(revendedoraNames || []);
  };

  const handleSelectCatalogo = async (catalogoId) => {
    setSelectedCatalogo(catalogoId);
    setIsModalOpen(true);
    await fetchJoias(catalogoId);
    await fetchLinkedRevendedoras(catalogoId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCatalogo(null);
    setJoiaToAdd('');
    setRevendedoraToLink('');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentJoias = joias.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(joias.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const filteredCatalogos = catalogos.filter(catalogo =>
    catalogo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <section className={Styles.container}>
      <h1>Catálogos</h1>
      <div className={Styles.searchBar}>
        <input
          type="text"
          placeholder="Pesquisar catálogos por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={Styles.searchInput}
        />
      </div>
      {isAdmin && (
        <div className={Styles.formContainer}>
          <h2>Criar Novo Catálogo</h2>
          <form onSubmit={handleCreateCatalogo}>
            <input
              type="text"
              placeholder="Nome do catálogo"
              value={nomeCatalogo}
              onChange={(e) => setNomeCatalogo(e.target.value)}
              className={Styles.searchInput}
            />
            <button type="submit" className={Styles.buyButton}>Criar Catálogo</button>
          </form>
        </div>
      )}
      <div className={Styles.catalogosList}>
        <h2>Catálogos</h2>
        <div className={Styles.cardsContainer}>
          {filteredCatalogos.length > 0 ? (
            filteredCatalogos.map((catalogo) => (
              <div
                key={catalogo.id}
                className={Styles.card}
                onClick={() => handleSelectCatalogo(catalogo.id)}
              >
                <div className={Styles.cardContentWrapper}>
                  <p className={Styles.cardTitle}>{catalogo.nome}</p>
                </div>
              </div>
            ))
          ) : (
            <p className={Styles.emptyText}>Nenhum catálogo encontrado.</p>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className={Styles.modalOverlay} onClick={closeModal}>
          <div className={Styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Catálogo: {selectedCatalogo && catalogos.find(c => c.id === selectedCatalogo)?.nome}</h2>
            <button className={Styles.closeButton} onClick={closeModal}>X</button>
            {isAdmin && (
              <>
                <h3>Adicionar Joia</h3>
                <select
                  value={joiaToAdd}
                  onChange={(e) => setJoiaToAdd(e.target.value)}
                  className={Styles.searchInput}
                >
                  <option value="">Selecione uma joia</option>
                  {allJoias.map((joia) => (
                    <option key={joia.id} value={joia.id}>
                      {joia.nome} ({joia.referencia || 'N/A'})
                    </option>
                  ))}
                </select>
                <button onClick={handleAddJoia} className={Styles.buyButton}>Adicionar Joia</button>

                <h3>Vincular Revendedora</h3>
                <select
                  value={revendedoraToLink}
                  onChange={(e) => setRevendedoraToLink(e.target.value)}
                  className={Styles.searchInput}
                >
                  <option value="">Selecione uma revendedora</option>
                  {revendedoras.map((rev) => (
                    <option key={rev.id} value={rev.id}>
                      {rev.nome}
                    </option>
                  ))}
                </select>
                <button onClick={handleLinkRevendedora} className={Styles.buyButton}>Vincular Revendedora</button>
              </>
            )}
            <h3>Revendedoras Vinculadas</h3>
            {linkedRevendedoras.length > 0 ? (
              <ul className={Styles.revendedoraList}>
                {linkedRevendedoras.map((rev) => (
                  <li key={rev.id} className={Styles.revendedoraItem}>
                    {rev.nome}
                    {isAdmin && (
                      <button
                        className={Styles.unlinkButton}
                        onClick={() => handleUnlinkRevendedora(rev.id)}
                      >
                        Desvincular
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={Styles.emptyText}>Nenhuma revendedora vinculada.</p>
            )}
            <h3>Joias no Catálogo</h3>
            {joias.length > 0 ? (
              <>
                <div className={Styles.joiasList}>
                  {currentJoias.map((joia) => (
                    <div key={joia.id} className={Styles.card}>
                      <div className={Styles.cardContentWrapper}>
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
                            <p className={Styles.cardQuantity}>Referência: {joia.referencia || 'N/A'}</p>
                          </div>
                        </div>
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
            ) : (
              <p className={Styles.emptyText}>Nenhuma joia encontrada neste catálogo.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CatalogoScreen;