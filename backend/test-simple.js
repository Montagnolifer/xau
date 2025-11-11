const axios = require('axios');

const API_BASE_URL = 'http://localhost:3005';

async function testSimple() {
  try {
    console.log('🚀 Testando endpoint /company/my-company...');
    
    // Primeiro fazer login como admin
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    console.log('✅ Login realizado com sucesso');
    const token = loginResponse.data.access_token;
    
    // Testar o novo endpoint
    const companyResponse = await axios.get(`${API_BASE_URL}/company/my-company`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Empresa obtida/criada com sucesso:', {
      id: companyResponse.data.id,
      name: companyResponse.data.name,
      hasSettings: !!companyResponse.data.settings
    });
    
    // Testar buscar configurações
    const settingsResponse = await axios.get(`${API_BASE_URL}/company/${companyResponse.data.id}/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Configurações carregadas:', settingsResponse.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testSimple(); 