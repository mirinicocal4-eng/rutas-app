import { useState, useRef, useEffect } from 'react';

const CustomCompanySelect = ({ groupedOperators, selectedOperator, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLetter, setActiveLetter] = useState(null);
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="custom-select-container" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="filter-select custom-select-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '2.5rem' }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {selectedOperator === 'all' ? 'Todas las empresas' : selectedOperator}
        </span>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '0.5rem',
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 50,
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '0.5rem'
        }}>
          <div 
            className={`custom-select-option ${selectedOperator === 'all' ? 'selected' : ''}`} 
            onClick={() => handleSelect('all')}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              background: selectedOperator === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: selectedOperator === 'all' ? '#818cf8' : '#e2e8f0',
              marginBottom: '0.5rem',
              fontWeight: selectedOperator === 'all' ? '600' : '400'
            }}
          >
            Todas las empresas
          </div>
          
          <div className="custom-select-letters" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {groupedOperators.map(group => (
              <div key={group.letter} className="letter-group" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                <button 
                  className={`letter-accordion-btn ${activeLetter === group.letter ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLetter(activeLetter === group.letter ? null : group.letter);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: activeLetter === group.letter ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: 'none',
                    color: '#f8fafc',
                    textAlign: 'left',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  Letra {group.letter}
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {activeLetter === group.letter ? '▲' : '▼'}
                  </span>
                </button>
                
                {activeLetter === group.letter && (
                  <div className="letter-companies" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {group.operators.map(op => (
                      <div 
                        key={op} 
                        onClick={() => handleSelect(op)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: selectedOperator === op ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          color: selectedOperator === op ? '#818cf8' : '#cbd5e1',
                          fontSize: '0.9rem',
                          transition: 'background 0.2s',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedOperator !== op) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedOperator !== op) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {op}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomCompanySelect;
