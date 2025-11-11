const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'uploads');
const targetDir = path.join(__dirname, '..', 'dist', 'uploads');

// Criar pasta de destino se não existir
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✅ Pasta dist/uploads criada');
}

// Função para copiar um arquivo específico
function copyFile(filename) {
  try {
    const sourcePath = path.join(sourceDir, filename);
    const targetPath = path.join(targetDir, filename);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Arquivo copiado: ${filename}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao copiar ${filename}:`, error.message);
  }
}

// Função para copiar todos os arquivos
function copyAllFiles() {
  try {
    if (!fs.existsSync(sourceDir)) {
      console.log('⚠️  Pasta uploads não encontrada');
      return;
    }

    const files = fs.readdirSync(sourceDir);
    let copiedCount = 0;
    
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      if (fs.statSync(sourcePath).isFile()) {
        const targetPath = path.join(targetDir, file);
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    });

    console.log(`✅ ${copiedCount} arquivo(s) sincronizado(s)`);
  } catch (error) {
    console.error('❌ Erro ao copiar arquivos:', error.message);
  }
}

// Função para monitorar mudanças
function watchUploads() {
  console.log('👀 Monitorando pasta uploads...');
  console.log('Pressione Ctrl+C para parar');
  
  // Copiar arquivos existentes primeiro
  copyAllFiles();
  
  // Monitorar mudanças na pasta uploads
  fs.watch(sourceDir, (eventType, filename) => {
    if (filename && eventType === 'rename') {
      // Aguardar um pouco para garantir que o arquivo foi completamente escrito
      setTimeout(() => {
        copyFile(filename);
      }, 100);
    }
  });
}

// Executar monitoramento
watchUploads(); 