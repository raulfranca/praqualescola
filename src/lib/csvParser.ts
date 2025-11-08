import { School } from "@/types/school";

export function parseCSV(csv: string): School[] {
  const lines = csv.split('\n');
  const schools: School[] = [];
  
  // Skip header line
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
    
    if (values.length < 14) continue; // Skip invalid rows
    
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
    };
    
    schools.push(school);
  }
  
  return schools;
}
