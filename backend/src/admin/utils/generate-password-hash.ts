import * as bcrypt from 'bcrypt';

/**
 * Utilitário para gerar hash de senha
 * Use este script para gerar o hash da senha quando for cadastrar admin diretamente no banco
 */

console.log('Exemplo: npx ts-node src/admin/utils/generate-password-hash.ts');

export async function generatePasswordHash(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Exemplo de uso:
async function generateHash() {
  // Altere esta linha para colocar a senha que você quer
  const password = 'Dbh5000@';
  
  const hashedPassword = await generatePasswordHash(password);
  console.log('Senha original:', password);
  console.log('Hash gerado:', hashedPassword);
  
  // Esta parte gera o comando SQL completo para você
  console.log('\nComando SQL completo:');
  console.log(`INSERT INTO admins (id, name, email, password, "isActive", "createdAt", "updatedAt") VALUES (
  gen_random_uuid(),
  'Fernando',
  'feer.montagnoli@gmail.com',
  '${hashedPassword}',
  true,
  NOW(),
  NOW()
);`);
}

generateHash();