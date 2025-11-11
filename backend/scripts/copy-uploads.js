const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'uploads');
const targetDir = path.join(__dirname, '..', 'dist', 'uploads');

// Criar pasta de destino se não existir
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('✅ Pasta dist/uploads criada');
}

// Função para copiar arquivos
function copyFiles() {
  try {
    // Verificar se a pasta de origem existe
    if (!fs.existsSync(sourceDir)) {
      console.log('⚠️  Pasta uploads não encontrada');
      return;
    }

    // Ler todos os arquivos da pasta de origem
    const files = fs.readdirSync(sourceDir);
    
    if (files.length === 0) {
      console.log('ℹ️  Nenhum arquivo encontrado na pasta uploads');
      return;
    }

    let copiedCount = 0;
    
    // Copiar cada arquivo
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      // Verificar se é um arquivo (não pasta)
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
        copiedCount++;
      }
    });

    console.log(`✅ ${copiedCount} arquivo(s) copiado(s) para dist/uploads`);
  } catch (error) {
    console.error('❌ Erro ao copiar arquivos:', error.message);
  }
}

// Executar a cópia
copyFiles(); 