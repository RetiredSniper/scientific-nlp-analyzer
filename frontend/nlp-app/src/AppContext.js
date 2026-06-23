import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [year, setYear] = useState('2021'); 
  const [articles, setArticles] = useState([]);
  const [globalStats, setGlobalStats] = useState(null); 
  const [viewMode, setViewMode] = useState('list'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedIds, setExpandedIds] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    document.body.className = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCard = (index) => {
    if (expandedIds.includes(index)) {
      setExpandedIds(expandedIds.filter(id => id !== index));
    } else {
      setExpandedIds([index, ...expandedIds]);
    }
  };

  const searchArticles = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setExpandedIds([]); 
    setArticles([]);    
    setGlobalStats(null);
    setViewMode('list'); 
    setHasSearched(true);

    try {
      const url = `http://127.0.0.1:8000/search/${query}?${year !== 'all' ? `year=${year}&` : ''}limit=${limit}`;
      const response = await axios.get(url);
      
      setArticles(response.data.articles);
      setGlobalStats(response.data.global_stats);
      setActiveQuery(query);
      
    } catch (err) {
      if (err.response && err.response.status === 429) {
        setError("ArXiv API Rate Limit: Server is overloaded. Please try again in 2-3 minutes.");
      } else {
        setError("Failed to fetch data. Check if the backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      query, setQuery,
      activeQuery, setActiveQuery,
      year, setYear,
      articles, setArticles,
      globalStats, setGlobalStats,
      viewMode, setViewMode,
      loading, setLoading,
      error, setError,
      isDarkMode, setIsDarkMode,
      isScrolled, setIsScrolled,
      expandedIds, setExpandedIds,
      hasSearched, setHasSearched,
      limit, setLimit,
      toggleTheme,
      toggleCard,
      searchArticles
    }}>
      {children}
    </AppContext.Provider>
  );
};