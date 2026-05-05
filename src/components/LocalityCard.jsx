import { useState } from 'react';

const LocalityCard = ({ localityName, routes }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getBadgeClass = (tipo) => {
    const t = tipo.toLowerCase();
    if (t.includes('regular')) return 'type-regular';
    if (t.includes('demanda')) return 'type-demanda';
    if (t.includes('conjunta')) return 'type-conjunta';
    return 'type-regular';
  };

  return (
    <div className="company-card">
      <div className="company-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>📍 {localityName}</h3>
        <span className={`icon-expand ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="routes-list">
          {routes.map((route, idx) => (
            <div key={idx} className="route-item" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                <span className="route-name">{route.nombre}</span>
                <span className={`route-type ${getBadgeClass(route.tipo)}`}>
                  {route.tipo}
                </span>
              </div>
              <div style={{fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span>🚌 Operador:</span>
                <span style={{color: '#cbd5e1'}}>{route.operador}</span>
              </div>
              
              {(route.tipo.toLowerCase().includes('demanda') || route.tipo.toLowerCase().includes('conjunta')) && (
                <div className="booking-info">
                  <div className="booking-phone">
                    <span>📞 Reserva:</span>
                    <a href="tel:900204020">900 20 40 20</a>
                  </div>
                  <a 
                    href="https://www.reservastransportedemandajcyl.es/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="booking-link"
                  >
                    Reserva Online ↗
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocalityCard;
