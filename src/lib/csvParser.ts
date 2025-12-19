import { School } from "@/types/school";

export function parseCSV(csv: string, vacancyColumnHeader: string): School[] {
  const lines = csv.split('\n');
  const schools: School[] = [];
  
  // Parse header to find vacancy column index
  const headerLine = lines[0];
  const headerValues: string[] = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      headerValues.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  headerValues.push(currentValue.trim());
  
  // Find the vacancy column index
  const vacancyColumnIndex = headerValues.findIndex(
    header => header === vacancyColumnHeader
  );
  
  if (import.meta.env.DEV) {
    console.log('📊 CSV Headers:', headerValues);
    console.log(`🎯 Looking for vacancy column: "${vacancyColumnHeader}"`);
    console.log(`📍 Vacancy column found at index: ${vacancyColumnIndex}`);
  }
  
  // Skip header line, start from data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV considering quoted values
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    // Map columns to School object
    // A=ID, B=EM/CMEI, C=NOME, D=ENDEREÇO, E=CEP, F=TELEFONE, G=RAMAL, 
    // H=BAIRRO, I=LAT, J=LNG, K=LINK(skip), L=SETOR, M=POLO, N=TERCERIZADA
    // O=BERÇÁRIO, P=INFANTIL 1, Q=INFANTIL 2, R=PRÉ 1, S=PRÉ 2
    // T=1 ANO, U=2 ANO, V=3 ANO, W=4 ANO, X=5 ANO
    
    if (values.length < 14) continue; // Skip invalid rows
    
    // Parse vacancy data if column exists
    let vacancyValue = 0;
    if (vacancyColumnIndex >= 0 && vacancyColumnIndex < values.length) {
      const rawVacancy = values[vacancyColumnIndex];
      const parsedVacancy = parseInt(rawVacancy);
      // Validation: only accept positive numbers
      if (!isNaN(parsedVacancy) && parsedVacancy > 0) {
        vacancyValue = parsedVacancy;
      }
    }

    const school: School = {
      id: parseInt(values[0]) || 0,
      type: values[1] || '',
      name: values[2] || '',
      address: values[3] || '',
      cep: values[4] || '',
      phone: values[5] || '',
      extension: values[6] || undefined,
      neighborhood: values[7] || '',
      lat: parseFloat(values[8]) || 0,
      lng: parseFloat(values[9]) || 0,
      // Skip column K (LINK)
      sector: values[11] || '',
      polo: values[12] || '',
      outsourced: values[13] || undefined,
      bercario: parseInt(values[14]) || 0,
      infantil1: parseInt(values[15]) || 0,
      infantil2: parseInt(values[16]) || 0,
      pre1: parseInt(values[17]) || 0,
      pre2: parseInt(values[18]) || 0,
      ano1: parseInt(values[19]) || 0,
      ano2: parseInt(values[20]) || 0,
      ano3: parseInt(values[21]) || 0,
      ano4: parseInt(values[22]) || 0,
      ano5: parseInt(values[23]) || 0,
      vacancies: vacancyValue
    };
    
    schools.push(school);
  }
  
  // Log sample schools with vacancy data for verification (dev only)
  if (import.meta.env.DEV) {
    const schoolsWithVacancies = schools.filter(s => s.vacancies && s.vacancies > 0);
    console.log(`✅ Parsed ${schools.length} schools total`);
    console.log(`🎓 ${schoolsWithVacancies.length} schools have vacancies`);
    console.log('📝 Sample schools with vacancies:', schoolsWithVacancies.slice(0, 3).map(s => ({
      name: s.name,
      vacancies: s.vacancies
    })));
  }
  
  return schools;
}
