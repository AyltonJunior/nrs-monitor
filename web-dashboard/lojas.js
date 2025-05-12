// Função para buscar informações da loja pela API externa
async function buscarInfoLoja(codigo) {
    try {
        // Endpoint da API
        const url = `https://sistema.lavanderia60minutos.com.br/api/v1/stores/${codigo}`;
        
        // Configuração da requisição
        const opcoes = {
            method: 'GET',
            headers: {
                'X-Token': '1be10a9c20528183b64e3c69564db6958eab7f434ee94350706adb4efc261869',
                'Content-Type': 'application/json'
            }
        };
        
        // Fazer a requisição
        const resposta = await fetch(url, opcoes);
        
        // Verificar se a requisição foi bem-sucedida
        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status} - ${resposta.statusText}`);
        }
        
        // Converter a resposta para JSON
        const dados = await resposta.json();
        
        // Log da resposta completa para debug
        console.log("Resposta completa da API:", dados);
        
        // Extrair o zipcode (CEP) do caminho correto na estrutura de dados
        const zipcode = dados.data?.attributes?.zipcode || 'Não informado';
        
        // Formatar o CEP no padrão brasileiro (00000-000)
        let cepFormatado = zipcode;
        if (zipcode && zipcode.length === 8) {
            cepFormatado = `${zipcode.substring(0, 5)}-${zipcode.substring(5)}`;
        }
        
        console.log(`CEP da loja ${codigo}: ${cepFormatado}`);
        return cepFormatado;
    } catch (erro) {
        console.error(`Erro ao buscar informações da loja ${codigo}:`, erro);
        return 'Não informado';
    }
}

// Função para buscar o endereço completo a partir do CEP
async function buscarEnderecoPorCep(cep) {
    try {
        // Remover caracteres não numéricos do CEP
        const cepLimpo = cep.replace(/\D/g, '');
        
        if (cepLimpo.length !== 8) {
            throw new Error('CEP inválido');
        }
        
        // Fazer a requisição para a API ViaCEP
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        // Verificar se a requisição foi bem-sucedida
        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status} - ${resposta.statusText}`);
        }
        
        // Converter a resposta para JSON
        const dados = await resposta.json();
        
        // Verificar se o CEP foi encontrado
        if (dados.erro) {
            throw new Error('CEP não encontrado');
        }
        
        console.log("Endereço encontrado:", dados);
        return dados;
    } catch (erro) {
        console.error('Erro ao buscar endereço:', erro);
        return null;
    }
}

// Função para atualizar a interface com o CEP da loja
function exibirCEPLoja(codigo, elementoDestino) {
    // Elemento onde o CEP será exibido (pode ser passado como parâmetro)
    const elemento = document.querySelector(elementoDestino);
    if (!elemento) {
        console.error(`Elemento ${elementoDestino} não encontrado`);
        return;
    }
    
    // Mostrar carregando
    elemento.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Buscando CEP...';
    
    // Buscar o CEP
    buscarInfoLoja(codigo)
        .then(async zipcode => {
            if (zipcode && zipcode !== 'Não informado') {
                // Tentando buscar o endereço completo a partir do CEP
                const cepLimpo = zipcode.replace(/\D/g, '');
                const endereco = await buscarEnderecoPorCep(cepLimpo);
                
                // Processar coordenadas e salvar no Firebase
                if (endereco) {
                    // Disparamos o processamento de coordenadas em paralelo para não atrasar a UI
                    processarCepECoordenadas(codigo, cepLimpo)
                        .then(coordenadas => {
                            if (coordenadas) {
                                console.log(`Coordenadas obtidas e salvas para loja ${codigo}: Lat ${coordenadas.lat}, Lon ${coordenadas.lon}`);
                                
                                // Adicionar um badge discreto indicando que as coordenadas foram salvas
                                const badgeCoord = document.createElement('span');
                                badgeCoord.className = 'badge bg-success text-white ms-1';
                                badgeCoord.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
                                badgeCoord.title = `Coordenadas salvas: Lat ${coordenadas.lat}, Lon ${coordenadas.lon}`;
                                
                                const coordBadgeContainer = elemento.querySelector('.coord-badge-container');
                                if (coordBadgeContainer) {
                                    coordBadgeContainer.appendChild(badgeCoord);
                                }
                            }
                        })
                        .catch(erro => console.error('Erro ao processar coordenadas:', erro));
                    
                    // Formatar o endereço completo
                    const enderecoCompleto = `${endereco.logradouro}, ${endereco.bairro}, ${endereco.localidade} - ${endereco.uf}`;
                    
                    // Exibir o CEP e o endereço formatado
                    elemento.innerHTML = `
                        <i class="fas fa-map-marker-alt me-2"></i>
                        <span class="badge bg-light text-dark border">${zipcode}</span>
                        <span class="ms-2">${enderecoCompleto}</span>
                        <span class="coord-badge-container ms-1"></span>
                    `;
                } else {
                    // Se o endereço não for encontrado, exibir apenas o CEP
                    elemento.innerHTML = `<i class="fas fa-map-marker-alt me-2"></i>CEP: <span class="badge bg-light text-dark border">${zipcode}</span>`;
                }
                
                // Adicionar uma pequena animação para destacar que o valor foi atualizado
                const badgeElement = elemento.querySelector('.badge');
                if (badgeElement) {
                    badgeElement.classList.add('fw-bold');
                    // Adicionar temporariamente uma classe para animar
                    badgeElement.classList.add('bg-success', 'text-white');
                    setTimeout(() => {
                        badgeElement.classList.remove('bg-success', 'text-white');
                    }, 1000);
                }
            } else {
                // Exibir mensagem de erro
                elemento.innerHTML = '<i class="fas fa-exclamation-triangle me-2 text-warning"></i>CEP: <span class="text-muted">Não informado</span>';
            }
        })
        .catch(erro => {
            console.error('Erro ao exibir CEP:', erro);
            elemento.innerHTML = '<i class="fas fa-exclamation-triangle me-2 text-warning"></i>CEP: <span class="text-muted">Não disponível</span>';
        });
}

