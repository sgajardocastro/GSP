import XLSX from 'xlsx';

const filePath = 'D:\\SGajardo\\Google Drive\\Antigravity\\Transmac\\Encuesta de Clima Laboral\\ENCUESTA CLIMA LABORAL TRANSMAC.xlsx';

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(JSON.stringify(data, null, 2));
} catch (error) {
    console.error('Error reading excel file:', error.message);
}
