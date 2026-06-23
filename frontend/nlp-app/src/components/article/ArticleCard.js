import { useState, useEffect, useContext } from 'react'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppContext } from '../../AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LabelList } from 'recharts';
import './ArticleCard.css';

const CustomAxisTick = ({ x, y, payload, fill }) => {
  const words = payload.value.split(', ');
  return (
    <g transform={`translate(${x},${y+10})`}>
      <text x={0} y={0} textAnchor="middle" fill={fill} fontSize={10} fontWeight={500}>
        {words.map((word, index) => (
          <tspan x="0" dy={index === 0 ? 0 : 14} key={index}>{word}</tspan>
        ))}
      </text>
    </g>
  );
};

const ArticleCard = ({ article, isOpen, onToggle, id, order, isOrphan, animationDelay }) => {
  const { isDarkMode } = useContext(AppContext);
  
  const [isReadyToOpen, setIsReadyToOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false); 
  const chartTextColor = isDarkMode ? "#bbbbbb" : "#232020";

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setIsReadyToOpen(true);
        window.scrollTo({
          top: 100,
          behavior: "smooth"
        });
      }, 50); 
    } else {
      setIsReadyToOpen(false);
    }
  }, [isOpen]);

  const getBarColor = (index, total) => {
    const third = total / 3; 
    if (index < third) return "#2ecc71"; 
    if (index >= total - third) return "#e74c3c"; 
    return "#3498db";
  };

  const handleExportPDF = async (e) => {
    e.stopPropagation(); 
    setIsExporting(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20; 
      const maxTextWidth = pageWidth - margin * 2;
      let yOffset = 20; 

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40); 
      const titleLines = pdf.splitTextToSize(article.title, maxTextWidth);
      pdf.text(titleLines, margin, yOffset);
      yOffset += (titleLines.length * 7) + 5; 

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(100, 100, 100); 
      
      pdf.text(`Date: ${article.published}`, margin, yOffset);
      yOffset += 6;

      pdf.text(`Source: ${article.pdf_url}`, margin, yOffset, { url: article.pdf_url, target: '_blank' });
      yOffset += 6;

      pdf.text(`SubTopic: ${article.top_cluster}`, margin, yOffset);
      yOffset += 12; 

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(52, 152, 219); 
      pdf.text("Abstract", pageWidth / 2, yOffset, { align: "center" });
      yOffset += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      const summaryLines = pdf.splitTextToSize(article.summary, maxTextWidth);
      pdf.text(summaryLines, margin, yOffset);
      
      yOffset += (summaryLines.length * 5) + 8; 

      const chartElement = document.getElementById(`chart-${id}`);
      
      if (chartElement) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text("Semantic Analysis", pageWidth / 2, yOffset, { align: "center" });
        yOffset += 8;

        const canvas = await html2canvas(chartElement, {
          scale: 2, 
          backgroundColor: '#ffffff', 
          onclone: (clonedDoc) => {
            const clonedChart = clonedDoc.getElementById(`chart-${id}`);
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
        const imgWidth = maxTextWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yOffset + imgHeight > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yOffset = margin; 
        }

        pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
      }
      
      const year = article.published ? article.published.split('-')[0] : 'Year';
      
      const cleanTitleWords = article.title
        .replace(/[-:—–]/g, " ")        
        .replace(/[^a-zA-Z0-9\s]/g, "") 
        .split(/\s+/)                   
        .filter(word => word.length > 1)  
        .slice(0, 3)                    
        .join('_');                     

      const fileName = `Analysis_${year}_${cleanTitleWords}.pdf`;
      
      pdf.save(fileName);

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div 
      id={id}
      style={{ order: order, animationDelay: animationDelay }}
      className={`article-card animated-in ${isOpen ? 'expanded' : 'collapsed'} ${isReadyToOpen ? 'show-content' : ''} ${isOrphan ? 'orphan' : ''}`}
    >
      <div className="card-header" onClick={onToggle}>
        <div className="header-main">
          <h2 className="article-title">{article.title}</h2>
          <div className="article-meta">
            <span>📅 {article.published}</span>
            <span>🔗 Source: arXiv.org</span>
            <span>🏷️ SubTopic: {article.top_cluster}</span>
          </div>
        </div>
        <div className={`expand-icon ${isOpen ? 'rotate' : ''}`}>▼</div>
      </div>

      {isReadyToOpen && (
        <div className="card-content animated-fade-in">
          <hr className="divider" />
          
          <div className="content-body">
            
            <div className="summary-section">
              <h3>Abstract</h3>
              <div className="article-summary">
                {article.summary}
              </div>
              
              <div className="action-buttons">
                <a href={article.pdf_url} target="_blank" rel="noopener noreferrer" className="pdf-link">
                  📄 Open Original PDF
                </a>
                
                <button 
                  onClick={handleExportPDF} 
                  disabled={isExporting}
                  className="export-pdf-btn"
                >
                  {isExporting ? '⏳ Generating...' : '📥 Save Analysis'}
                </button>
              </div>
            </div>

            <div className="chart-section">
              <h4 className="chart-title">📊 Semantic Analysis</h4>
              
              <div className="chart-container" id={`chart-${id}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={article.keywords} margin={{ top: 25, right: 25, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTextColor} opacity={0.2} />
                    <XAxis 
                      dataKey="word" 
                      interval={0} 
                      tick={<CustomAxisTick fill={chartTextColor} />} 
                      tickLine={false}
                      height={35} 
                    />

                    <YAxis 
                      allowDecimals={false}
                      tickLine={false} 
                      tick={{fontSize: 10, fill: chartTextColor}} 
                      axisLine={false} 
                      domain={[0, dataMax => {
                        let step = 1;
                        if (dataMax >= 50) step = 10;
                        else if (dataMax >= 20) step = 5;
                        else if (dataMax >= 10) step = 2;
                        else step = 2;
                        const targetMax = dataMax + 1;
                        return Math.ceil(targetMax / step) * step;
                      }]}
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

                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                      {article.keywords.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(index, article.keywords.length)} />
                      ))}
                      <LabelList 
                        dataKey="count" 
                        position="top" 
                        fill="rgba(0,0,0,0)" 
                        fontSize={12} 
                        fontWeight="bold" 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleCard;