import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig';
import Styles from './DetalheJoiaScreen.module.css';

const DetalheJoiaScreen = () => {
  const location = useLocation();
  const { id } = location.state || {};
  const [joia, setJoia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [formError, setFormError] = useState(null);
  const [newFoto, setNewFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJoia = async () => {
      if (!id) {
        setError('ID da joia não fornecido.');
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('joias').select('*').eq('id', id).single();
      if (error) setError(error.message);
      else {
        setJoia(data);
        setEditValues({
          nome: data.nome || '',
          referencia: data.referencia || '',
          valorAtacado: data.valorAtacado ? formatCurrency(data.valorAtacado) : '',
          valorRevenda: data.valorRevenda ? formatCurrency(data.valorRevenda) : '',
          valorBruto: data.valorBruto ? formatCurrency(data.valorBruto) : '',
          valorBanho: data.valorBanho ? formatCurrency(data.valorBanho) : '',
          quantidade: data.quantidade ? data.quantidade.toString() : '0',
        });
        setFotoPreview(data.foto || null);
      }
      setLoading(false);
    };
    fetchJoia();
  }, [id]);

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.,]/g, '').replace(',', '.')) : value;
    return numericValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const parseCurrency = (value) => {
    const numericValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  };

  const handleInputChange = (field, value) => {
    if (['valorAtacado', 'valorRevenda', 'valorBruto', 'valorBanho'].includes(field)) {
      const numericValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
      setEditValues((prev) => ({ ...prev, [field]: formatCurrency(numericValue) }));
    } else if (field === 'quantidade') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setEditValues((prev) => ({ ...prev, [field]: numericValue }));
    } else {
      setEditValues((prev) => ({ ...prev, [field]: value }));
    }
    setFormError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
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

  const uploadImage = async (file) => {
    if (!file) return joia.foto;

    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Você precisa estar logado para fazer upload de imagens.');

      const { data, error } = await supabase.storage
        .from('joias')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
          metadata: { user_id: session.user.id },
        });

      if (error) throw new Error(error.message || 'Falha ao fazer upload da imagem.');

      const { data: urlData } = supabase.storage.from('joias').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (error) {
      setError(`Erro ao fazer upload da imagem: ${error.message}`);
      return null;
    }
  };

  const handleSalvar = async () => {
    setFormError(null);
    const { nome, referencia, valorAtacado, valorRevenda, valorBruto, valorBanho, quantidade } = editValues;
    if (!nome.trim() || !referencia.trim() || !valorRevenda || !quantidade) {
      setFormError('Os campos Nome, Referência, Valor Revenda e Quantidade são obrigatórios.');
      return;
    }
    const revendaValue = parseCurrency(valorRevenda);
    const atacadoValue = valorAtacado ? parseCurrency(valorAtacado) : null;
    const brutoValue = valorBruto ? parseCurrency(valorBruto) : null;
    const banhoValue = valorBanho ? parseCurrency(valorBanho) : null;
    const quantidadeValue = parseInt(quantidade, 10);
    if (revendaValue <= 0 || quantidadeValue <= 0) {
      setFormError('Valor de revenda e quantidade devem ser maiores que zero.');
      return;
    }

    let newFotoUrl = joia.foto;
    if (newFoto) {
      newFotoUrl = await uploadImage(newFoto);
      if (!newFotoUrl) return; // Aborta se o upload falhar
    }

    const { error } = await supabase.from('joias').update({
      nome: nome.trim(),
      referencia: referencia.trim(),
      valorAtacado: atacadoValue,
      valorRevenda: revendaValue,
      valorBruto: brutoValue,
      valorBanho: banhoValue,
      quantidade: quantidadeValue,
      foto: newFotoUrl,
    }).eq('id', id);
    if (error) setError(`Erro: ${error.message}`);
    else {
      setJoia((prev) => ({ ...prev, ...editValues, foto: newFotoUrl }));
      alert('Sucesso: Joia atualizada com sucesso!');
      navigate('/lista-joias');
    }
  };

  if (loading) {
    return (
      <div className={Styles.container}>
        <div className={Styles.spinner}></div>
      </div>
    );
  }

  if (error || !joia) {
    return (
      <div className={Styles.container}>
        <p className={Styles.error}>{error || 'Nenhuma joia encontrada.'}</p>
        <button className={Styles.backButton} onClick={() => navigate('/lista-joias')}>Voltar</button>
      </div>
    );
  }

  return (
    <div className={Styles.container}>
      <div className={Styles.scrollContainer}>
        <h1 className={Styles.title}>{joia.nome}</h1>
        <div className={Styles.contentLucro}>
          <p className={Styles.cardProfit}>Lucro: R${calculateProfit(joia).toFixed(2)}</p>
          <p className={Styles.cardProfitPercentage}>Porcentagem %: {calculateProfitPercentage(joia)}%</p>
        </div>
        {fotoPreview && <img src={fotoPreview} alt={joia.nome} className={Styles.image} />}
        <label className={Styles.label}>Nova Foto:</label>
        <input
          type="file"
          accept="image/*"
          className={Styles.input}
          onChange={handleImageChange}
        />
        {formError && <p className={Styles.formError}>{formError}</p>}
        <div className={Styles.rowContainer}>
          <div className={Styles.column}>
            <p className={Styles.label}>Nome:</p>
            <input
              className={Styles.input}
              type="text"
              value={editValues.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
            />
          </div>
          <div className={Styles.column}>
            <p className={Styles.label}>Referência:</p>
            <input
              className={Styles.input}
              type="text"
              value={editValues.referencia}
              onChange={(e) => handleInputChange('referencia', e.target.value)}
            />
          </div>
        </div>
        <div className={Styles.rowContainer}>
          <div className={Styles.column}>
            <p className={Styles.label}>Valor Atacado (R$):</p>
            <input
              className={Styles.input}
              type="text"
              placeholder="R$ 0,00"
              value={editValues.valorAtacado}
              onChange={(e) => handleInputChange('valorAtacado', e.target.value)}
            />
          </div>
          <div className={Styles.column}>
            <p className={Styles.label}>Valor Revenda (R$):</p>
            <input
              className={Styles.input}
              type="text"
              placeholder="R$ 0,00"
              value={editValues.valorRevenda}
              onChange={(e) => handleInputChange('valorRevenda', e.target.value)}
            />
          </div>
        </div>
        <div className={Styles.rowContainer}>
          <div className={Styles.column}>
            <p className={Styles.label}>Valor Bruto (R$):</p>
            <input
              className={Styles.input}
              type="text"
              placeholder="R$ 0,00"
              value={editValues.valorBruto}
              onChange={(e) => handleInputChange('valorBruto', e.target.value)}
            />
          </div>
          <div className={Styles.column}>
            <p className={Styles.label}>Valor Banho (R$):</p>
            <input
              className={Styles.input}
              type="text"
              placeholder="R$ 0,00"
              value={editValues.valorBanho}
              onChange={(e) => handleInputChange('valorBanho', e.target.value)}
            />
          </div>
        </div>
        <div className={Styles.rowContainer}>
          <div className={Styles.column}>
            <p className={Styles.label}>Quantidade:</p>
            <input
              className={Styles.input}
              type="text"
              placeholder="0"
              value={editValues.quantidade}
              onChange={(e) => handleInputChange('quantidade', e.target.value)}
            />
          </div>
        </div>
        <div className={Styles.buttonContainer}>
          <button className={Styles.saveButton} onClick={handleSalvar}>Salvar</button>
          <button className={Styles.backButton} onClick={() => navigate('/lista-joias')}>Voltar</button>
        </div>
      </div>
    </div>
  );
};

export default DetalheJoiaScreen;