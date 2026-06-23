import React, { useEffect, useState, useContext } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppContext } from '../../AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import './GlobalDashboard.css';

const CustomAxisTick = ({ x, y, payload, fill }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={5} 
        textAnchor="end" 
        fill={fill} 
        fontSize={12} 
        fontWeight={500} 
        transform="rotate(-90)"
        className="stagger-chart-tick" 
      >
        {payload.value}
      </text>
    </g>
  );
};

const GlobalDashboard = () => {
  const { 
    activeQuery: query, 
    articles, 
    globalStats, 
    isDarkMode, 
    year 
  } = useContext(AppContext);

  const articleCount = articles.length;
  const dateRange = year === 'all' ? 'All time' : year;
  const chartTextColor = isDarkMode ? "#bbbbbb" : "#555555";
  
  const [isExporting, setIsExporting] = useState(false); 
  const [isButtonReady, setIsButtonReady] = useState(false);

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      window.scrollBy({ top: 350, behavior: 'smooth' });
    }, 500); 
    return () => clearTimeout(scrollTimer);
  }, [query]);

  useEffect(() => {
    if (!globalStats) return;
    setIsButtonReady(false);
    
    const btnTimer = setTimeout(() => {
      setIsButtonReady(true);
    }, 2400); 

    return () => clearTimeout(btnTimer);
  }, [globalStats]);

  const handleExportGlobalPDF = async () => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20; 
      let yOffset = 20; 

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40); 
      pdf.text("Global Semantic Analysis", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 15; 

      pdf.setFontSize(12);
      const leftColX = margin;
      const rightColX = margin + 35; 

      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "bold");
      pdf.text("Topic:", leftColX, yOffset);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      pdf.text(String(query || "General"), rightColX, yOffset);
      yOffset += 8;

      let displayDate = String(dateRange || "All time");
      if (displayDate.toLowerCase() === "all time" || displayDate.toLowerCase() === "all") {
        const currentYear = new Date().getFullYear();
        const minYear = currentYear - 5;
        displayDate = `${minYear} - ${currentYear}`;
      }

      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "bold");
      pdf.text("Date Range:", leftColX, yOffset);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      pdf.text(displayDate, rightColX, yOffset);
      yOffset += 8;

      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "bold");
      pdf.text("Publications:", leftColX, yOffset);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      pdf.text(String(articleCount || 0), rightColX, yOffset);
      yOffset += 8;
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFont("helvetica", "bold");
      pdf.text("Sort:", leftColX, yOffset);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(40, 40, 40);
      pdf.text("By relevance", rightColX, yOffset);
      yOffset += 15;
      
      const chartElement = document.getElementById('global-chart');
      
      if (chartElement) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(52, 152, 219);
        pdf.text("Key Research Vectors", pageWidth / 2, yOffset, { align: "center" });
        yOffset += 10;

        const canvas = await html2canvas(chartElement, {
          scale: 2, 
          backgroundColor: '#ffffff', 
          onclone: (clonedDoc) => {
            const clonedChart = clonedDoc.getElementById('global-chart');
            if (clonedChart) {
              clonedChart.style.border = '1.5px solid #dcdcdc'; 
              clonedChart.style.borderRadius = '16px'; 
              clonedChart.style.padding = '15px 10px 5px 10px'; 
              clonedChart.style.boxSizing = 'border-box'; 
              clonedChart.style.backgroundColor = '#ffffff'; 

              const allTexts = clonedChart.querySelectorAll('text, tspan');
              allTexts.forEach(t => {
                t.setAttribute('fill', '#232020');
                t.style.setProperty('fill', '#232020', 'important');
                t.style.setProperty('opacity', '1', 'important');
                t.style.animation = 'none'; 
              });
              
              const lines = clonedChart.querySelectorAll('line');
              lines.forEach(l => {
                if (l.getAttribute('stroke') !== 'none') {
                  l.setAttribute('stroke', '#e0e0e0'); 
                }
              });
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - margin * 2; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 15; 
      }

      const sortedClusters = Object.entries(globalStats.clusters).sort((a, b) => b[1] - a[1]);

      if (sortedClusters.length > 20) {
        pdf.addPage();
        yOffset = margin;
      } else if (yOffset + 40 > pdf.internal.pageSize.getHeight() - margin) {
        pdf.addPage();
        yOffset = margin;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(52, 152, 219);
      pdf.text("Research Landscape", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 10;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(60, 60, 60);

      const col1X = margin + 10;               
      const col2X = (pageWidth / 2) + 10;       

      sortedClusters.forEach(([name, count], index) => {
        const isLeftColumn = index % 2 === 0;

        if (isLeftColumn && yOffset > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yOffset = margin;
        }

        const pubWord = count === 1 ? 'publication' : 'publications';
        const currentX = isLeftColumn ? col1X : col2X; 

        pdf.text(`• ${name}: ${count} ${pubWord}`, currentX, yOffset);

        if (!isLeftColumn) {
          yOffset += 7;
        }
      });

      if (sortedClusters.length % 2 !== 0) {
        yOffset += 7;
      }

      const safeQuery = String(query || "General").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
      pdf.save(`Global_Analysis_${safeQuery}.pdf`);

    } catch (error) {
      console.error("PDF generation error:", error);
      alert(`Failed to generate PDF. Reason: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!globalStats) return null;

  const getBarColor = (index, total) => {
    const third = total / 3; 
    if (index < third) return "#2ecc71"; 
    if (index >= total - third) return "#e74c3c"; 
    return "#3498db";
  };

  return (
    <div className="global-dashboard"> 
      
      <div className="dashboard-header">
        <h2 className="stagger-item" style={{ animationDelay: '0.1s' }}>
          Semantic Landscape &laquo;{query}&raquo;
        </h2>
        <h5 className="stagger-item" style={{ animationDelay: '0.5s' }}>
          Comprehensive analysis overview of {articleCount} relevant publications
        </h5>
      </div>

      <div className="stats-grid">
        
        <div className="dashboard-card chart-card stagger-item" style={{ animationDelay: '0.7s' }}>
          <div className="card-header-simple">
            <h3>📊 Key Research Vectors</h3>
            <span className="subtitle">Top keywords across all articles</span>
          </div>
          
          <div className="chart-wrapper" id="global-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalStats.total_keywords} margin={{ top: 20, right: 30, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTextColor} opacity={0.2} />
                <XAxis 
                  dataKey="word" 
                  tick={<CustomAxisTick fill={chartTextColor} />} 
                  interval={0} 
                  tickLine={false}
                />
                
                <YAxis 
                  domain={[0, dataMax => {
                    let step = 1;
                    if (dataMax >= 50) step = 10;
                    else if (dataMax >= 20) step = 5;
                    else if (dataMax >= 10) step = 2;
                    else step = 2;
                    const targetMax = dataMax + 1;
                    return Math.ceil(targetMax / step) * step;
                  }]}
                  allowDecimals={false} 
                  tick={{ fontSize: 12, fill: chartTextColor }} 
                  axisLine={false}
                />
                
                <Tooltip 
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff', 
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#444444' : '#bbbbbb'}`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ color: chartTextColor, fontWeight: '600', marginBottom: '5px' }}
                  itemStyle={{ color: '#3498db', fontWeight: 'bold' }}
                />
                
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {globalStats.total_keywords.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index, globalStats.total_keywords.length)} />
                  ))}
                  <LabelList 
                    dataKey="count" 
                    position="top" 
                    fill="rgba(0,0,0,0)" 
                    fontSize={14} 
                    fontWeight="bold" 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="right-column-wrapper stagger-item" style={{ animationDelay: '0.9s' }}>
          
          <div className="dashboard-card clusters-card">
            <div className="card-header-simple">
              <h3>🧬 Research Landscape</h3>
              <span className="subtitle">Distribution of identified semantic SubTopics</span>
            </div>
            
            <div className="clusters-tags">
              {Object.entries(globalStats.clusters)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count], index) => {
                  const delay = `${0.6 + (index * 0.1)}s`; 
                  
                  return (
                    <div key={name} className="cluster-tag stagger-item" style={{ animationDelay: delay }}>
                      <span className="tag-name">{name}</span>
                      <span className="tag-count">{count} {count === 1 ? 'publication' : 'publications'}</span>
                    </div>
                  );
              })}
            </div>
          </div>

          <button 
            onClick={handleExportGlobalPDF} 
            disabled={isExporting || !isButtonReady}
            className="export-global-btn"
          >
            {isExporting ? '⏳ Generating Report...' : 
             !isButtonReady ? '⏳ Visualizing Data...' : 
             '📥 Save Global Analysis'}
          </button>
          
        </div>

      </div>
    </div>
  );
};

export default GlobalDashboard;