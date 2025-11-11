import * as bcrypt from 'bcrypt';

async function generateHash(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hash da senha:', hash);
  return hash;
}

// Verificar se foi passado um argumento
const password = process.argv[2];

if (!password) {
  console.error('Uso: npx ts-node scripts/generate-admin-password.ts <senha>');
  process.exit(1);
}

generateHash(password)
  .then(() => {
    console.log('Hash gerado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao gerar hash:', error);
    process.exit(1);
  }); 