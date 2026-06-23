import { useState, useContext } from 'react';
import { AppContext } from '../../AppContext';
import './SearchBar.css';

const SearchBar = () => {
  const {
    query, setQuery,
    year, setYear,
    limit, setLimit,
    loading,
    viewMode, setViewMode,
    articles,
    searchArticles
  } = useContext(AppContext);

  const [isLimitOpen, setIsLimitOpen] = useState(false);

  const currentYear = new Date().getFullYear(); 
  const minYear = currentYear - 5;

  const incrementYear = () => {
    if (year === 'all') return; 
    if (year === currentYear) {
      setYear('all'); 
    } else {
      setYear(Number(year) + 1);
    }
  };

  const decrementYear = () => {
    if (year === 'all') {
      setYear(currentYear); 
      return;
    }
    if (year <= minYear) {
      return; 
    }
    setYear(Number(year) - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLimitOpen(false);
    searchArticles();
  };

  const hasResults = articles.length > 0;
  const onToggleView = () => setViewMode(viewMode === 'list' ? 'global' : 'list');

  return (
    <div className="search-section">
      <form className="search-form" onSubmit={handleSubmit}>
        
        <input
          className="search-input"
          type="text"
          placeholder="Enter research topic in English..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="year-stepper">
          <div className="stepper-field">
            <input
              className="stepper-input"
              type="text"
              readOnly
              value={year === 'all' ? `${minYear} - ${currentYear}` : year}
            />
            <div className="stepper-arrows">
              <button type="button" className="step-btn up" onClick={incrementYear}>▲</button>
              <button type="button" className="step-btn down" onClick={decrementYear}>▼</button>
            </div>
          </div>
        </div>

        <div className="custom-dropdown">
          <div 
            className="dropdown-trigger" 
            onClick={() => { setIsLimitOpen(!isLimitOpen) }}
          >
            {limit} abstracts
            <span className={`arrow ${isLimitOpen ? 'open' : ''}`}>▼</span>
          </div>
          {isLimitOpen && (
            <div className="dropdown-menu">
              {[10, 20, 30, 40, 50].map((val) => (
                <div 
                  key={val} 
                  className="dropdown-item" 
                  onClick={() => { setLimit(val); setIsLimitOpen(false); }}
                >
                  {val} abstracts
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="search-buttons-group">
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>

          {hasResults && (
            <button 
              type="button" 
              className={`toggle-view-btn ${viewMode === 'global' ? 'active-global' : ''}`}
              onClick={onToggleView}
            >
              {viewMode === 'list' ? '📊 Global Analysis' : '📋 Individual Analysis'}
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default SearchBar;