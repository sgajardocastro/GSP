import XLSX from 'xlsx';
import fs from 'fs';

const filePath = "d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Documentos ejemplo/datos base para leanglobal/datos base para leanglobal/Maestro Maquinarias 2026 - copia.xlsx";

function cleanStr(val) {
  if (val === undefined || val === null) return '';
  return String(val).trim().toUpperCase().replace(/\s+/g, ' ');
}

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = "MAESTRO ACTUALIZADO (2)";
  const worksheet = workbook.Sheets[sheetName];
  
  if (!worksheet) {
    console.error(`Sheet "${sheetName}" not found!`);
    process.exit(1);
  }

  // Convert to JSON array of objects
  const rawRows = XLSX.utils.sheet_to_json(worksheet);
  console.log(`Total rows read from sheet: ${rawRows.length}`);

  const categories = new Set();
  const subcategories = new Map(); // Category -> Set of Subcategories
  const brands = new Set();
  const brandToModels = new Map(); // Brand -> Set of Models
  const companies = new Set();
  const years = new Set();
  
  const duplicatePlates = {}; // Plate -> count
  const missingDataRows = [];
  const allPlates = [];

  rawRows.forEach((row, index) => {
    const rawNum = row['Nº '] || row['Nº C'];
    const rowId = `Row ${index + 2} (Nº ${rawNum})`;

    const codigo = cleanStr(row['CODIGO']);
    const tipo = cleanStr(row['TIPO MAQUINARIAS']);
    const marca = cleanStr(row['MARCA']);
    const modelo = cleanStr(row['MODELO']);
    const ano = row['AÑO'];
    const patente = cleanStr(row['PATENTE']);
    const empresa = cleanStr(row['EMPRESA']);
    const familia = cleanStr(row['FAMILIA']);

    // Check missing fields
    const missing = [];
    if (!familia) missing.push('FAMILIA');
    if (!tipo) missing.push('TIPO MAQUINARIAS');
    if (!marca) missing.push('MARCA');
    if (!modelo) missing.push('MODELO');
    if (!patente) missing.push('PATENTE');
    if (!empresa) missing.push('EMPRESA');

    if (missing.length > 0) {
      missingDataRows.push({ rowId, missing, data: row });
    }

    // Collect counts
    if (familia) {
      categories.add(familia);
      if (!subcategories.has(familia)) {
        subcategories.set(familia, new Set());
      }
      if (tipo) subcategories.get(familia).add(tipo);
    }

    if (marca) {
      brands.add(marca);
      if (!brandToModels.has(marca)) {
        brandToModels.set(marca, new Set());
      }
      if (modelo) brandToModels.get(marca).add(modelo);
    }

    if (empresa) companies.add(empresa);
    if (ano) years.add(ano);

    if (patente) {
      allPlates.push(patente);
      duplicatePlates[patente] = (duplicatePlates[patente] || 0) + 1;
    }
  });

  console.log("\n==========================================");
  console.log("             ANÁLISIS DE DATOS            ");
  console.log("==========================================\n");

  console.log("1. 👥 EMPRESAS REGISTRADAS:");
  console.log(Array.from(companies));

  console.log("\n2. 📂 FAMILIAS (CATEGORÍAS):");
  console.log(Array.from(categories));

  console.log("\n3. 🏷️ SUB-CATEGORÍAS POR FAMILIA:");
  for (const [fam, subs] of subcategories.entries()) {
    console.log(`- ${fam}:`);
    console.log("  ", Array.from(subs));
  }

  console.log("\n4. 🏭 MARCAS REGISTRADAS (Y POSIBLES INCONSISTENCIAS):");
  console.log(Array.from(brands).sort());

  console.log("\n5. 🚘 MODELOS POR MARCA:");
  for (const [br, mods] of brandToModels.entries()) {
    console.log(`- ${br}:`);
    console.log("  ", Array.from(mods).sort());
  }

  console.log("\n6. 🚗 ANÁLISIS DE PATENTES Y DUPLICADOS:");
  const duplicates = Object.entries(duplicatePlates).filter(([p, c]) => c > 1);
  if (duplicates.length > 0) {
    console.log("⚠️ Patentes duplicadas encontradas:");
    duplicates.forEach(([p, c]) => console.log(`  - ${p}: aparece ${c} veces`));
  } else {
    console.log("✔ No hay patentes duplicadas.");
  }

  console.log("\n7. ⚠️ FILAS CON CAMPOS FALTANTES:");
  if (missingDataRows.length > 0) {
    missingDataRows.forEach(m => {
      console.log(`  - ${m.rowId}: faltan ${m.missing.join(', ')}`);
      console.log(`    Data:`, JSON.stringify(m.data));
    });
  } else {
    console.log("✔ Todas las filas tienen sus campos obligatorios completos.");
  }

} catch (err) {
  console.error("Error running analysis:", err.stack);
}
