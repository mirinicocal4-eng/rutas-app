import { useState, useMemo, useEffect } from 'react';

const CompaniesView = ({ dataByCompany, isSearching }) => {
  const [selectedLetter, setSelectedLetter] = useState(null);

  const companies = Object.keys(dataByCompany).sort();

  const groupedCompanies = useMemo(() => {
    const grouped = {};
    companies.forEach(comp => {
      let firstLetter = comp.charAt(0).toUpperCase();
      firstLetter = firstLetter.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!/[A-Z]/.test(firstLetter)) firstLetter = '#';

      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(comp);
    });
    return grouped;
  }, [companies]);

  const availableLetters = Object.keys(groupedCompanies).sort();

  // Auto-select letter if searching and only one is available
  useEffect(() => {
    if (isSearching && availableLetters.length === 1 && selectedLetter !== availableLetters[0]) {
      setSelectedLetter(availableLetters[0]);
    }
  }, [isSearching, availableLetters, selectedLetter]);

  // Reset selected letter if it's no longer available
  useEffect(() => {
    if (selectedLetter && !groupedCompanies[selectedLetter]) {
      setSelectedLetter(null);
    }
  }, [groupedCompanies, selectedLetter]);

  if (companies.length === 0) return null;

  return (
    <div className="companies-view-container">
      <div className="alphabet-grid" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
        {availableLetters.map(letter => (
          <button 
            key={letter}
            className={`alphabet-btn ${selectedLetter === letter ? 'active' : ''}`}
            onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      {selectedLetter && (
        <div className="companies-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {groupedCompanies[selectedLetter].map(comp => (
            <div key={comp} className="company-card">
              <div className="company-header" style={{ cursor: 'default' }}>
                <h3>{comp}</h3>
                <span className="province-badge">{dataByCompany[comp].length} rutas</span>
              </div>
              <div className="routes-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dataByCompany[comp].map((route, idx) => (
                  <div key={idx} className="route-item">
                    <div className="route-info">
                      <span className="route-name">{route.nombre}</span>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                        Origen: {route.localidad} ({route.provincia})
                      </div>
                    </div>
                    <span className={`route-type type-${route.tipo.toLowerCase().replace(/\s/g, '')}`}>
                      {route.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompaniesView;
