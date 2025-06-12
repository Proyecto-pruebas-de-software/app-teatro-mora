const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ruta de la carpeta donde están los archivos de test
const testDirectory = path.join(__dirname, 'src', 'pages');

// Función para buscar todos los archivos .test.jsx
function findTestFiles(dir) {
  let testFiles = [];
  
  // Leer todos los archivos en el directorio
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.lstatSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursión en subdirectorios
      testFiles = testFiles.concat(findTestFiles(fullPath));
    } else if (file.endsWith('.test.jsx')) {
      // Agregar archivo de prueba si tiene el sufijo .test.jsx
      testFiles.push(fullPath);
    }
  });

  return testFiles;
}

// Buscar todos los archivos de prueba en 'src/pages'
const testFiles = findTestFiles(testDirectory);

// Filtrar para solo incluir los archivos que realmente están en la lista proporcionada
const validTestFiles = [
  'Actores.test.jsx',
  'Boletos.test.jsx',
  'EventDetail.test.jsx',
  'EventForumPage.test.jsx',
  'Eventos.test.jsx',
  'Foro.test.jsx',
  'Inicio.test.jsx',
  'InicioSesion.test.jsx',
  'Registro.test.jsx'
];

const filteredTestFiles = testFiles.filter(file => 
  validTestFiles.includes(path.basename(file))
);

// Verificar si se encontraron archivos de prueba
if (filteredTestFiles.length === 0) {
  console.log('No se encontraron archivos de prueba.');
  process.exit(1);
}

// Comando para ejecutar Vitest con los archivos encontrados
const command = `npx vitest --run ${filteredTestFiles.join(' ')}`;

// Ejecutar los tests
console.log('Ejecutando los tests...');
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error al ejecutar los tests: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Error en stderr: ${stderr}`);
    return;
  }
  console.log(`Resultado de los tests:\n${stdout}`);
});
