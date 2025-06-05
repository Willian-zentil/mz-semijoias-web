import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../superbase/supabaseConfig';
import Styles from './Navbar.module.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className={Styles.navbar}>
      <div className={Styles.navbarContainer}>
        <div className={Styles.navbarBrand}>
          <h1 onClick={() => handleNavigate('/')}>MZ SEMI JOIAS</h1>
        </div>
        <div className={Styles.hamburger} onClick={toggleMenu}>
          <span className={`${Styles.bar} ${isMenuOpen ? Styles.open : ''}`}></span>
          <span className={`${Styles.bar} ${isMenuOpen ? Styles.open : ''}`}></span>
          <span className={`${Styles.bar} ${isMenuOpen ? Styles.open : ''}`}></span>
        </div>
        <ul className={`${Styles.navbarMenu} ${isMenuOpen ? Styles.active : ''}`}>
          <li className={Styles.navbarItem}>
            <button onClick={() => handleNavigate('/')}>Home</button>
          </li>
          <li className={Styles.navbarItem}>
            <button onClick={() => handleNavigate('/cadastro-joias')}>Cadastrar Joias</button>
          </li>
          <li className={Styles.navbarItem}>
            <button onClick={() => handleNavigate('/lista-joias')}>Lista de Joias</button>
          </li>
          <li className={Styles.navbarItem}>
            <button onClick={() => handleNavigate('/catalogos')}>Catálogos</button>
          </li>
          <li className={Styles.navbarItem}>
            <button onClick={() => handleNavigate('/relatorios')}>Relatórios</button>
          </li>
          <li className={Styles.navbarItem}>
            <button onClick={() => handleNavigate('/relatorios-revendedoras')}>Relatórios de Revendedoras</button>
          </li>
          <li className={Styles.navbarItem}>
            <button onClick={handleLogout}>Sair</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;