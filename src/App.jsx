import React, { useState, useMemo } from 'react';
import './index.css';
import rutasData from './data/rutas.json';
import ProvinceCard from './components/ProvinceCard';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [exactMatch, setExactMatch] = useState(false);

  // Transform data: Group by Province -> Origin Locality
  // Also extract unique operators and types
  const { transformedData, operators, serviceTypes, provincesList } = useMemo(() => {
    const result = {};
    const operatorsSet = new Set();
    const typesSet = new Set();

    const normalizeProvince = (provName) => {
      let name = provName.toUpperCase().trim();
      if (name === 'AVILA') name = 'ÁVILA';
      if (name === 'LEON') name = 'LEÓN';
      if (name === 'LE/ZA/SA') name = 'LEÓN / ZAMORA / SALAMANCA';
      if (name === 'LE/ZA') name = 'LEÓN / ZAMORA';
      return name;
    };
    
    Object.keys(rutasData).forEach(rawProv => {
      const prov = normalizeProvince(rawProv);

      if (!result[prov]) {
        result[prov] = {};
      }

      Object.keys(rutasData[rawProv]).forEach(comp => {
        operatorsSet.add(comp);
        const routes = rutasData[rawProv][comp];
        routes.forEach(route => {
          // Normalizar tipo de servicio (Primera letra mayúscula, resto minúscula, sin espacios)
          const normalizedType = route.tipo.trim().charAt(0).toUpperCase() + route.tipo.trim().slice(1).toLowerCase();
          typesSet.add(normalizedType);
          
          // Extraer la localidad de inicio (lo que está antes del guión)
          let origin = route.nombre.split('-')[0].trim();
          if (!origin) origin = "Varias";
          
          if (!result[prov][origin]) {
            result[prov][origin] = [];
          }
          
          result[prov][origin].push({
            nombre: route.nombre,
            tipo: normalizedType, // Usar el tipo normalizado aquí también
            operador: comp
          });
        });
      });
    });

    // Ordenar localidades alfabéticamente en cada provincia
    Object.keys(result).forEach(prov => {
      const sortedLocalities = {};
      Object.keys(result[prov]).sort().forEach(loc => {
        sortedLocalities[loc] = result[prov][loc];
      });
      result[prov] = sortedLocalities;
    });

    return { 
      transformedData: result, 
      operators: Array.from(operatorsSet).sort(), 
      serviceTypes: Array.from(typesSet).sort(),
      provincesList: Object.keys(result).sort()
    };
  }, []);

  const filteredData = useMemo(() => {
    const normalizeText = (text) => {
      return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-_.,]/g, " ").toLowerCase();
    };

    const searchTerms = searchTerm.trim() ? normalizeText(searchTerm).split(/\s+/).filter(Boolean) : [];
    const result = {};

    Object.keys(transformedData).forEach(prov => {
      // Province filter
      if (selectedProvince !== 'all' && prov !== selectedProvince) {
        return;
      }

      const localities = transformedData[prov];
      const filteredLocalities = {};
      let hasMatchInProv = false;

      Object.keys(localities).forEach(loc => {
        const routes = localities[loc];
        const filteredRoutes = routes.filter(route => {
          // Check operator filter
          if (selectedOperator !== 'all' && route.operador !== selectedOperator) {
            return false;
          }

          // Check type filter
          if (selectedType !== 'all' && route.tipo !== selectedType) {
            return false;
          }

          // Check search term
          if (searchTerm.trim()) {
            if (exactMatch) {
              // Exact locality match (normalized)
              return normalizeText(loc) === normalizeText(searchTerm);
            } else {
              // Flexible context search
              const context = normalizeText(`${route.nombre} ${route.operador} ${route.tipo} ${loc} ${prov}`);
              return searchTerms.every(term => context.includes(term));
            }
          }

          return true;
        });

        if (filteredRoutes.length > 0) {
          filteredLocalities[loc] = filteredRoutes;
          hasMatchInProv = true;
        }
      });

      if (hasMatchInProv) {
        result[prov] = filteredLocalities;
      }
    });

    return result;
  }, [searchTerm, selectedOperator, selectedType, selectedProvince, exactMatch, transformedData]);

  const provinces = Object.keys(filteredData).sort();

  return (
    <div className="app-container">
      <header>
        <h1>Rutas Bonificadas</h1>
        <p>Explora las rutas de transporte por provincia y localidad de inicio</p>
        
        <div className="search-container">
          <input 
            type="text"
            className="search-input"
            placeholder="🔍 Buscar por ruta, localidad, empresa o tipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-container">
          <div className="filter-group">
            <label className="filter-label">Provincia</label>
            <select 
              className="filter-select"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
            >
              <option value="all">Todas las provincias</option>
              {provincesList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Empresa</label>
            <select 
              className="filter-select"
              value={selectedOperator}
              onChange={(e) => setSelectedOperator(e.target.value)}
            >
              <option value="all">Todas</option>
              {operators.map(op => (
                <option key={op} value={op}>{op}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Tipo</label>
            <select 
              className="filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group toggle-group">
            <label className="filter-label">Búsqueda Exacta</label>
            <div className="toggle-wrapper" onClick={() => setExactMatch(!exactMatch)}>
              <div className={`toggle-slider ${exactMatch ? 'active' : ''}`}></div>
              <span className="toggle-text">{exactMatch ? 'Localidad' : 'Global'}</span>
            </div>
          </div>
        </div>
      </header>

      {provinces.length === 0 ? (
        <div className="no-results">
          <h2>No se encontraron resultados para "{searchTerm}"</h2>
          <p>Prueba buscando con otra localidad o pueblo.</p>
        </div>
      ) : (
        <main className="provinces-grid">
          {provinces.map((prov) => (
            <ProvinceCard 
              key={prov} 
              province={prov} 
              localitiesData={filteredData[prov]} 
            />
          ))}
        </main>
      )}
    </div>
  );
}

export default App;
