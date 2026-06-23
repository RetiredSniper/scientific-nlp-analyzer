import { useContext } from 'react';
import { AppContext } from '../../AppContext';
import './Navbar.css';

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useContext(AppContext);

  return (
    <nav className="navbar">
      <div className="navbar-center">
        <h1>Scientific NLP Analyzer</h1>
        <h4>Intelligent semantic analysis of scientific publication abstracts</h4>
      </div>
      <button className="theme-toggle" onClick={toggleTheme}>
        {isDarkMode ? "🌙 Dark" : "☀️ Light"}
      </button>
    </nav>
  );
};

export default Navbar;