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
          valorAtacado: data.valorAtacado ? data.valorAtacado.toString() : '',
          valorRevenda: data.valorRevenda ? data.valorRevenda.toString() : '',
          valorBruto: data.valorBruto ? data.valorBruto.toString() : '',
          valorBanho: data.valorBanho ? data.valorBanho.toString() : '',
          quantidade: data.quantidade ? data.quantidade.toString() : '0',
        });
      }
      setLoading(false);
    };
    fetchJoia();
  }, [id]);

  const handleInputChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleSalvar = async () => {
    setFormError(null);
    const { nome, referencia, valorAtacado, valorRevenda, valorBruto, valorBanho, quantidade } = editValues;
    if (!nome.trim() || !referencia.trim() || !valorRevenda || !quantidade) {
      setFormError('Os campos Nome, Referência, Valor Revenda e Quantidade são obrigatórios.');
      return;
    }
    const revendaValue = parseFloat(valorRevenda);
    const atacadoValue = valorAtacado ? parseFloat(valorAtacado) : null;
    const brutoValue = valorBruto ? parseFloat(valorBruto) : null;
    const banhoValue = valorBanho ? parseFloat(valorBanho) : null;
    const quantidadeValue = parseInt(quantidade, 10);
    if (revendaValue <= 0 || quantidadeValue <= 0) {
      setFormError('Valor de revenda e quantidade devem ser maiores que zero.');
      return;
    }

    const { error } = await supabase.from('joias').update({
      nome: nome.trim(),
      referencia: referencia.trim(),
      valorAtacado: atacadoValue,
      valorRevenda: revendaValue,
      valorBruto: brutoValue,
      valorBanho: banhoValue,
      quantidade: quantidadeValue,
    }).eq('id', id);
    if (error) setError(`Erro: ${error.message}`);
    else {
      setJoia((prev) => ({ ...prev, ...editValues }));
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
        <div className={Styles.contentContainer}>
          <h1 className={Styles.title}>{joia.nome}</h1>
          {joia.foto && <img src={joia.foto} alt={joia.nome} className={Styles.image} />}
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
                type="number"
                step="0.01"
                value={editValues.valorAtacado}
                onChange={(e) => handleInputChange('valorAtacado', e.target.value)}
              />
            </div>
            <div className={Styles.column}>
              <p className={Styles.label}>Valor Revenda (R$):</p>
              <input
                className={Styles.input}
                type="number"
                step="0.01"
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
                type="number"
                step="0.01"
                value={editValues.valorBruto}
                onChange={(e) => handleInputChange('valorBruto', e.target.value)}
              />
            </div>
            <div className={Styles.column}>
              <p className={Styles.label}>Valor Banho (R$):</p>
              <input
                className={Styles.input}
                type="number"
                step="0.01"
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
                type="number"
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
    </div>
  );
};

export default DetalheJoiaScreen;