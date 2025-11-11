const { Client } = require('pg');

async function testDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'emma_catalogo',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Verificar se a tabela users existe
    const tableQuery = `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    const tableResult = await client.query(tableQuery);
    console.log('Estrutura da tabela users:');
    tableResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Verificar se há usuários
    const usersQuery = 'SELECT id, name, whatsapp, "isActive", "lastLoginAt" FROM users LIMIT 5;';
    const usersResult = await client.query(usersQuery);
    console.log('\nUsuários encontrados:');
    usersResult.rows.forEach(user => {
      console.log(`ID: ${user.id}, Nome: ${user.name}, WhatsApp: ${user.whatsapp}, Ativo: ${user.isActive}, Último Login: ${user.lastLoginAt}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

testDatabase(); 