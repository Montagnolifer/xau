const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testCustomizations() {
  console.log('🧪 Testando CRUD de personalizações...\n');

  try {
    // 1. Buscar configurações da empresa
    console.log('1. Buscando configurações da empresa...');
    const settingsResponse = await axios.get(`${API_BASE}/company/settings`);
    const companyId = settingsResponse.data.id;
    console.log(`✅ Empresa encontrada: ${companyId}\n`);

    // 2. Adicionar nova personalização
    console.log('2. Adicionando nova personalização...');
    const newCustomization = {
      title: "Personalização Teste",
      description: "Descrição da personalização de teste",
      price: 10.50,
      type: "text",
      scope: "product",
      isActive: true
    };

    const addResponse = await axios.post(`${API_BASE}/company/${companyId}/customizations`, newCustomization);
    console.log('✅ Personalização adicionada:', addResponse.data.customizations.slice(-1)[0]);
    
    const addedCustomizationId = addResponse.data.customizations.slice(-1)[0].id;
    console.log(`ID da personalização: ${addedCustomizationId}\n`);

    // 3. Atualizar personalização
    console.log('3. Atualizando personalização...');
    const updateData = {
      title: "Personalização Teste Atualizada",
      price: 15.75
    };

    const updateResponse = await axios.patch(`${API_BASE}/company/${companyId}/customizations/${addedCustomizationId}`, updateData);
    console.log('✅ Personalização atualizada:', updateResponse.data.customizations.find(c => c.id === addedCustomizationId));
    console.log();

    // 4. Alternar status da personalização
    console.log('4. Alternando status da personalização...');
    const toggleResponse = await axios.patch(`${API_BASE}/company/${companyId}/customizations/${addedCustomizationId}/toggle`);
    const toggledCustomization = toggleResponse.data.customizations.find(c => c.id === addedCustomizationId);
    console.log(`✅ Status alterado para: ${toggledCustomization.isActive ? 'Ativo' : 'Inativo'}\n`);

    // 5. Listar todas as personalizações
    console.log('5. Listando todas as personalizações...');
    const listResponse = await axios.get(`${API_BASE}/company/${companyId}`);
    console.log(`✅ Total de personalizações: ${listResponse.data.customizations.length}`);
    listResponse.data.customizations.forEach((customization, index) => {
      console.log(`   ${index + 1}. ${customization.title} - R$ ${customization.price} (${customization.isActive ? 'Ativo' : 'Inativo'})`);
    });
    console.log();

    // 6. Excluir personalização
    console.log('6. Excluindo personalização...');
    await axios.delete(`${API_BASE}/company/${companyId}/customizations/${addedCustomizationId}`);
    console.log('✅ Personalização excluída\n');

    // 7. Verificar se foi excluída
    console.log('7. Verificando exclusão...');
    const finalResponse = await axios.get(`${API_BASE}/company/${companyId}`);
    const remainingCustomizations = finalResponse.data.customizations.filter(c => c.id === addedCustomizationId);
    console.log(`✅ Personalização excluída: ${remainingCustomizations.length === 0 ? 'Sim' : 'Não'}\n`);

    console.log('🎉 Todos os testes passaram com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testCustomizations();
}

module.exports = { testCustomizations };

