/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo } from 'react';
import LocalityCard from './LocalityCard';

const ProvinceCard = ({ province, localitiesData, isSearching }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  const localities = Object.keys(localitiesData).sort();

  // Calcular total de rutas
  const totalRoutes = localities.reduce((total, loc) => total + localitiesData[loc].length, 0);

  // Group localities by first letter
  const groupedLocalities = useMemo(() => {
    const grouped = {};
    localities.forEach(loc => {
      let firstLetter = loc.charAt(0).toUpperCase();
      // Normalize accents (Á -> A, etc.)
      firstLetter = firstLetter.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!/[A-Z]/.test(firstLetter)) firstLetter = '#';

      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(loc);
    });
    return grouped;
  }, [localities]);

  const availableLetters = Object.keys(groupedLocalities).sort();

  // Auto-expand and auto-select when searching
  useEffect(() => {
    if (isSearching) {
      setIsOpen(true);
      if (availableLetters.length === 1) {
        setSelectedLetter(availableLetters[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearching, availableLetters]);

  // When data changes (e.g. searching), if the selected letter has no data, unselect it
  useEffect(() => {
    if (selectedLetter && !groupedLocalities[selectedLetter]) {
      setSelectedLetter(null);
    }
  }, [groupedLocalities, selectedLetter]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (isOpen) setSelectedLetter(null);
  };

  return (
    <div className="province-card">
      <div className="province-header" onClick={toggleOpen} style={{ cursor: 'pointer' }}>
        <h2>{province}</h2>
        <span className="province-badge">{totalRoutes} rutas</span>
      </div>

      {isOpen && (
        <div className="province-content" onClick={(e) => e.stopPropagation()}>
          <div className="alphabet-grid">
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
            <div className="companies-list">
              {groupedLocalities[selectedLetter].map((loc) => (
                <LocalityCard 
                  key={loc} 
                  localityName={loc} 
                  routes={localitiesData[loc]} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProvinceCard;
