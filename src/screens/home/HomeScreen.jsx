import { useNavigate } from 'react-router-dom';
import diamond from '../../assets/home/diamond.png';
import files from '../../assets/home/files.png';
import catalogue from '../../assets/home/catalogue.png';
import relatorio from '../../assets/home/relatorio.png';
import women from '../../assets/home/women.png';

import Styles from './HomeScreen.module.css';

const HomeScreen = () => {
  const navigate = useNavigate();

  const cards = [
    { id: '1', title: 'Cadastrar Joias', screen: '/cadastro-joias', image: diamond },
    { id: '2', title: 'Lista Joias', screen: '/lista-joias', image: files },
    { id: '3', title: 'Catálogos', screen: '/catalogos', image: catalogue },
    { id: '4', title: 'Relatórios', screen: '/relatorios', image: relatorio },
    { id: '5', title: 'Relatórios de Revendedoras', screen: '/relatorios-revendedoras', image: women },
  ];

  const renderCard = (item) => (
    <a key={item.id} className={Styles.card} onClick={() => navigate(item.screen)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && navigate(item.screen)}>
      {item.image && <img src={item.image} alt={item.title} className={Styles.cardImage} />}
      <p className={Styles.cardTitle}>{item.title}</p>
    </a>
  );

  return (
    <div className={Styles.homeContainer}>
      <div className={Styles.cardList}>
        {cards.map((item) => renderCard(item))}
      </div>
    </div>
  );
};

export default HomeScreen;