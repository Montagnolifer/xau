const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor com monitoramento de uploads...');

// Iniciar o script de monitoramento de uploads
const watchProcess = spawn('node', [path.join(__dirname, 'watch-uploads.js')], {
  stdio: 'inherit',
  detached: true
});

// Iniciar o servidor NestJS
const serverProcess = spawn('npm', ['run', 'start:dev'], {
  stdio: 'inherit',
  shell: true
});

// Gerenciar encerramento dos processos
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando processos...');
  watchProcess.kill();
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando processos...');
  watchProcess.kill();
  serverProcess.kill();
  process.exit(0);
});

// Aguardar encerramento de qualquer processo
watchProcess.on('close', (code) => {
  console.log(`📁 Processo de monitoramento encerrado com código ${code}`);
  serverProcess.kill();
});

serverProcess.on('close', (code) => {
  console.log(`🌐 Servidor encerrado com código ${code}`);
  watchProcess.kill();
}); 