// Exemplo de uso:
// Para usar esta função na página de detalhes da loja:
// document.addEventListener('DOMContentLoaded', function() {
//     // Obter o código da loja da URL
//     const urlParams = new URLSearchParams(window.location.search);
//     const codigoLoja = urlParams.get('id');
//     
//     if (codigoLoja) {
//         // Exibir o CEP no elemento com ID 'loja-cep'
//         exibirCEPLoja(codigoLoja, '#loja-cep');
//     }
// });

// Função para obter coordenadas a partir de um endereço
async function obterCoordenadas(endereco) {
    try {
        // Formatar o endereço para a consulta
        const enderecoFormatado = encodeURIComponent(`${endereco.logradouro}, ${endereco.bairro}, ${endereco.localidade}, ${endereco.uf}, Brazil`);
        
        // Usar o serviço de geocodificação Nominatim do OpenStreetMap (gratuito)
        const url = `https://nominatim.openstreetmap.org/search?q=${enderecoFormatado}&format=json&limit=1`;
        
        console.log(`Buscando coordenadas para: ${enderecoFormatado}`);
        
        // Fazer a requisição com os headers necessários
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'IkliTecnologia Dashboard',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao obter coordenadas: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar se há resultados
        if (data && data.length > 0) {
            const coordenadas = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
            
            console.log(`Coordenadas obtidas: Lat ${coordenadas.lat}, Lon ${coordenadas.lon}`);
            return coordenadas;
        } else {
            console.warn(`Nenhuma coordenada encontrada para o endereço: ${enderecoFormatado}`);
            return null;
        }
    } catch (erro) {
        console.error('Erro ao obter coordenadas:', erro);
        return null;
    }
}

// Função para salvar coordenadas no Firebase para a loja
async function salvarCoordenadasLoja(codigoLoja, coordenadas) {
    try {
        if (!firebase.apps.length) {
            console.error('Firebase não inicializado!');
            return false;
        }
        
        if (!codigoLoja || !coordenadas) {
            console.error('Código da loja ou coordenadas inválidos');
            return false;
        }
        
        // Salvar diretamente no nó da loja (não no nó lojas/PB01)
        await firebase.database().ref(`${codigoLoja}/coordenadas`).set(coordenadas);
        
        console.log(`Coordenadas salvas para loja ${codigoLoja}: Lat ${coordenadas.lat}, Lon ${coordenadas.lon}`);
        return true;
    } catch (erro) {
        console.error(`Erro ao salvar coordenadas para loja ${codigoLoja}:`, erro);
        return false;
    }
}

// Função para processar o CEP, obter coordenadas e salvar no Firebase
async function processarCepECoordenadas(codigo, cep) {
    try {
        console.log(`Processando CEP ${cep} da loja ${codigo}`);
        
        // Limpar o CEP (remover caracteres não numéricos)
        const cepLimpo = cep.replace(/\D/g, '');
        
        // Obter informações de endereço do CEP
        const endereco = await buscarEnderecoPorCep(cepLimpo);
        
        if (endereco) {
            // Obter coordenadas do endereço
            const coordenadas = await obterCoordenadas(endereco);
            
            if (coordenadas) {
                // Salvar coordenadas no Firebase
                const resultado = await salvarCoordenadasLoja(codigo, coordenadas);
                return resultado ? coordenadas : null;
            }
        }
        
        return null;
    } catch (erro) {
        console.error(`Erro ao processar CEP da loja ${codigo}:`, erro);
        return null;
    }
} 