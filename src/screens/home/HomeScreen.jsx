import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../superbase/supabaseConfig';
import diamond from '../../assets/home/diamond.png';
import files from '../../assets/home/files.png';
import catalogue from '../../assets/home/catalogue.png';
import relatorio from '../../assets/home/relatorio.png';
import woman from '../../assets/home/women.png'

import Styles from './HomeScreen.module.css';

const HomeScreen = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userMetadata = session.user.user_metadata;
        const displayName = userMetadata.display_name || 'Guest';
        setUserData({
          display_name: displayName.split(' ')[0],
          isRevendedora: userMetadata.isRevendedora || false,
        });
      } else {
        setUserData(null);
      }
    };

    getUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userMetadata = session.user.user_metadata;
        const displayName = userMetadata.display_name || 'Guest';
        setUserData({
          display_name: displayName.split(' ')[0],
          isRevendedora: userMetadata.isRevendedora || false,
        });
      } else {
        setUserData(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const cards = [
    { id: '1', title: 'Cadastrar Joias', screen: '/cadastro-joias', image: diamond },
    { id: '2', title: 'Lista Joias', screen: '/lista-joias', image: files },
    { id: '3', title: 'Catálogos', screen: '/catalogos', image: catalogue },
    { id: '4', title: 'Relatórios', screen: '/relatorios', image: relatorio },
    { id: '5', title: 'Revendedoras', screen: '/perfils', image: woman },
  ];

  const renderCard = (item) => (
    <a key={item.id} className={Styles.card} onClick={() => navigate(item.screen)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && navigate(item.screen)}>
      {item.image && <img src={item.image} alt={item.title} className={Styles.cardImage} />}
      <p className={Styles.cardTitle}>{item.title}</p>
    </a>
  );

  return (
    <div className={Styles.home}>
      <div className={Styles.homeContainer}>
        <h2 className={Styles.nome}>
          {userData ? `Olá ${userData.display_name}!` : 'Olá Lojista!'}
        </h2>
        <div className={Styles.cardList}>
          {cards.map((item) => renderCard(item))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;