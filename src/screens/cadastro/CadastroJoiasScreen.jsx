import { useState, useEffect } from 'react';
import { supabase } from '../../superbase/supabaseConfig';
import Styles from './CadastroJoiasScreen.module.css';

const CadastroJoiasScreen = () => {
  const [nome, setNome] = useState('');
  const [referencia, setReferencia] = useState('');
  const [valorAtacado, setValorAtacado] = useState('');
  const [valorRevenda, setValorRevenda] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [valorBruto, setValorBruto] = useState('');
  const [valorBanho, setValorBanho] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estado para o modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    // Teste inicial da conexão com Supabase
    supabase
      .from('joias')
      .select('*', { count: 'exact' })
      .limit(1)
      .then(({ error }) => {
        if (error) {
          console.error('Erro de conexão com Supabase:', error.message);
          showModal('Erro', 'Falha na conexão com o servidor. Verifique sua configuração.');
        } else {
          console.log('Conexão com Supabase bem-sucedida!');
        }
      });
  }, []);

  const formatCurrency = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue, 10) / 100;
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const parseCurrency = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  const formatQuantity = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  const showModal = (title, message) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    try {
      console.log('Iniciando upload da imagem:', file.name);
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      console.log('Nome do arquivo gerado:', fileName);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Nenhuma sessão ativa para upload da imagem.');
        throw new Error('Você precisa estar logado para fazer upload de imagens.');
      }
      console.log('Token JWT para upload:', session.access_token);

      const { data, error } = await supabase.storage
        .from('joias')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
          metadata: {
            user_id: session.user.id,
          },
        });

      if (error) {
        console.error('Erro no upload:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Falha ao fazer upload da imagem.');
      }

      console.log('Upload bem-sucedido:', data);
      const { data: urlData } = supabase.storage
        .from('joias')
        .getPublicUrl(fileName);

      console.log('URL pública da imagem:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showModal('Erro', 'Você precisa estar logado para cadastrar joias.');
      setIsLoading(false);
      return;
    }

    if (!nome.trim() || !referencia.trim() || !valorRevenda || !quantidade) {
      showModal('Erro', 'Por favor, preencha todos os campos obrigatórios: Nome, Referência, Valor Revenda e Quantidade.');
      setIsLoading(false);
      return;
    }

    const revendaValue = parseFloat(parseCurrency(valorRevenda)) / 100;
    const quantidadeValue = parseInt(quantidade, 10);
    if (revendaValue <= 0 || quantidadeValue <= 0) {
      showModal('Erro', 'Valor de revenda e quantidade devem ser maiores que zero.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Todos os campos obrigatórios estão preenchidos, processando dados...');

      let fotoURL = null;
      if (foto) {
        fotoURL = await uploadImage(foto);
      }

      const joiaData = {
        nome: nome.trim(),
        referencia: referencia.trim(),
        valorAtacado: valorAtacado ? parseFloat(parseCurrency(valorAtacado)) / 100 : null,
        valorRevenda: revendaValue,
        foto: fotoURL,
        valorBruto: valorBruto ? parseFloat(parseCurrency(valorBruto)) / 100 : null,
        valorBanho: valorBanho ? parseFloat(parseCurrency(valorBanho)) / 100 : null,
        quantidade: quantidadeValue,
        user_id: session.user.id,
      };

      console.log('Dados a serem enviados:', joiaData);
      const { error } = await supabase.from('joias').insert([joiaData]);
      console.log('Inserção concluída, verificando erro:', error);

      if (error) throw new Error(error.message);

      showModal('Sucesso', 'Joia cadastrada com sucesso!');
      console.log('Dados da joia salvos no Supabase:', joiaData);

      setNome('');
      setReferencia('');
      setValorAtacado('');
      setValorRevenda('');
      setFoto(null);
      setFotoPreview(null);
      setValorBruto('');
      setValorBanho('');
      setQuantidade('');
    } catch (error) {
      console.error('Erro no handleSubmit:', JSON.stringify(error, null, 2));
      showModal('Erro', error.message || 'Ocorreu um erro ao salvar os dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={Styles.cadastro}>
      <div className={Styles.container}>
        <h1 className={Styles.cadastroHeader}>Cadastro de Joias</h1>

        <label className={Styles.cadastroLabel}>Nome *</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Digite o nome da joia"
        />

        <label className={Styles.cadastroLabel}>Foto</label>
        <input
          type="file"
          accept="image/*"
          className={Styles.cadastroUploadButton}
          onChange={handleImageChange}
        />
        {fotoPreview && <img src={fotoPreview} alt="Prévia da imagem" className={Styles.cadastroImagePreview} />}

        <label className={Styles.cadastroLabel}>Referência *</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="Digite a referência"
        />

        <label className={Styles.cadastroLabel}>Valor Atacado</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={valorAtacado}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '');
            setValorAtacado(formatCurrency(numericValue));
          }}
          placeholder="Digite o valor atacado (opcional)"
        />

        <label className={Styles.cadastroLabel}>Valor Bruto</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={valorBruto}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '');
            setValorBruto(formatCurrency(numericValue));
          }}
          placeholder="Digite o valor bruto (opcional)"
        />

        <label className={Styles.cadastroLabel}>Valor Banho</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={valorBanho}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '');
            setValorBanho(formatCurrency(numericValue));
          }}
          placeholder="Digite o valor do banho (opcional)"
        />

        <label className={Styles.cadastroLabel}>Quantidade *</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={quantidade}
          onChange={(e) => setQuantidade(formatQuantity(e.target.value))}
          placeholder="Digite a quantidade"
        />

        <label className={Styles.cadastroLabel}>Valor Revenda *</label>
        <input
          className={Styles.cadastroInput}
          type="text"
          value={valorRevenda}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/[^0-9]/g, '');
            setValorRevenda(formatCurrency(numericValue));
          }}
          placeholder="Digite o valor de revenda"
        />

        <button
          className={Styles.cadastroSubmitButton}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Cadastrando...' : 'CADASTRAR'}
        </button>

        {modalVisible && (
          <div className={Styles.modalOverlay}>
            <div className={Styles.modalContainer}>
              <h2 className={Styles.modalTitle}>{modalTitle}</h2>
              <p className={Styles.modalMessage}>{modalMessage}</p>
              <button className={Styles.modalButton} onClick={hideModal}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CadastroJoiasScreen;