import { useContext } from 'react';
import { AppContext } from './AppContext';
import './App.css';
import Navbar from './components/navbar/Navbar';
import SearchBar from './components/search/SearchBar';
import ArticleCard from './components/article/ArticleCard';
import GlobalDashboard from './components/global/GlobalDashboard';

function App() {
  const {
    articles,
    viewMode,
    loading,
    error,
    isDarkMode,
    isScrolled,
    expandedIds,
    hasSearched,
    activeQuery,
    globalStats,
    year,
    toggleCard
  } = useContext(AppContext);

  return (
    <div className="app-container">
      <header className={`sticky-header ${isScrolled ? 'scrolled' : ''} ${!hasSearched ? 'centered' : ''}`}>
        <Navbar />
        <SearchBar />
      </header>

      {error && <div className="error-message">{error}</div>}

      {!loading && articles.length > 0 && (
        <main className="content-area">
          {viewMode === 'list' ? (
            <> 
              <div className="results-summary animated-summary">
                Found {articles.length} abstracts by relevance
              </div>

              <div className="result-list animated-fade">
                {(() => {
                  const collapsedCount = articles.length - expandedIds.length;
                  const hasOrphan = collapsedCount % 2 !== 0;
                  
                  let lastCollapsedIndex = -1;
                  if (hasOrphan) {
                    for (let i = articles.length - 1; i >= 0; i--) {
                      if (!expandedIds.includes(i)) {
                        lastCollapsedIndex = i;
                        break;
                      }
                    }
                  }

                  return articles.map((article, index) => {
                    const openedIndex = expandedIds.indexOf(index);
                    const isOpen = openedIndex !== -1;
                    const isOrphan = index === lastCollapsedIndex;
                    
                    return (
                      <ArticleCard 
                        key={`${activeQuery}-${index}`}
                        id={`card-${index}`}
                        article={article} 
                        isDarkMode={isDarkMode}
                        isOpen={isOpen}
                        order={isOpen ? -100 + openedIndex : 0} 
                        isOrphan={isOrphan}
                        onToggle={() => toggleCard(index)}
                        animationDelay={`${0.2 + (index * 0.1)}s`}
                      />
                    );
                  });
                })()}
              </div>
            </>
          ) : (
            <GlobalDashboard 
              query={activeQuery}
              articleCount={articles.length} 
              globalStats={globalStats} 
              isDarkMode={isDarkMode} 
              dateRange={year === 'all' ? 'All time' : year}
            />
          )}
        </main>
      )}
    </div>
  );
}

export default App;