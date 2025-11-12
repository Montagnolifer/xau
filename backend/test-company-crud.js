const axios = require('axios');

const API_BASE_URL = 'http://localhost:3105';

// Função para fazer login como admin
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'admin123'
    });
    
    console.log('✅ Login realizado com sucesso');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    return null;
  }
}

// Função para criar uma empresa
async function createCompany(token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/company`, {
      name: 'Empresa Teste',
      description: 'Empresa para teste das configurações',
      cnpj: '12.345.678/0001-90',
      phone: '(11) 99999-9999',
      email: 'contato@empresateste.com',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      website: 'https://empresateste.com',
      admin_id: 'admin-uuid-example', // Substituir pelo ID real do admin
      settings: {
        siteName: 'Empresa Teste',
        siteDescription: 'Sistema de administração profissional',
        adminEmail: 'admin@empresateste.com',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        notifications: true,
        emailNotifications: true,
        maintenanceMode: false,
        registrationEnabled: true,
        shopeeEnabled: false,
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        accentColor: '#10B981',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        melhorEnvioEnabled: false,
        autoCalculateShipping: true,
        freeShippingThreshold: 100.00,
        defaultShippingMethod: 'pac',
        shippingZones: ['Sudeste', 'Sul'],
        cartMinimumEnabled: false,
        cartMinimumType: 'quantity',
        cartMinimumQuantity: 2,
        cartMinimumValue: 50.00,
        customizations: [
          {
            id: '1',
            title: 'Personalizar Nome',
            description: 'Adicione o nome personalizado ao produto',
            price: 5.00,
            isActive: true,
            type: 'text',
            scope: 'product'
          }
        ]
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Empresa criada com sucesso:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error.response?.data || error.message);
    return null;
  }
}

// Função para buscar configurações
async function getSettings(token, companyId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/company/${companyId}/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Configurações carregadas:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error.response?.data || error.message);
    return null;
  }
}

// Função para atualizar configurações gerais
async function updateGeneralSettings(token, companyId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/company/${companyId}/settings/general`, {
      siteName: 'Empresa Teste Atualizada',
      siteDescription: 'Sistema atualizado',
      adminEmail: 'admin@empresateste.com',
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Configurações gerais atualizadas:', response.data.settings);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações gerais:', error.response?.data || error.message);
    return null;
  }
}

// Função para atualizar configurações de tema
async function updateThemeSettings(token, companyId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/company/${companyId}/settings/theme`, {
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      accentColor: '#45B7D1',
      backgroundColor: '#FFFFFF',
      textColor: '#2C3E50'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Configurações de tema atualizadas:', response.data.settings);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de tema:', error.response?.data || error.message);
    return null;
  }
}

// Função para atualizar configurações de envio
async function updateShippingSettings(token, companyId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/company/${companyId}/settings/shipping`, {
      melhorEnvioEnabled: true,
      melhorEnvioToken: 'token-teste',
      melhorEnvioEnvironment: 'sandbox',
      autoCalculateShipping: true,
      freeShippingThreshold: 150.00,
      defaultShippingMethod: 'pac',
      shippingZones: ['Sudeste', 'Sul', 'Nordeste']
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Configurações de envio atualizadas:', response.data.settings);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações de envio:', error.response?.data || error.message);
    return null;
  }
}

// Função para atualizar configurações do carrinho
async function updateCartSettings(token, companyId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/company/${companyId}/settings/cart`, {
      cartMinimumEnabled: true,
      cartMinimumType: 'value',
      cartMinimumQuantity: 3,
      cartMinimumValue: 75.00
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Configurações do carrinho atualizadas:', response.data.settings);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações do carrinho:', error.response?.data || error.message);
    return null;
  }
}

// Função para atualizar personalizações
async function updateCustomizations(token, companyId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/company/${companyId}/settings/customizations`, [
      {
        id: '1',
        title: 'Personalizar Nome',
        description: 'Adicione o nome personalizado ao produto',
        price: 5.00,
        isActive: true,
        type: 'text',
        scope: 'product'
      },
      {
        id: '2',
        title: 'Escolher Cor',
        description: 'Selecione a cor personalizada do produto',
        price: 3.50,
        isActive: true,
        type: 'color',
        scope: 'product'
      },
      {
        id: '3',
        title: 'Mensagem Especial',
        description: 'Adicione uma mensagem personalizada ao pedido',
        price: 2.00,
        isActive: true,
        type: 'text',
        scope: 'cart'
      }
    ], {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Personalizações atualizadas:', response.data.settings);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar personalizações:', error.response?.data || error.message);
    return null;
  }
}

// Função para atualizar configurações da Shopee
async function updateShopeeSettings(token, companyId) {
  try {
    const response = await axios.patch(`${API_BASE_URL}/company/${companyId}/settings/shopee`, {
      shopeeEnabled: true,
      shopeeApiKey: 'api-key-teste',
      shopeeSecretKey: 'secret-key-teste',
      shopeePartnerId: 'partner-id-teste',
      shopeeShopId: 'shop-id-teste',
      shopeeEnvironment: 'sandbox',
      shopeeAutoSync: true,
      shopeeSyncInterval: 'daily'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Configurações da Shopee atualizadas:', response.data.settings);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações da Shopee:', error.response?.data || error.message);
    return null;
  }
}

// Função principal de teste
async function testCompanyCRUD() {
  console.log('🚀 Iniciando teste do CRUD de configurações da empresa...\n');
  
  // 1. Login como admin
  const token = await loginAsAdmin();
  if (!token) {
    console.log('❌ Falha no login. Teste interrompido.');
    return;
  }
  
  // 2. Criar empresa
  const company = await createCompany(token);
  if (!company) {
    console.log('❌ Falha ao criar empresa. Teste interrompido.');
    return;
  }
  
  const companyId = company.id;
  
  // 3. Buscar configurações
  await getSettings(token, companyId);
  
  // 4. Atualizar configurações gerais
  await updateGeneralSettings(token, companyId);
  
  // 5. Atualizar configurações de tema
  await updateThemeSettings(token, companyId);
  
  // 6. Atualizar configurações de envio
  await updateShippingSettings(token, companyId);
  
  // 7. Atualizar configurações do carrinho
  await updateCartSettings(token, companyId);
  
  // 8. Atualizar personalizações
  await updateCustomizations(token, companyId);
  
  // 9. Atualizar configurações da Shopee
  await updateShopeeSettings(token, companyId);
  
  // 10. Verificar configurações finais
  console.log('\n📋 Verificando configurações finais...');
  await getSettings(token, companyId);
  
  console.log('\n✅ Teste do CRUD de configurações concluído com sucesso!');
}

// Executar teste
testCompanyCRUD().catch(console.error); 