import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // Simulate AI analysis
      const aiProbability = Math.random() * 100;
      let label = 'Likely Real';
      if (aiProbability > 70) label = 'Likely AI';
      else if (aiProbability > 40) label = 'Suspicious';
      
      const mockResult = {
        summary: {
          aiProbability: parseFloat(aiProbability.toFixed(1)),
          label,
          mode: 'demo',
          thumbnailUrl: null,
          caption: `Sample Instagram ${url.includes('/reel/') ? 'reel' : 'post'}`,
          authorUsername: 'sample_user',
          postType: url.includes('/reel/') ? 'reel' : 'post',
        },
        detailedFindings: {
          signals: [
            'Demo analysis completed',
            'Random probability generated',
            'Ready for real API integration'
          ],
          notes: ['This is a demo version - add your API keys for real analysis']
        }
      };
      
      setResult(mockResult);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>FurReal</h1>
        <p className="subtitle">AI Detection for Instagram</p>
        
        <div className="input-section">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter Instagram URL or @username"
            className="url-input"
          />
          <button 
            onClick={analyzeUrl} 
            disabled={loading || !url.trim()}
            className="analyze-btn"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {result && (
          <div className="result-card">
            <div className="result-header">
              <h3>{result.summary.label}</h3>
              <span className={`probability-badge ${
                result.summary.aiProbability >= 70 ? 'high' : 
                result.summary.aiProbability >= 40 ? 'medium' : 'low'
              }`}>
                AI: {result.summary.aiProbability}%
              </span>
            </div>
            
            <div className="result-details">
              <p><strong>Author:</strong> @{result.summary.authorUsername}</p>
              <p><strong>Type:</strong> {result.summary.postType}</p>
              <p><strong>Mode:</strong> {result.summary.mode}</p>
            </div>

            {result.detailedFindings.signals.length > 0 && (
              <div className="signals">
                <h4>Analysis Signals:</h4>
                <ul>
                  {result.detailedFindings.signals.map((signal: string, index: number) => (
                    <li key={index}>{signal}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;