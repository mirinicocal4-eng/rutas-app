import { useState, useMemo } from 'react';
import './index.css';
import rutasData from './data/rutas.json';
import ProvinceCard from './components/ProvinceCard';
import CustomCompanySelect from './components/CustomCompanySelect';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [exactMatch, setExactMatch] = useState(false);

  // Transform data: Group by Province -> Origin Locality
  // Also extract unique operators and types
  const memoizedData = useMemo(() => {
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
    
    const normalizeTextForDedup = (name) => {
      return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-_.,\s–—]/g, '').toLowerCase().trim();
    };

    const allRoutes = [];

    Object.keys(rutasData).forEach(rawProv => {
      const prov = normalizeProvince(rawProv);

      Object.keys(rutasData[rawProv]).forEach(comp => {
        operatorsSet.add(comp);
        const routes = rutasData[rawProv][comp];
        routes.forEach(route => {
          // Normalizar tipo de servicio (Primera letra mayúscula, resto minúscula, sin espacios)
          const normalizedType = route.tipo.trim().charAt(0).toUpperCase() + route.tipo.trim().slice(1).toLowerCase();
          typesSet.add(normalizedType);
          
          // Extraer la localidad de inicio (lo que está antes del guión o guión largo)
          let origin = route.nombre.split(/[-–—]/)[0].trim();
          if (!origin) origin = "Varias";
          
          const normRouteKey = normalizeTextForDedup(route.nombre) + '|' + normalizeTextForDedup(normalizedType) + '|' + normalizeTextForDedup(comp);
          allRoutes.push({ key: normRouteKey, prov, comp, origin, nombre: route.nombre, tipo: normalizedType });
        });
      });
    });

    const byKey = {};
    allRoutes.forEach(item => {
      if (!byKey[item.key]) byKey[item.key] = [];
      byKey[item.key].push(item);
    });

    Object.values(byKey).forEach(items => {
      const provs = new Set(items.map(i => i.prov));
      let bestProv = items[0].prov;
      
      if (provs.size > 1) {
        const originNorm = normalizeTextForDedup(items[0].origin);
        bestProv = Array.from(provs).find(p => {
          const pNorm = normalizeTextForDedup(p);
          return originNorm === pNorm || originNorm.includes(pNorm) || pNorm.includes(originNorm);
        }) || items[0].prov;
      }
      
      items.forEach(item => {
        // Ignorar si hay duplicado interprovincial y esta no es la provincia origen
        if (provs.size > 1 && item.prov !== bestProv) return;

        if (!result[item.prov]) {
          result[item.prov] = {};
        }
        if (!result[item.prov][item.origin]) {
          result[item.prov][item.origin] = [];
        }
        result[item.prov][item.origin].push({
          nombre: item.nombre,
          tipo: item.tipo,
          operador: item.comp
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

  const { transformedData, operators, serviceTypes, provincesList } = memoizedData || { 
    transformedData: {}, operators: [], serviceTypes: [], provincesList: [] 
  };

  const filteredData = useMemo(() => {
    const normalizeText = (text) => {
      if (!text) return "";
      return text.normalize("NFD")
                 .replace(/[\u0300-\u036f]/g, "")
                 .replace(/[-_.,]/g, " ")
                 .toLowerCase()
                 .trim();
    };

    const cleanSearch = normalizeText(searchTerm);
    const searchTerms = cleanSearch ? cleanSearch.split(/\s+/).filter(Boolean) : [];
    
    const result = {};

    Object.keys(transformedData).forEach(prov => {
      // Province filter (via dropdown)
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
          if (cleanSearch) {
            const isHyphenSearch = searchTerm.trim().endsWith('-');
            if (exactMatch || isHyphenSearch) {
              // Exact locality match
              return normalizeText(loc) === cleanSearch;
            } else {
              // Flexible context search
              const context = normalizeText(`${route.nombre} ${route.operador} ${route.tipo} ${loc}`);
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
  const isSearching = searchTerm.trim().length > 0 || selectedOperator !== 'all' || selectedType !== 'all' || selectedProvince !== 'all';

  const groupedOperators = useMemo(() => {
    if (!operators) return [];
    const grouped = {};
    operators.forEach(op => {
      let firstLetter = op.charAt(0).toUpperCase();
      firstLetter = firstLetter.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!/[A-Z]/.test(firstLetter)) firstLetter = '#';
      if (!grouped[firstLetter]) grouped[firstLetter] = [];
      grouped[firstLetter].push(op);
    });
    return Object.keys(grouped).sort().map(letter => ({
      letter,
      operators: grouped[letter].sort()
    }));
  }, [operators]);

  return (
    <div className="app-container">
      <header>
        <h1>Rutas Bonificadas</h1>
        <p>Explora las rutas de transporte por provincia y localidad de inicio</p>
        
        <div className="search-container">
          <input 
            type="text"
            className="search-input"
            placeholder="🔍 Buscar ruta, operador o localidad..." 
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
              {provincesList && provincesList.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Empresa</label>
            <CustomCompanySelect 
              groupedOperators={groupedOperators}
              selectedOperator={selectedOperator}
              onChange={setSelectedOperator}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Tipo</label>
            <select 
              className="filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todos los tipos</option>
              {serviceTypes && serviceTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Búsqueda</label>
            <select 
              className="filter-select"
              value={exactMatch ? 'exact' : 'flexible'}
              onChange={(e) => setExactMatch(e.target.value === 'exact')}
            >
              <option value="flexible">Global (Todo)</option>
              <option value="exact">Solo Capital/Pueblo</option>
            </select>
          </div>
        </div>
      </header>

      {provinces.length === 0 ? (
        <div className="no-results">
          <h2>No se encontraron resultados para "{searchTerm}"</h2>
          <p>Prueba con otra búsqueda o limpia los filtros.</p>
        </div>
      ) : (
        <main className="provinces-grid">
          {provinces.map((prov) => (
            <ProvinceCard 
              key={prov} 
              province={prov} 
              localitiesData={filteredData[prov]} 
              isSearching={isSearching}
            />
          ))}
        </main>
      )}

      <footer className="app-footer">
        <p>Datos basados en las Rutas Bonificadas de la Junta de Castilla y León.</p>
        <p>Consulta siempre la versión oficial y actualizada en <a href="https://www.buscyl.es" target="_blank" rel="noopener noreferrer">buscyl.es</a></p>
      </footer>
    </div>
  );
}

export default App;
