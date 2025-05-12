// Referência ao banco de dados do Firebase
const database = firebase.database();

// Obtém o ID da loja da URL
const urlParams = new URLSearchParams(window.location.search);
const lojaId = urlParams.get('id');

// Elementos do DOM
const lojaCodigoElement = document.getElementById('loja-codigo');
const lojaTituloElement = document.getElementById('loja-titulo');
const lojaStatusElement = document.getElementById('loja-status');

// Elementos de containers
const lavadorasContainer = document.getElementById('lavadoras-container');
const secadorasContainer = document.getElementById('secadoras-container');
const dosadorasContainer = document.getElementById('dosadoras-container');
const arContainer = document.getElementById('ar-container');

// Elementos de loading
const lavadorasLoading = document.getElementById('lavadoras-loading');
const secadorasLoading = document.getElementById('secadoras-loading');
const dosadorasLoading = document.getElementById('dosadoras-loading');
const arLoading = document.getElementById('ar-loading');

// Templates
const lavadoraCardTemplate = document.getElementById('lavadora-card-template');
const secadoraCardTemplate = document.getElementById('secadora-card-template');
const dosadoraCardTemplate = document.getElementById('dosadora-card-template');
const arCardTemplate = document.getElementById('ar-card-template');

// Refer�ncia para o hist�rico de status no Firebase
const statusHistoryRef = database.ref(`status_history/${lojaId}`);

// Sistema de alertas modernos
let alertModal = null;
let confirmModal = null;
let lastConfirmCallback = null;

// Inicializa modais de alerta quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const alertModalElement = document.getElementById('alertModal');
    const confirmModalElement = document.getElementById('confirmModal');
    
    if (alertModalElement) {
        alertModal = new bootstrap.Modal(alertModalElement);
    }
    
    if (confirmModalElement) {
        confirmModal = new bootstrap.Modal(confirmModalElement);
        
        // Configura o botão de confirmação
        const confirmBtn = document.getElementById('confirmModalButtonConfirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (lastConfirmCallback && typeof lastConfirmCallback === 'function') {
                    lastConfirmCallback(true);
                    lastConfirmCallback = null;
                }
                confirmModal.hide();
            });
        }
        
        // Configura o botão de cancelamento
        const cancelBtn = document.getElementById('confirmModalButtonCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (lastConfirmCallback && typeof lastConfirmCallback === 'function') {
                    lastConfirmCallback(false);
                    lastConfirmCallback = null;
                }
            });
        }
        
        // Quando o modal é fechado sem clicar em botões (ex: clicando fora ou ESC)
        confirmModalElement.addEventListener('hidden.bs.modal', () => {
            if (lastConfirmCallback && typeof lastConfirmCallback === 'function') {
                lastConfirmCallback(false);
                lastConfirmCallback = null;
            }
        });
    }
});

/**
 * Exibe um alerta personalizado em um modal ou toast
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} titulo - Título do alerta (opcional)
 * @param {string} tipo - Tipo de alerta ('success', 'error', 'warning', 'info')
 * @param {boolean} isToast - Se deve ser exibido como toast (notificação temporária)
 */
function showAlert(mensagem, titulo = 'Mensagem', tipo = 'info', isToast = false) {
    if (isToast) {
        // Cria um toast para notificações temporárias
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-${getBgClass(tipo)} text-white">
                    <i class="fas ${getIconClass(tipo)} me-2"></i>
                    <strong class="me-auto">${titulo}</strong>
                    <small>Agora</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${mensagem}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
        
        // Remover o elemento do DOM quando for fechado
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
        
        toast.show();
    } else {
        // Usa o modal para alertas que exigem atenção
        if (!alertModal) return;
        
        const alertModalTitle = document.getElementById('alertModalTitle');
        const alertModalMessage = document.getElementById('alertModalMessage');
        
        if (alertModalTitle) {
            alertModalTitle.innerHTML = `<i class="fas ${getIconClass(tipo)} me-2"></i>${titulo}`;
            alertModalTitle.className = `modal-title bg-${getBgClass(tipo)} text-white p-2 rounded`;
        }
        
        if (alertModalMessage) {
            alertModalMessage.textContent = mensagem;
        }
        
        alertModal.show();
    }
}

/**
 * Exibe um modal de confirmação e retorna uma promessa com o resultado
 * @param {string} mensagem - Mensagem a ser exibida
 * @param {string} titulo - Título do modal (opcional)
 * @return {Promise<boolean>} - Promessa que resolve para true (confirmado) ou false (cancelado)
 */
function showConfirm(mensagem, titulo = 'Confirmação') {
    return new Promise((resolve) => {
        if (!confirmModal) {
            // Fallback para confirm nativo se o modal não estiver disponível
            const result = confirm(mensagem);
            resolve(result);
            return;
        }
        
        const confirmModalTitle = document.getElementById('confirmModalTitle');
        const confirmModalMessage = document.getElementById('confirmModalMessage');
        
        if (confirmModalTitle) {
            confirmModalTitle.innerHTML = `<i class="fas fa-question-circle me-2"></i>${titulo}`;
        }
        
        if (confirmModalMessage) {
            confirmModalMessage.textContent = mensagem;
        }
        
        // Armazena o callback para ser chamado quando o usuário interagir com o modal
        lastConfirmCallback = resolve;
        
        confirmModal.show();
    });
}

/**
 * Obtém a classe de cor de fundo baseada no tipo de alerta
 * @param {string} tipo - Tipo de alerta
 * @return {string} - Classe CSS Bootstrap
 */
function getBgClass(tipo) {
    switch (tipo) {
        case 'success': return 'success';
        case 'error': return 'danger';
        case 'warning': return 'warning';
        case 'info': return 'info';
        default: return 'primary';
    }
}

/**
 * Obtém a classe de ícone baseada no tipo de alerta
 * @param {string} tipo - Tipo de alerta
 * @return {string} - Classe de ícone Font Awesome
 */
function getIconClass(tipo) {
    switch (tipo) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info': return 'fa-info-circle';
        default: return 'fa-bell';
    }
}

// Verificar se todos os elementos necessários existem
if (!dosadoraCardTemplate) {
    console.error('Erro: Template de dosadora não encontrado no DOM');
    // Criar uma mensagem de erro para o usuário
    if (dosadorasContainer) {
        dosadorasContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Erro: Template HTML para dosadoras não encontrado.
                </div>
            </div>
        `;
    }
}

// Modal de configuração
let configModal = null;
const configModalElement = document.getElementById('configModal');
if (configModalElement) {
    configModal = new bootstrap.Modal(configModalElement);
} else {
    console.error('Erro: Modal de configuração não encontrado no DOM');
}

let currentDosadoraId = null;

// Verifica se o ID da loja foi fornecido
if (!lojaId) {
    window.location.href = 'index.html';
}

// Atualiza o código da loja na interface
if (lojaCodigoElement) lojaCodigoElement.textContent = lojaId;
if (lojaTituloElement) lojaTituloElement.textContent = `Loja ${lojaId} - Gerenciamento de Dispositivos`;

/**
 * Formata uma data timestamp para exibição amigável
 * @param {number|string} timestamp - Timestamp em milissegundos ou segundos
 * @return {string} Data formatada
 */
function formatarData(timestamp) {
    console.log("formatarData - Valor original:", timestamp, typeof timestamp);
    
    try {
        // Se for uma string, converter para número
        if (typeof timestamp === 'string') {
            timestamp = Number(timestamp);
            console.log("Convertido de string para número:", timestamp);
        }
        
        // Se não for um número, tentar converter
        if (typeof timestamp !== 'number') {
            timestamp = parseInt(timestamp);
        }
        
        // Verificar se é NaN após conversão
        if (isNaN(timestamp)) {
            console.error("Timestamp inválido (NaN):", timestamp);
            return "Data inválida";
        }
        
        // Se o timestamp for pequeno demais ou grande demais, é provavelmente inválido
        if (timestamp <= 0) {
            console.error("Timestamp negativo ou zero:", timestamp);
            return "Data inválida";
        }
        
        // CORREÇÃO PARA DATAS EM SEGUNDOS VS MILISSEGUNDOS:
        // Se o timestamp estiver em segundos (menos de 13 dígitos)
        // Por exemplo, 2095209824 = segundos (2036) vs 1695209824000 = ms (2023)
        const timestampDate = new Date(timestamp);
        const timestampYear = timestampDate.getFullYear();
        
        console.log(`Convertido para data: ${timestampDate}, ano: ${timestampYear}`);
        
        // Se o ano for 1970 ou uma data inválida (como NaN), provavelmente tem um problema
        if (timestampYear === 1970 || isNaN(timestampYear)) {
            // Tentar multiplicar por 1000 para converter de segundos para ms
            const newDate = new Date(timestamp * 1000);
            const newYear = newDate.getFullYear();
            
            // Se ainda for 1970 ou inválido, o timestamp está realmente incorreto
            if (newYear === 1970 || isNaN(newYear)) {
                console.error("Timestamp produz data inválida mesmo após ajuste");
                return "Data inválida";
            }
            
            // Senão, atualizamos o timestamp e a data
            timestamp = timestamp * 1000;
            console.log("Timestamp ajustado para ms:", timestamp);
            timestampDate = new Date(timestamp);
        }
        
    const hoje = new Date();
    
    // Verifica se é hoje
        if (timestampDate.toDateString() === hoje.toDateString()) {
            return `Hoje, ${timestampDate.getHours().toString().padStart(2, '0')}:${timestampDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Verifica se é ontem
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
        if (timestampDate.toDateString() === ontem.toDateString()) {
            return `Ontem, ${timestampDate.getHours().toString().padStart(2, '0')}:${timestampDate.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Caso contrário, retorna a data completa
        return `${timestampDate.getDate().toString().padStart(2, '0')}/${(timestampDate.getMonth() + 1).toString().padStart(2, '0')}/${timestampDate.getFullYear()} ${timestampDate.getHours().toString().padStart(2, '0')}:${timestampDate.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
        console.error("Erro ao formatar data:", error, "para timestamp:", timestamp);
        return "Data inválida";
    }
}

// Função para determinar o status da loja
function determinarStatus(loja) {
    // Retornar diretamente o status recebido do Firebase, sem verificações
    if (loja.pc_status && loja.pc_status.status) {
        // Usa o status definido diretamente no Firebase
        if (loja.pc_status.status === "Online") {
            return { status: "Online", classe: "bg-success", indicador: "status-online" };
        } else {
            return { status: "Offline", classe: "bg-danger", indicador: "status-offline" };
        }
    }
    
    // Valor padrão se não houver status definido
    return { status: "Indefinido", classe: "bg-secondary", indicador: "status-undefined" };
}

// Função para criar um card de lavadora
function criarCardLavadora(id, dados) {
    // Clona o template
    const card = lavadoraCardTemplate.content.cloneNode(true);
    
    // Preenche os dados
    const deviceIdElement = card.querySelector('.device-id');
    if (deviceIdElement) {
        deviceIdElement.textContent = id;
    }
    
    // Status de conexão - não usa verificações de tempo
    const statusBadge = card.querySelector('.device-status');
    const statusIndicator = card.querySelector('.status-indicator');
    
    // Referências aos textos de status
    const lavadoraStatusText = card.querySelector('.lavadora-status-text');
    const dosadoraStatusText = card.querySelector('.dosadora-status-text');
    
    // Atualiza o status da lavadora no texto informativo
    if (lavadoraStatusText) {
        if (dados.lavadoraStatus === 'online') {
            lavadoraStatusText.textContent = 'Online';
            lavadoraStatusText.className = 'lavadora-status-text text-success';
        } else if (dados.lavadoraStatus === 'offline') {
            lavadoraStatusText.textContent = 'Offline';
            lavadoraStatusText.className = 'lavadora-status-text text-danger';
        } else {
            lavadoraStatusText.textContent = 'Desconhecido';
            lavadoraStatusText.className = 'lavadora-status-text text-secondary';
        }
    }
    
    // Atualiza o status da dosadora no texto informativo
    if (dosadoraStatusText) {
        if (dados.dosadoraStatus === 'online') {
            dosadoraStatusText.textContent = 'Online';
            dosadoraStatusText.className = 'dosadora-status-text text-success';
        } else if (dados.dosadoraStatus === 'offline') {
            dosadoraStatusText.textContent = 'Offline';
            dosadoraStatusText.className = 'dosadora-status-text text-danger';
        } else {
            dosadoraStatusText.textContent = 'Desconhecido';
            dosadoraStatusText.className = 'dosadora-status-text text-secondary';
        }
    }
    
    // Status de liberação da lavadora - apenas mostra status em casos específicos
    if (dados.liberando === true) {
        statusBadge.textContent = 'Liberando...';
        statusBadge.className = 'badge bg-info device-status';
        statusIndicator.className = 'status-indicator status-warning';
    } else if (dados.status === true) {
        statusBadge.textContent = 'Liberada';
        statusBadge.className = 'badge bg-success device-status';
        statusIndicator.className = 'status-indicator status-online';
    } else if (dados.offline === true) {
        // Mostra offline apenas se for explicitamente definido após uma tentativa de liberação
        statusBadge.textContent = 'Offline';
        statusBadge.className = 'badge bg-danger device-status';
        statusIndicator.className = 'status-indicator status-offline';
    } else {
        // Não mostra nenhum status inicial
        statusBadge.textContent = '';
        statusBadge.className = 'd-none';
        statusIndicator.className = 'd-none';
    }
    
    // Obtém referência ao botão de liberar
    const btnLiberar = card.querySelector('.btn-aplicar');
    
    // Valores atuais
    const amacianteSelect = card.querySelector('.amaciante-select');
    const dosagemSelect = card.querySelector('.dosagem-select');
    
    // Botão de liberar
    const btnAplicar = card.querySelector('.btn-aplicar');
    btnAplicar.addEventListener('click', () => {
        
        const amaciante = parseInt(amacianteSelect.value);
        const dosagem = parseInt(dosagemSelect.value);
        
        // Configuração para registro no Firestore
        const configuracao = {
            amaciante: amaciante,
            dosagem: dosagem
        };
        
        // Atualiza o botão para mostrar estado de aguardando
        btnAplicar.disabled = true;
        btnAplicar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Aguardando...';
        
        // Atualiza no Firebase
        const lavadoraRef = database.ref(`/${lojaId}/dosadora_01/${id}`);
        
        // Primeiro, enviamos o comando de amaciante (softener)
        let softenerEndpoint = '';
        if (amaciante === 1) {
            softenerEndpoint = 'softener1'; // Floral
        } else if (amaciante === 2) {
            softenerEndpoint = 'softener2'; // Sport
        } else {
            softenerEndpoint = 'softener0'; // Sem amaciante
        }
        
        // Depois, enviamos o comando de dosagem combinado com amaciante
        let dosagemEndpoint = '';
        if (amaciante === 1) {
            dosagemEndpoint = dosagem === 1 ? 'am01-1' : 'am01-2';
        } else if (amaciante === 2) {
            dosagemEndpoint = dosagem === 1 ? 'am02-1' : 'am02-2';
        }
        
        // Atualiza os dados no Firebase
        lavadoraRef.update({
            amaciante: amaciante,
            dosagem: dosagem,
            softener_endpoint: softenerEndpoint,
            dosagem_endpoint: dosagemEndpoint
        }).then(() => {
            // Atualiza o status da lavadora para true para liberar a operação
            const lavadoraStatusRef = database.ref(`/${lojaId}/lavadoras/${id}`);
            return lavadoraStatusRef.set(true);
        }).then(() => {
            // Define o status como "liberando" no Firebase
            const statusLavadoraRef = database.ref(`/${lojaId}/status/lavadoras/${id}`);
            return statusLavadoraRef.set('liberando');
        }).then(() => {
            // Atualiza o status visual no card
            statusBadge.textContent = 'Liberando...';
            statusBadge.className = 'badge bg-info device-status';
            statusIndicator.className = 'status-indicator status-warning';
            
            // Configura um listener para monitorar mudanças no status da lavadora
            const statusRef = database.ref(`/${lojaId}/status/lavadoras/${id}`);
            const statusListener = statusRef.on('value', (snapshot) => {
                const status = snapshot.val();
                const cardElement = btnAplicar.closest('.card');
                if (!cardElement) return;
                
                const lavadoraStatusText = cardElement.querySelector('.lavadora-status-text');
                
                if (status === 'online') {
                    statusBadge.textContent = 'Liberada';
                    statusBadge.className = 'badge bg-success device-status';
                    statusIndicator.className = 'status-indicator status-online';
                    
                    // Reabilita o botão após a liberação bem-sucedida
                    btnAplicar.disabled = false;
                    btnAplicar.innerHTML = '<i class="fas fa-unlock me-2"></i>Liberar';
                    
                    if (lavadoraStatusText) {
                        lavadoraStatusText.textContent = 'Online';
                        lavadoraStatusText.className = 'lavadora-status-text text-success';
                    }
                    
                    // Registra a operação no Firestore apenas quando houver confirmação
                    registrarLiberacaoLavadora(lojaId, id, {
                        ...configuracao,
                        status: 'sucesso'
                    }).catch(error => {
                        console.error(`Erro ao registrar liberação de lavadora no Firestore: ${error.message}`);
                    });
                    
                    showAlert(`Lavadora ${id} liberada com sucesso!`, 'Sucesso', 'success', true);
                    // Não removemos o listener para continuar monitorando mudanças
                } else if (status === 'offline') {
                    statusBadge.textContent = 'Offline';
                    statusBadge.className = 'badge bg-danger device-status';
                    statusIndicator.className = 'status-indicator status-offline';
                    
                    // Reabilita o botão em caso de falha
                    btnAplicar.disabled = false;
                    btnAplicar.innerHTML = '<i class="fas fa-unlock me-2"></i>Liberar';
                    
                    if (lavadoraStatusText) {
                        lavadoraStatusText.textContent = 'Offline';
                        lavadoraStatusText.className = 'lavadora-status-text text-danger';
                    }
                    showAlert(`Falha ao liberar lavadora ${id}. Dispositivo offline.`, 'Erro', 'error');
                    // Não removemos o listener para continuar monitorando mudanças
                } else if (status === 'liberando') {
                    // Mantém o botão desabilitado e com texto de "Aguardando..."
                    btnAplicar.disabled = true;
                    btnAplicar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Aguardando...';
                    
                    if (lavadoraStatusText) {
                        lavadoraStatusText.textContent = 'Liberando...';
                        lavadoraStatusText.className = 'lavadora-status-text text-info';
                    }
                }
            });
            
            // Configura um listener para monitorar mudanças no status da dosadora
            const dosadoraStatusRef = database.ref(`/${lojaId}/status/dosadoras/${id}`);
            const dosadoraStatusListener = dosadoraStatusRef.on('value', (snapshot) => {
                const status = snapshot.val();
                const cardElement = btnAplicar.closest('.card');
                if (!cardElement) return;
                
                const dosadoraStatusText = cardElement.querySelector('.dosadora-status-text');
                if (!dosadoraStatusText) return;
                
                if (status === 'online') {
                    dosadoraStatusText.textContent = 'Online';
                    dosadoraStatusText.className = 'dosadora-status-text text-success';
                } else if (status === 'offline') {
                    dosadoraStatusText.textContent = 'Offline';
                    dosadoraStatusText.className = 'dosadora-status-text text-danger';
                } else if (status === 'liberando') {
                    dosadoraStatusText.textContent = 'Liberando...';
                    dosadoraStatusText.className = 'dosadora-status-text text-info';
                }
            });
            
            // Também atualizamos o status da dosadora para 'liberando'
            const dosadoraStatusUpdateRef = database.ref(`/${lojaId}/status/dosadoras/${id}`);
            dosadoraStatusUpdateRef.set('liberando');
        }).catch(error => {
            showAlert(`Erro ao liberar lavadora: ${error.message}`, 'Erro', 'error');
        });
    });
    
    return card;
}

// Função para criar um card de secadora
function criarCardSecadora(id, dados) {
    // Clona o template
    const card = secadoraCardTemplate.content.cloneNode(true);
    
    // Adiciona classe única ao card para facilitar a identificação
    const cardDiv = card.querySelector('.card');
    if (cardDiv) {
        cardDiv.classList.add(`card-secadora-${id}`);
    }
    
    // Preenche os dados
    card.querySelector('.device-id').textContent = id;
    
    // Esconde a bolinha indicadora de status para secadoras
    const statusIndicator = card.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.style.display = 'none';
    }
    
    // Status
    const statusBadge = card.querySelector('.device-status');
    
    // Verificar se algum dos tempos está ativo
    let tempoAtivo = null;
    let statusAtivo = false;
    
    for (const tempo in dados) {
        if (tempo.startsWith('_') && dados[tempo] === true) {
            tempoAtivo = tempo;
            statusAtivo = true;
            break;
        }
    }
    
    // Status da secadora (online, offline, liberando)
    const secadoraStatus = dados.secadoraStatus || '';
    
    // Adicionar texto de status da secadora
    const statusContainer = card.querySelector('.secadora-status-container');
    if (statusContainer) {
        statusContainer.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <small>Status:</small>
                <span class="secadora-status-text ${
                    secadoraStatus === 'online' ? 'text-success' : 
                    secadoraStatus === 'offline' ? 'text-danger' : 
                    secadoraStatus === 'liberando' ? 'text-info' : 'text-secondary'
                }">
                    ${
                        secadoraStatus === 'online' ? 'Online' : 
                        secadoraStatus === 'offline' ? 'Offline' : 
                        secadoraStatus === 'liberando' ? 'Liberando...' : 'Desconhecido'
                    }
                </span>
            </div>
        `;
    }
    
    // Atualiza o status visual
    // Regra 1: Se o status for "online", a bolinha deve ser VERDE independente de outros fatores
    if (secadoraStatus === 'online') {
        // Se o status for online, a bolinha deve ser SEMPRE verde
        
        if (statusAtivo) {
            // Se tiver algum tempo ativo, mostra como liberada
            statusBadge.textContent = 'Liberada';
            statusBadge.className = 'badge bg-success device-status';
        } else {
            // Se não tiver tempo ativo, mostra como disponível mas mantém o indicador verde
            statusBadge.textContent = 'Disponível';
            statusBadge.className = 'badge bg-secondary device-status';
        }
    } else if (secadoraStatus === 'liberando') {
        // Se estiver liberando, mostra o status de liberando
        statusBadge.textContent = 'Liberando...';
        statusBadge.className = 'badge bg-info device-status';
    } else if (secadoraStatus === 'offline') {
        // Se estiver offline, mostra o status de offline
        statusBadge.textContent = 'Offline';
        statusBadge.className = 'badge bg-danger device-status';
    } else if (statusAtivo) {
        // Se não tem status definido mas tem tempo ativo
        statusBadge.textContent = 'Liberada';
        statusBadge.className = 'badge bg-success device-status';
    } else {
        // Caso contrário, mostra como disponível
        statusBadge.textContent = 'Disponível';
        statusBadge.className = 'badge bg-secondary device-status';
    }
    
    // Tempo selecionado
    const tempoSelect = card.querySelector('.tempo-select');
    
    // Se houver um tempo ativo, selecionamos ele no dropdown
    if (tempoAtivo) {
        tempoSelect.value = tempoAtivo;
        
        // Desabilita o select se estiver em andamento
        tempoSelect.disabled = statusAtivo;
    }
    
    // Botão de iniciar
    const btnIniciar = card.querySelector('.btn-iniciar');
    
    // Se já estiver iniciada ou liberando, desabilita o botão
    if (statusAtivo || secadoraStatus === 'liberando') {
        btnIniciar.disabled = true;
        btnIniciar.innerHTML = secadoraStatus === 'liberando' ? 
            '<i class="fas fa-spinner fa-spin me-2"></i>Liberando...' : 
            '<i class="fas fa-check-circle me-2"></i>Em andamento';
    }
    
    // Adiciona um listener para monitorar o status da secadora
    const statusSecadoraRef = database.ref(`/${lojaId}/status/secadoras/${id}`);
    statusSecadoraRef.on('value', (snapshot) => {
        const statusSecadora = snapshot.val();
        
        // Atualiza o texto do status
        if (statusContainer) {
            let statusText = `
                <div class="d-flex justify-content-between mb-2">
                    <small>Status:</small>
                    <span class="secadora-status-text `;
            
            if (statusSecadora === 'online') {
                statusText += 'text-success">Online</span></div>';
                
                // O badge só muda se não estiver ativo
                if (!statusAtivo) {
                    statusBadge.textContent = 'Disponível';
                    statusBadge.className = 'badge bg-secondary device-status';
                }
            } else if (statusSecadora === 'offline') {
                statusText += 'text-danger">Offline</span></div>';
                statusBadge.textContent = 'Offline';
                statusBadge.className = 'badge bg-danger device-status';
            } else if (statusSecadora === 'liberando') {
                statusText += 'text-info">Processando</span></div>';
                statusBadge.textContent = 'Liberando...';
                statusBadge.className = 'badge bg-info device-status';
            } else {
                statusText += 'text-secondary">Desconhecido</span></div>';
                statusBadge.textContent = 'Desconhecido';
                statusBadge.className = 'badge bg-secondary device-status';
            }
            
            statusContainer.innerHTML = statusText;
        }
    });
    
    // Adiciona um listener para monitorar mudanças no valor da secadora (ativada/desativada)
    const secadoraRef = database.ref(`/${lojaId}/secadoras/${id}`);
    secadoraRef.on('value', (snapshot) => {
        const secadoraDados = snapshot.val();
        
        // Verificamos se algum dos tempos está ativo
        let tempoAtivo = null;
        let statusAtivo = false;
        
        for (const tempo in secadoraDados) {
            if (tempo.startsWith('_') && secadoraDados[tempo] === true) {
                tempoAtivo = tempo;
                statusAtivo = true;
                break;
            }
        }
        
        // Se estiver ativa, atualiza o botão
        if (statusAtivo) {
            btnIniciar.disabled = true;
            btnIniciar.innerHTML = '<i class="fas fa-check-circle me-2"></i>Liberada';
            
            // Seleciona o tempo ativo no dropdown
            if (tempoAtivo) {
                tempoSelect.value = tempoAtivo;
                tempoSelect.disabled = true;
            }
            
            // Atualiza o badge para 'Liberada'
            statusBadge.textContent = 'Liberada';
            statusBadge.className = 'badge bg-success device-status';
        } else {
            // Verifica se não está no estado 'liberando' antes de reativar o botão
            const statusRef = database.ref(`/${lojaId}/status/secadoras/${id}`);
            statusRef.once('value').then(statusSnapshot => {
                const currentStatus = statusSnapshot.val();
                if (currentStatus !== 'liberando') {
                    btnIniciar.disabled = false;
                    btnIniciar.innerHTML = '<i class="fas fa-play-circle me-2"></i>Liberar';
                    tempoSelect.disabled = false;
                    
                    // Se o status for online, mantém a bolinha verde mas atualiza o badge
                    if (currentStatus === 'online') {
                        statusBadge.textContent = 'Disponível';
                        statusBadge.className = 'badge bg-secondary device-status';
                    }
                }
            });
        }
    });
    
    btnIniciar.addEventListener('click', () => {
        const tempo = tempoSelect.value;
        
        // Desabilita o botão enquanto processa
        btnIniciar.disabled = true;
        btnIniciar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Aguardando...';
        
        // Referência ao nó específico para o ID e tempo selecionado
        const secadoraRef = database.ref(`/${lojaId}/secadoras/${id}${tempo}`);
        
        // Verifica se o nó existe antes de tentar atualizá-lo
        secadoraRef.once('value')
            .then(snapshot => {
                if (snapshot.exists()) {
                    // O nó existe, atualizamos para true como na função das lavadoras
                    return secadoraRef.set(true);
                } else {
                    // Exibe um alerta e um console log para depuração
                    console.warn(`Nó secadoras/${id}${tempo} não encontrado no Firebase.`);
                    throw new Error(`Secadora ${id} com tempo ${tempo.replace('_', '')} minutos não está configurada no sistema.`);
                }
            })
            .then(() => {
                // Atualiza o status da secadora para 'liberando' no Firebase
                const statusRef = database.ref(`/${lojaId}/status/secadoras/${id}`);
                return statusRef.set('liberando');
            })
            .then(() => {
                console.log(`Secadora ${id} iniciada com tempo ${tempo.replace('_', '')} minutos`);
                
                // Atualiza o visual para iniciada/liberando
                btnIniciar.disabled = true;
                btnIniciar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Aguardando...';
                tempoSelect.disabled = true;
                
                // Atualiza o status visual no card
                statusBadge.textContent = 'Liberando...';
                statusBadge.className = 'badge bg-info device-status';
                
                // Configura um listener para monitorar o nó de status da secadora
                const statusSecadoraRef = database.ref(`/${lojaId}/status/secadoras/${id}`);
                const statusListener = statusSecadoraRef.on('value', (snapshot) => {
                    const statusSecadora = snapshot.val();
                    
                    if (statusSecadora === 'online') {
                        // A secadora confirmou que recebeu o comando
                        console.log(`Secadora ${id} com tempo ${tempo} está online e ativa`);
                        
                        // Registra a operação no Firestore apenas quando houver confirmação
                        const configuracao = {
                            tempo: tempo.replace('_', ''),
                            status: 'sucesso'
                        };
                        registrarLiberacaoSecadora(lojaId, id, configuracao)
                        .catch(error => {
                            console.error(`Erro ao registrar liberação de secadora no Firestore: ${error.message}`);
                        });
                        
                        // Atualiza o status visual para online/liberada
                        statusBadge.textContent = 'Liberada';
                        statusBadge.className = 'badge bg-success device-status';
                        
                        btnIniciar.innerHTML = '<i class="fas fa-check-circle me-2"></i>Liberada';
                        
                        // Mostra alerta de sucesso
                        showAlert(`Secadora ${id} liberada com tempo ${tempo.replace('_', '')} minutos`, 'Sucesso', 'success', true);
                    } else if (statusSecadora === 'offline') {
                        // Houve um problema na comunicação
                        console.log(`Secadora ${id} com tempo ${tempo} está offline`);
                        
                        // Atualiza o status visual para offline
                        statusBadge.textContent = 'Offline';
                        statusBadge.className = 'badge bg-danger device-status';
                        
                        // Restaura o botão para permitir nova tentativa
                        btnIniciar.disabled = false;
                        btnIniciar.innerHTML = '<i class="fas fa-play-circle me-2"></i>Liberar';
                        tempoSelect.disabled = false;
                        
                        // Mostra alerta de falha
                        showAlert(`Falha ao iniciar secadora ${id}. Dispositivo offline.`, 'Erro', 'error');
                    }
                });
                
                // Configura um listener para monitorar mudanças no status do nó específico
                const nodeListener = secadoraRef.on('value', (snapshot) => {
                    const secadoraStatus = snapshot.val();
                    
                    // Se o status voltar para false, a secadora terminou o ciclo
                    if (secadoraStatus === false) {
                        console.log(`Secadora ${id} com tempo ${tempo} concluiu o ciclo`);
                        
                        // Restaura o visual para disponível
                        btnIniciar.disabled = false;
                        btnIniciar.innerHTML = '<i class="fas fa-play-circle me-2"></i>Liberar';
                        tempoSelect.disabled = false;
                        
                        // Atualiza o status visual no card
                        statusBadge.textContent = 'Disponível';
                        statusBadge.className = 'badge bg-secondary device-status';
                        
                        // Remove os listeners
                        secadoraRef.off('value', nodeListener);
                        database.ref(`/${lojaId}/status/secadoras/${id}`).off('value', statusListener);
                    }
                });
            })
            .catch(error => {
                console.error(`Erro ao iniciar secadora ${id}:`, error);
                showAlert(`Erro ao iniciar secadora: ${error.message}`, 'Erro', 'error');
                
                // Restaura o botão
                btnIniciar.disabled = false;
                btnIniciar.innerHTML = '<i class="fas fa-play-circle me-2"></i>Liberar';
                tempoSelect.disabled = false;
            });
    });
    
    return card;
}

// Função para criar um card de dosadora
function criarCardDosadora(id, dados) {
    try {
    // Clona o template
    const card = dosadoraCardTemplate.content.cloneNode(true);
        
        // Adiciona classe única ao card para facilitar a identificação
        const cardDiv = card.querySelector('.card');
        if (cardDiv) {
            cardDiv.classList.add(`card-dosadora-${id}`);
        }
    
    // Preenche os dados
        const deviceIdElement = card.querySelector('.device-id');
        if (deviceIdElement) {
            deviceIdElement.textContent = id;
        }
    
    // Obtém referências aos elementos de status
    const statusBadge = card.querySelector('.device-status');
    const statusIndicator = card.querySelector('.status-indicator');
        
        // Tempo de elementos
        const tempoSabaoElement = card.querySelector('.tempo-sabao');
        const tempoFloralElement = card.querySelector('.tempo-floral');
        const tempoSportElement = card.querySelector('.tempo-sport');
    
    // Inicialmente não mostra nenhum status
        if (statusBadge) {
    statusBadge.textContent = '';
    statusBadge.className = 'd-none';
        }
        
        if (statusIndicator) {
    statusIndicator.className = 'd-none';
        }
        
        // Configura um listener para monitorar mudanças nos tempos da dosadora
        const dosadoraRef = database.ref(`/${lojaId}/dosadora_01/${id}`);
        dosadoraRef.on('value', (snapshot) => {
            const dados = snapshot.val() || {};
            
            // Atualiza os tempos mostrados no card
            if (tempoSabaoElement) {
                // Usa o valor que vier do ESP (tempo_atual_sabao) ou o valor configurado (ajuste_tempo_sabao)
                if (dados.tempo_atual_sabao !== undefined) {
                    tempoSabaoElement.textContent = dados.tempo_atual_sabao;
                } else if (dados.ajuste_tempo_sabao !== undefined) {
                    tempoSabaoElement.textContent = dados.ajuste_tempo_sabao;
                } else {
                    tempoSabaoElement.textContent = '0';
                }
            }
            
            if (tempoFloralElement) {
                // Usa o valor que vier do ESP (tempo_atual_floral) ou o valor configurado (ajuste_tempo_floral)
                if (dados.tempo_atual_floral !== undefined) {
                    tempoFloralElement.textContent = dados.tempo_atual_floral;
                } else if (dados.ajuste_tempo_floral !== undefined) {
                    tempoFloralElement.textContent = dados.ajuste_tempo_floral;
                } else {
                    tempoFloralElement.textContent = '0';
                }
            }
            
            if (tempoSportElement) {
                // Usa o valor que vier do ESP (tempo_atual_sport) ou o valor configurado (ajuste_tempo_sport)
                if (dados.tempo_atual_sport !== undefined) {
                    tempoSportElement.textContent = dados.tempo_atual_sport;
                } else if (dados.ajuste_tempo_sport !== undefined) {
                    tempoSportElement.textContent = dados.ajuste_tempo_sport;
                } else {
                    tempoSportElement.textContent = '0';
                }
            }
            
            console.log(`Dosadora ${id} - Dados atualizados:`, dados);
        });
    
    // Configura um listener para monitorar o status da dosadora
    const statusRef = database.ref(`/${lojaId}/status/dosadoras/${id}`);
    statusRef.on('value', (snapshot) => {
            if (!statusBadge || !statusIndicator) return;
            
        const status = snapshot.val();
        
        if (status === 'online') {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'badge bg-success device-status';
            statusIndicator.className = 'status-indicator status-online';
        } else if (status === 'offline') {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'badge bg-danger device-status';
            statusIndicator.className = 'status-indicator status-offline';
        } else if (status === 'processando') {
            statusBadge.textContent = 'Processando...';
            statusBadge.className = 'badge bg-info device-status';
            statusIndicator.className = 'status-indicator status-warning';
        } else {
            statusBadge.textContent = '';
            statusBadge.className = 'd-none';
            statusIndicator.className = 'd-none';
        }
    });
    
    // Bomba selecionada
    const bombaSelect = card.querySelector('.bomba-select');
    
    // Botão de acionar bomba
    const btnAcionar = card.querySelector('.btn-acionar');
        if (btnAcionar && bombaSelect) {
    btnAcionar.addEventListener('click', () => {
        const bomba = parseInt(bombaSelect.value);
                
                // Desabilita o botão enquanto processa
                btnAcionar.disabled = true;
                btnAcionar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Acionando...';
                
                // Atualiza o status para 'processando'
                const statusRef = database.ref(`/${lojaId}/status/dosadoras/${id}`);
                statusRef.set('processando');
        
        // Atualiza no Firebase
        const dosadoraRef = database.ref(`/${lojaId}/dosadora_01/${id}`);
        dosadoraRef.update({
            bomba: bomba
        }).then(() => {
                    console.log(`Comando para acionar bomba ${bomba} enviado para dosadora ${id}`);
                    
                    // Configura um listener para monitorar quando a bomba retornar para 0
                    // Este listener verifica quando o ESP completou a operação
                    const bombaListener = dosadoraRef.child('bomba').on('value', (snapshot) => {
                        const bombaValue = snapshot.val();
                        
                        if (bombaValue === 0) {
                            // A operação foi concluída pelo ESP
                            console.log(`Bomba ${bomba} da dosadora ${id} foi acionada com sucesso`);
                            
                            // Registra a operação no Firestore apenas quando houver confirmação
                            const configuracao = {
                                bomba: bomba,
                                status: 'sucesso'
                            };
                            registrarAcionamentoDosadora(lojaId, id, configuracao)
                            .catch(error => {
                                console.error(`Erro ao registrar acionamento de dosadora no Firestore: ${error.message}`);
                            });
                            
                            // Mostra feedback só agora que a operação está realmente concluída
                            showAlert(`Bomba ${bomba} acionada com sucesso na dosadora ${id}`, 'Sucesso', 'success', true);
                            
                            // Atualiza o status para 'online'
                            statusRef.set('online');
                            
                            // Restaura o botão
                            btnAcionar.disabled = false;
                            btnAcionar.innerHTML = '<i class="fas fa-tint me-2"></i>Acionar Bomba';
                            
                            // Remove o listener para não continuar monitorando
                            dosadoraRef.child('bomba').off('value', bombaListener);
                        }
                    }, (error) => {
                        console.error(`Erro ao monitorar estado da bomba: ${error.message}`);
                        
                        // Restaura o botão em caso de erro
                        btnAcionar.disabled = false;
                        btnAcionar.innerHTML = '<i class="fas fa-tint me-2"></i>Acionar Bomba';
                        
                        // Atualiza o status para 'online'
                        statusRef.set('online');
                    });
                    
                    // Define um timeout de 30 segundos para o caso de o ESP não responder
                    setTimeout(() => {
                        // Verifica se o botão ainda está desabilitado
                        if (btnAcionar.disabled) {
                            console.warn(`Timeout de 30 segundos atingido para dosadora ${id}`);
                            
                            // Restaura o botão
                            btnAcionar.disabled = false;
                            btnAcionar.innerHTML = '<i class="fas fa-tint me-2"></i>Acionar Bomba';
                            
                            // Atualiza o status para 'online'
                            statusRef.set('online');
                            
                            // Remove o listener
                            dosadoraRef.child('bomba').off('value', bombaListener);
                        }
                    }, 30000);
        }).catch(error => {
                    console.error(`Erro ao acionar bomba: ${error.message}`);
            showAlert(`Erro ao acionar bomba: ${error.message}`, 'Erro', 'error');
                    
                    // Restaura o botão
                    btnAcionar.disabled = false;
                    btnAcionar.innerHTML = '<i class="fas fa-tint me-2"></i>Acionar Bomba';
                    
                    // Atualiza o status para 'online'
                    statusRef.set('online');
        });
    });
        }
    
    // Botão de configurar tempos
    const btnConfigurar = card.querySelector('.btn-configurar');
        if (btnConfigurar) {
    btnConfigurar.addEventListener('click', () => {
        // Armazena o ID da dosadora atual
        currentDosadoraId = id;
        
        // Carrega os tempos atuais
        const dosadoraRef = database.ref(`/${lojaId}/dosadora_01/${id}`);
        dosadoraRef.once('value', snapshot => {
            const dados = snapshot.val() || {};
            
            // Preenche os campos do modal
                    const tempoSabao = document.getElementById('tempo-sabao');
                    const tempoFloral = document.getElementById('tempo-floral');
                    const tempoSport = document.getElementById('tempo-sport');
                    
                    // Usar os valores que já temos, com prioridade para tempo_atual_X, depois ajuste_tempo_X
                    if (tempoSabao) {
                        // Usar valores reais da máquina se disponíveis, ou valores configurados
                        tempoSabao.value = dados.tempo_atual_sabao !== undefined ? 
                                          dados.tempo_atual_sabao : 
                                          (dados.ajuste_tempo_sabao !== undefined ? dados.ajuste_tempo_sabao : 0);
                    }
                    
                    if (tempoFloral) {
                        tempoFloral.value = dados.tempo_atual_floral !== undefined ? 
                                           dados.tempo_atual_floral : 
                                           (dados.ajuste_tempo_floral !== undefined ? dados.ajuste_tempo_floral : 0);
                    }
                    
                    if (tempoSport) {
                        tempoSport.value = dados.tempo_atual_sport !== undefined ? 
                                          dados.tempo_atual_sport : 
                                          (dados.ajuste_tempo_sport !== undefined ? dados.ajuste_tempo_sport : 0);
                    }
            
            // Exibe o modal
                    if (typeof configModal !== 'undefined' && configModal && configModal.show) {
            configModal.show();
                    }
        });
    });
        }
        
        // Botão de consultar tempos
        const btnConsultar = card.querySelector('.btn-consultar');
        if (btnConsultar) {
            btnConsultar.addEventListener('click', () => {
                // Atualiza os elementos de tempo para mostrar "Consultando..."
                if (tempoSabaoElement) tempoSabaoElement.textContent = "Consultando...";
                if (tempoFloralElement) tempoFloralElement.textContent = "Consultando...";
                if (tempoSportElement) tempoSportElement.textContent = "Consultando...";
                
                // Atualiza no Firebase para solicitar consulta
                const dosadoraRef = database.ref(`/${lojaId}/dosadora_01/${id}`);
                dosadoraRef.update({
                    consulta_tempo: true
                }).then(() => {
                    console.log(`Solicitação de consulta de tempos enviada para dosadora ${id}`);
                    
                    // Atualiza o status para 'processando'
                    const statusRef = database.ref(`/${lojaId}/status/dosadoras/${id}`);
                    statusRef.set('processando');
                    
                    // A atualização dos tempos será feita pelo listener configurado acima
                }).catch(error => {
                    showAlert(`Erro ao solicitar consulta: ${error.message}`, 'Erro', 'error');
                    
                    // Restaura os valores anteriores em caso de erro
                    dosadoraRef.once('value', snapshot => {
                        const dados = snapshot.val() || {};
                        if (tempoSabaoElement) tempoSabaoElement.textContent = dados.tempo_atual_sabao || dados.ajuste_tempo_sabao || '0';
                        if (tempoFloralElement) tempoFloralElement.textContent = dados.tempo_atual_floral || dados.ajuste_tempo_floral || '0';
                        if (tempoSportElement) tempoSportElement.textContent = dados.tempo_atual_sport || dados.ajuste_tempo_sport || '0';
                    });
                });
            });
        }
        
        // Botão de testar conexão (se existir)
    const btnTestar = card.querySelector('.btn-testar');
        if (btnTestar) {
    btnTestar.addEventListener('click', () => {
        // Atualiza o status para 'processando' no Firebase
        const statusRef = database.ref(`/${lojaId}/status/dosadoras/${id}`);
        statusRef.set('processando')
            .then(() => {
                // Envia um comando de teste para a dosadora
                const testRef = database.ref(`/${lojaId}/dosadora_01/${id}/teste`);
                return testRef.set(Date.now());
            })
            .then(() => {
                console.log(`Comando de teste enviado para dosadora ${id}`);
            })
            .catch(error => {
                console.error(`Erro ao testar conexão com dosadora ${id}:`, error);
                showAlert(`Erro ao testar conexão: ${error.message}`, 'Erro', 'error');
                // Define o status como offline em caso de erro
                statusRef.set('offline');
            });
    });
        }
    
    return card;
    } catch (error) {
        console.error(`Erro ao criar card da dosadora ${id}:`, error);
        return null;
    }
}

// Função para criar um card de ar-condicionado
function criarCardAr(dados) {
    // Clona o template
    const card = arCardTemplate.content.cloneNode(true);
    
    // Adiciona classe única ao card para facilitar a identificação
    const cardDiv = card.querySelector('.card');
    if (cardDiv) {
        cardDiv.classList.add('card-ar-condicionado');
    }
    
    // Status
    const statusIndicator = card.querySelector('.status-indicator');
    const statusBadge = card.querySelector('.device-status');
    
    // Temperatura selecionada
    const temperaturaSelect = card.querySelector('.temperatura-select');
    
    // Se tiver dados, identifica qual temperatura está ativa
    let tempAtiva = null;
    if (dados) {
        // Verifica cada possível valor (18, 22, OFF)
        if (dados["18"] === true) {
            tempAtiva = "18";
        } else if (dados["22"] === true) {
            tempAtiva = "22"; 
        } else if (dados["OFF"] === true) {
            tempAtiva = "OFF";
        } else if (dados.temp) {
            // Compatibilidade com formato antigo
            tempAtiva = dados.temp;
        }
    }
    
    // Se tiver temperatura ativa, seleciona ela no dropdown
    if (tempAtiva) {
        temperaturaSelect.value = tempAtiva;
    }
    
    // Status do ar-condicionado (baseado no Firebase)
    const arStatus = dados && dados.status ? dados.status : '';
    
    // Atualiza status visual
    if (arStatus === 'online') {
        if (statusBadge) {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'badge bg-success device-status';
        }
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator status-online';
        }
    } else if (arStatus === 'offline') {
        if (statusBadge) {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'badge bg-danger device-status';
        }
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator status-offline';
        }
    }
    
    // Botão de aplicar temperatura
    const btnAplicarTemp = card.querySelector('.btn-aplicar-temp');
    if (btnAplicarTemp) {
    btnAplicarTemp.addEventListener('click', () => {
        const temperatura = temperaturaSelect.value;
        
            // Desabilita o botão enquanto processa
            btnAplicarTemp.disabled = true;
            btnAplicarTemp.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Aplicando...';
            
            // Atualiza o status para 'liberando' seguindo o padrão das secadoras
            const statusRef = database.ref(`/${lojaId}/status/ar_condicionado`);
            statusRef.set('liberando');
            
            // Atualiza o status visual
            if (statusBadge) {
                statusBadge.textContent = 'Liberando...';
                statusBadge.className = 'badge bg-info device-status';
            }
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator status-warning';
            }
            
            // Primeiro, desativa todos os nós (18, 22, OFF)
        const arRef = database.ref(`/${lojaId}/ar_condicionado`);
            
            // Verifica se o nó existe antes de atualizar
            const noRef = database.ref(`/${lojaId}/ar_condicionado/${temperatura}`);
            noRef.once('value')
                .then(snapshot => {
                    if (snapshot.exists() || ["18", "22", "OFF"].includes(temperatura)) {
                        // Desativa todas as temperaturas primeiro
                        const updates = {
                            "18": false,
                            "22": false,
                            "OFF": false
                        };
                        
                        // Depois define a temperatura escolhida como true
                        updates[temperatura] = true;
                        
                        return arRef.update(updates);
                    } else {
                        throw new Error(`Temperatura ${temperatura} não está configurada no sistema.`);
                    }
                })
                .then(() => {
                    console.log(`Comando enviado: Ar-condicionado configurado para ${temperatura}`);
                    
                    // Configura um listener para monitorar o status do ar-condicionado
                    const statusListener = statusRef.on('value', (snapshot) => {
                        const status = snapshot.val();
                        
                        // Se o ESP atualizar o status para 'online', significa que recebeu o comando
                        if (status === 'online') {
                            console.log(`Ar-condicionado configurado com sucesso para ${temperatura}`);
                            
                            // Mostra alerta de sucesso
                            showAlert(`Temperatura do ar-condicionado configurada para ${temperatura}`, 'Sucesso', 'success', true);
                            
                            // Atualiza o status visual
                            if (statusBadge) {
                                statusBadge.textContent = 'Online';
                                statusBadge.className = 'badge bg-success device-status';
                            }
                            if (statusIndicator) {
                                statusIndicator.className = 'status-indicator status-online';
                            }
                            
                            // Restaura o botão
                            btnAplicarTemp.disabled = false;
                            btnAplicarTemp.innerHTML = '<i class="fas fa-check-circle me-2"></i>Aplicar';
                            
                            // Remove o listener após receber a confirmação
                            statusRef.off('value', statusListener);
                        } 
                        // Se o ESP atualizar o status para 'offline', significa que não foi possível completar a operação
                        else if (status === 'offline') {
                            console.log(`Falha ao configurar ar-condicionado para ${temperatura}`);
                            
                            // Mostra alerta de erro
                            showAlert(`Falha ao configurar ar-condicionado. Dispositivo offline.`, 'Erro', 'error');
                            
                            // Atualiza o status visual
                            if (statusBadge) {
                                statusBadge.textContent = 'Offline';
                                statusBadge.className = 'badge bg-danger device-status';
                            }
                            if (statusIndicator) {
                                statusIndicator.className = 'status-indicator status-offline';
                            }
                            
                            // Restaura o botão
                            btnAplicarTemp.disabled = false;
                            btnAplicarTemp.innerHTML = '<i class="fas fa-check-circle me-2"></i>Aplicar';
                            
                            // Remove o listener após receber a confirmação
                            statusRef.off('value', statusListener);
                        }
                    });
                    
                    // Define um timeout de 30 segundos para o caso de o ESP não responder
                    setTimeout(() => {
                        // Verifica se o botão ainda está desabilitado
                        if (btnAplicarTemp.disabled) {
                            console.warn(`Timeout de 30 segundos atingido para ar-condicionado`);
                            
                            // Restaura o botão
                            btnAplicarTemp.disabled = false;
                            btnAplicarTemp.innerHTML = '<i class="fas fa-check-circle me-2"></i>Aplicar';
                            
                            // Atualiza o status para 'online' para permitir nova tentativa
                            statusRef.set('online');
                            
                            // Remove o listener
                            statusRef.off('value', statusListener);
                        }
                    }, 30000);
                })
                .catch(error => {
                    console.error(`Erro ao configurar ar-condicionado: ${error.message}`);
                    showAlert(`Erro ao configurar temperatura: ${error.message}`, 'Erro', 'error');
                    
                    // Restaura o botão
                    btnAplicarTemp.disabled = false;
                    btnAplicarTemp.innerHTML = '<i class="fas fa-check-circle me-2"></i>Aplicar';
                    
                    // Atualiza o status como online para permitir nova tentativa
                    statusRef.set('online');
        });
    });
    }
    
    return card;
}

// Função para carregar as lavadoras
function carregarLavadoras() {
    // Limpa mensagens de erro anteriores
    lavadorasContainer.innerHTML = '';
    
    // Adiciona o elemento de loading novamente se foi removido
    if (!document.getElementById('lavadoras-loading')) {
        const loadingElement = document.createElement('div');
        loadingElement.id = 'lavadoras-loading';
        loadingElement.className = 'col-12 text-center py-5';
        loadingElement.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2">Carregando lavadoras...</p>
        `;
        lavadorasContainer.appendChild(loadingElement);
    }
    
    // Referência � s lavadoras no Firebase
    const dosadorasRef = database.ref(`/${lojaId}/dosadora_01`);
    const lavadorasStatusRef = database.ref(`/${lojaId}/lavadoras`);
    const statusRef = database.ref(`/${lojaId}/status`);
    
    // Carrega tanto os dados da dosadora quanto o status das lavadoras e status online/offline
    Promise.all([
        dosadorasRef.once('value'),
        lavadorasStatusRef.once('value'),
        statusRef.once('value')
    ])
    .then(([dosadorasSnapshot, lavadorasSnapshot, statusSnapshot]) => {
        // Remove o elemento de loading
        const loadingElement = document.getElementById('lavadoras-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Verifica se existem lavadoras
        if (!dosadorasSnapshot.exists()) {
            lavadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhuma lavadora encontrada.
                    </div>
                </div>
            `;
            return;
        }
        
        // Obtém o status das lavadoras
        const statusLavadoras = lavadorasSnapshot.val() || {};
        
        // Obtém o status online/offline
        const onlineStatus = statusSnapshot.val() || {};
        
        // Itera sobre as lavadoras
        const lavadoras = dosadorasSnapshot.val() || {};
        
        // Verifica se há lavadoras para exibir
        if (Object.keys(lavadoras).length === 0) {
            lavadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhuma lavadora encontrada.
                    </div>
                </div>
            `;
            return;
        }
        
        // Limpa o container antes de adicionar os cards
        lavadorasContainer.innerHTML = '';
        
        for (const id in lavadoras) {
            const lavadora = lavadoras[id] || {};
            
            // Adiciona o status da lavadora aos dados
            lavadora.status = statusLavadoras[id] === true;
            
            // Adiciona o status da lavadora e da dosadora aos dados
            if (onlineStatus && onlineStatus.lavadoras && onlineStatus.lavadoras[id]) {
                lavadora.lavadoraStatus = onlineStatus.lavadoras[id];
                
                // Apenas definimos liberando após tentativa de liberação
                if (onlineStatus.lavadoras[id] === 'liberando') {
                    lavadora.liberando = true;
                }
            }
            
            // Adiciona o status da dosadora aos dados
            if (onlineStatus && onlineStatus.dosadoras && onlineStatus.dosadoras[id]) {
                lavadora.dosadoraStatus = onlineStatus.dosadoras[id];
            }
            
            try {
                const cardLavadora = criarCardLavadora(id, lavadora);
                lavadorasContainer.appendChild(cardLavadora);
            } catch (error) {
                console.error(`Erro ao criar card para lavadora ${id}:`, error);
            }
        }
    })
        .catch(error => {
            console.error("Erro ao carregar lavadoras:", error);
            lavadorasLoading.remove();
            lavadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar lavadoras: ${error.message}
                    </div>
                </div>
            `;
        });
}

// Função para carregar as secadoras
function carregarSecadoras() {
    // Como as secadoras têm uma estrutura diferente, vamos usar os IDs do array definido no código Arduino
    const secadorasIds = ["765", "876", "987"];
    
    // Tempos disponíveis para as secadoras
    const tempos = ["_15", "_30", "_45"];
    
    // Remove o elemento de loading
    if (secadorasLoading) {
    secadorasLoading.remove();
    }
    
    // Limpa o container antes de adicionar os cards
    if (secadorasContainer) {
        secadorasContainer.innerHTML = '';
    }
    
    // Carrega tanto os dados das secadoras quanto o status online/offline
    Promise.all([
        database.ref(`/${lojaId}/secadoras`).once('value'),
        database.ref(`/${lojaId}/status/secadoras`).once('value')
    ])
    .then(([secadorasSnapshot, statusSnapshot]) => {
        const secadorasData = secadorasSnapshot.val() || {};
        const statusData = statusSnapshot.val() || {};
    
    // Cria um card para cada secadora
    for (const id of secadorasIds) {
            // Para cada secadora, verificamos os possíveis nós (id_tempo)
            const statusDados = {
                // Adiciona status online/offline se existir
                secadoraStatus: statusData[id] || ''
            };
            
            // Verifica se existem nós para cada tempo
            for (const tempo of tempos) {
                const nodeKey = `${id}${tempo}`;
                if (secadorasData[nodeKey] !== undefined) {
                    // Agora o valor é boolean (true/false) diretamente
                    statusDados[tempo] = secadorasData[nodeKey] === true;
                }
            }
            
            try {
                const cardSecadora = criarCardSecadora(id, statusDados);
        secadorasContainer.appendChild(cardSecadora);
            } catch (error) {
                console.error(`Erro ao criar card para secadora ${id}:`, error);
            }
        }
        
        // Se nenhum card foi criado
        if (secadorasContainer.children.length === 0) {
            secadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhuma secadora encontrada.
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error("Erro ao carregar secadoras:", error);
        
        if (secadorasContainer) {
            secadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar secadoras: ${error.message}
                    </div>
                </div>
            `;
        }
    });
}

// Função para carregar as dosadoras
function carregarDosadoras() {
    // Os IDs das dosadoras são os mesmos das lavadoras no código Arduino
    const dosadorasIds = ["432", "543", "654"];
    
    // Verificar se o template de dosadora existe
    if (!dosadoraCardTemplate) {
        console.error("Erro: Template de dosadora não encontrado");
        if (dosadorasLoading) {
            dosadorasLoading.remove();
        }
        
        if (dosadorasContainer) {
            dosadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar dosadoras: Template HTML não encontrado
                    </div>
                </div>
            `;
        }
        return;
    }
    
    // Referência ao status das dosadoras no Firebase
    const statusRef = database.ref(`/${lojaId}/status/dosadoras`);
    
    // Carrega o status das dosadoras
    statusRef.once('value')
        .then(snapshot => {
            // Remove o elemento de loading
            if (dosadorasLoading) {
            dosadorasLoading.remove();
            }
            
            // Obtém o status das dosadoras
            const statusDosadoras = snapshot.val() || {};
            
            // Limpa o container antes de adicionar os cards
            if (dosadorasContainer) {
                dosadorasContainer.innerHTML = '';
            } else {
                console.error("Erro: Container de dosadoras não encontrado");
                return;
            }
            
            // Cria um card para cada dosadora
            for (const id of dosadorasIds) {
                const dados = {
                    status: statusDosadoras[id] || ''
                };
                
                try {
                const cardDosadora = criarCardDosadora(id, dados);
                    if (cardDosadora) {
                dosadorasContainer.appendChild(cardDosadora);
                    } else {
                        console.error(`Erro: Não foi possível criar o card para a dosadora ${id}`);
                    }
                } catch (error) {
                    console.error(`Erro ao criar card para dosadora ${id}:`, error);
                    dosadorasContainer.innerHTML += `
                        <div class="col-12 text-center py-2">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Erro ao criar card para dosadora ${id}: ${error.message}
                            </div>
                        </div>
                    `;
                }
            }
            
            // Se nenhum card foi criado
            if (dosadorasContainer.children.length === 0) {
                dosadorasContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Nenhuma dosadora encontrada.
                        </div>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error("Erro ao carregar status das dosadoras:", error);
            if (dosadorasLoading) {
            dosadorasLoading.remove();
            }
            
            if (dosadorasContainer) {
            dosadorasContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar dosadoras: ${error.message}
                    </div>
                </div>
            `;
            }
        });
}

// Função para carregar o ar-condicionado
function carregarAr() {
    // Carrega tanto os dados do ar-condicionado quanto o status online/offline
    Promise.all([
        database.ref(`/${lojaId}/ar_condicionado`).once('value'),
        database.ref(`/${lojaId}/status/ar_condicionado`).once('value')
    ])
    .then(([arSnapshot, statusSnapshot]) => {
            // Remove o elemento de loading
        if (arLoading) {
            arLoading.remove();
        }
        
        // Combina os dados
        const arData = arSnapshot.val() || {};
        const statusData = statusSnapshot.val() || {};
        
        // Adiciona o status aos dados
        arData.status = statusData;
            
            // Cria o card do ar-condicionado
        const cardAr = criarCardAr(arData);
        
        // Limpa o container antes de adicionar o card
        if (arContainer) {
            arContainer.innerHTML = '';
            arContainer.appendChild(cardAr);
        }
        
        // Configura um listener para monitorar mudanças no status
        const statusRef = database.ref(`/${lojaId}/status/ar_condicionado`);
        statusRef.on('value', snapshot => {
            const status = snapshot.val();
            const cardElement = document.querySelector('.card-ar-condicionado');
            if (!cardElement) return;
            
            const statusIndicator = cardElement.querySelector('.status-indicator');
            const statusBadge = cardElement.querySelector('.device-status');
            
            if (status === 'online') {
                if (statusBadge) {
                    statusBadge.textContent = 'Online';
                    statusBadge.className = 'badge bg-success device-status';
                }
                if (statusIndicator) {
                    statusIndicator.className = 'status-indicator status-online';
                }
            } else if (status === 'offline') {
                if (statusBadge) {
                    statusBadge.textContent = 'Offline';
                    statusBadge.className = 'badge bg-danger device-status';
                }
                if (statusIndicator) {
                    statusIndicator.className = 'status-indicator status-offline';
                }
            } else if (status === 'processando') {
                if (statusBadge) {
                    statusBadge.textContent = 'Processando...';
                    statusBadge.className = 'badge bg-info device-status';
                }
                if (statusIndicator) {
                    statusIndicator.className = 'status-indicator status-warning';
                }
            }
        });
        
        // Configura um listener para monitorar mudanças nas temperaturas
        const arRef = database.ref(`/${lojaId}/ar_condicionado`);
        arRef.on('value', snapshot => {
            const dados = snapshot.val() || {};
            const cardElement = document.querySelector('.card-ar-condicionado');
            if (!cardElement) return;
            
            const temperaturaSelect = cardElement.querySelector('.temperatura-select');
            if (!temperaturaSelect) return;
            
            // Identifica qual temperatura está ativa
            let tempAtiva = null;
            if (dados["18"] === true) {
                tempAtiva = "18";
            } else if (dados["22"] === true) {
                tempAtiva = "22"; 
            } else if (dados["OFF"] === true) {
                tempAtiva = "OFF";
            } else if (dados.temp) {
                // Compatibilidade com formato antigo
                tempAtiva = dados.temp;
            }
            
            // Atualiza o select
            if (tempAtiva) {
                temperaturaSelect.value = tempAtiva;
            }
        });
        })
        .catch(error => {
            console.error("Erro ao carregar ar-condicionado:", error);
        if (arLoading) {
            arLoading.remove();
        }
        
        if (arContainer) {
            arContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Erro ao carregar ar-condicionado: ${error.message}
                    </div>
                </div>
            `;
        }
        });
}

// Função para verificar status da loja em tempo real
function verificarStatusLoja() {
    // Referência ao status no Firebase
    const statusRef = database.ref(`/${lojaId}/pc_status`);
    
    // Listener para o status da loja
    statusRef.on('value', (snapshot) => {
        // Obtém o elemento para mostrar status da loja
        const lojaStatusElement = document.getElementById('loja-status');
        const cardLoja = document.querySelector('.card-status-loja');
        
        // Status vem diretamente do Firebase, sem cálculos de tempo
        if (snapshot.exists()) {
            const statusFirebase = snapshot.val();
            
            // Usa o status definido diretamente no Firebase
            const statusInfo = { 
                status: statusFirebase.status || "Indefinido",
                classe: statusFirebase.status === "Online" ? "bg-success" : "bg-danger",
                indicador: statusFirebase.status === "Online" ? "status-online" : "status-offline"
            };
                
            // Atualiza texto de status da loja
                if (lojaStatusElement) {
                lojaStatusElement.textContent = statusInfo.status;
                lojaStatusElement.className = `badge ${statusInfo.classe}`;
                }
                
            // Atualiza o card de status da loja
                if (cardLoja) {
                    // Atualiza o badge de status
                    let badgeElement = cardLoja.querySelector('.badge');
                    if (badgeElement) {
                        badgeElement.textContent = statusInfo.status;
                        badgeElement.className = `badge ${statusInfo.classe}`;
                    }
                }
                
            // ... resto da função ...
            } else {
            // Se não existir status, define como Indefinido
                if (lojaStatusElement) {
                lojaStatusElement.textContent = "Indefinido";
                lojaStatusElement.className = "badge bg-secondary";
            }
            }
        });
}

// Configuração dos botões de reset
const btnReset1s = document.getElementById('btn-reset-1s');
const btnReset13s = document.getElementById('btn-reset-13s');

// Função para enviar comando de reset
function enviarComandoReset(tipo) {
    showConfirm(`Tem certeza que deseja ${tipo == 1 ? 'ligar' : 'desligar'} o totem?`, 'Confirmação')
        .then(confirmed => {
            if (confirmed) {
                // Desabilitar os botões durante o processamento
                btnReset1s.disabled = true;
                btnReset13s.disabled = true;
                
                // Alterar o texto do botão clicado para indicar processamento
                const btnClicado = tipo == 1 ? btnReset1s : btnReset13s;
                const textoOriginal = btnClicado.innerHTML;
                btnClicado.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...`;
                
        // Atualiza no Firebase
        const resetRef = database.ref(`/${lojaId}/reset`);
                resetRef.set(parseInt(tipo))
            .then(() => {
                        showAlert(`Comando para ${tipo == 1 ? 'ligar' : 'desligar'} o totem enviado com sucesso.`, 'Sucesso', 'success', true);
                        
                        // Configurar listener para monitorar quando o reset voltar para 0
                        const resetListener = resetRef.on('value', (snapshot) => {
                            const resetValue = snapshot.val();
                            if (resetValue === 0) {
                                // O ESP confirmou que processou o reset
                                showAlert(`Totem ${tipo == 1 ? 'ligado' : 'desligado'} com sucesso!`, 'Concluído', 'success', true);
                                
                                // Registra a operação no Firestore quando houver confirmação
                                const tipoReset = tipo == 1 ? 'Reset ON' : 'Reset OFF';
                                registrarReset(lojaId, tipoReset)
                                .catch(error => {
                                    console.error(`Erro ao registrar reset no Firestore: ${error.message}`);
                                });
                                
                                // Restaurar os botões
                                btnReset1s.disabled = false;
                                btnReset13s.disabled = false;
                                btnClicado.innerHTML = textoOriginal;
                                
                                // Remover o listener
                                resetRef.off('value', resetListener);
                            }
                        });
                        
                        // Timeout para restaurar os botões caso não haja resposta
                        setTimeout(() => {
                            if (btnReset1s.disabled) {
                                btnReset1s.disabled = false;
                                btnReset13s.disabled = false;
                                btnClicado.innerHTML = textoOriginal;
                                resetRef.off('value', resetListener);
                            }
                        }, 30000); // 30 segundos de timeout
            })
            .catch(error => {
                        showAlert(`Erro ao enviar comando para ${tipo == 1 ? 'ligar' : 'desligar'} o totem: ${error.message}`, 'Erro', 'error');
                        btnReset1s.disabled = false;
                        btnReset13s.disabled = false;
                        btnClicado.innerHTML = textoOriginal;
            });
    }
});
}

// Eventos para os botões de reset
if (btnReset1s) {
    btnReset1s.addEventListener('click', () => enviarComandoReset(1));
}

if (btnReset13s) {
    btnReset13s.addEventListener('click', () => enviarComandoReset(2));
}

// Configuração do botão de salvar tempos
document.getElementById('btn-salvar-tempos').addEventListener('click', function() {
    if (!currentDosadoraId) return;
    
    const tempoSabao = parseInt(document.getElementById('tempo-sabao').value) || 0;
    const tempoFloral = parseInt(document.getElementById('tempo-floral').value) || 0;
    const tempoSport = parseInt(document.getElementById('tempo-sport').value) || 0;
    
    // Atualiza no Firebase
    const dosadoraRef = database.ref(`/${lojaId}/dosadora_01/${currentDosadoraId}`);
    dosadoraRef.update({
        ajuste_tempo_sabao: tempoSabao,
        ajuste_tempo_floral: tempoFloral,
        ajuste_tempo_sport: tempoSport,
        consulta_tempo: true
    }).then(() => {
        // Atualiza o status para 'processando'
        const statusRef = database.ref(`/${lojaId}/status/dosadoras/${currentDosadoraId}`);
        statusRef.set('processando');
        
        // Atualiza imediatamente os valores no card (já que sabemos os valores)
        const cardDosadora = document.querySelector(`.card-dosadora-${currentDosadoraId}`);
        if (cardDosadora) {
            const tempoSabaoElement = cardDosadora.querySelector('.tempo-sabao');
            const tempoFloralElement = cardDosadora.querySelector('.tempo-floral');
            const tempoSportElement = cardDosadora.querySelector('.tempo-sport');
            
            if (tempoSabaoElement) tempoSabaoElement.textContent = tempoSabao;
            if (tempoFloralElement) tempoFloralElement.textContent = tempoFloral;
            if (tempoSportElement) tempoSportElement.textContent = tempoSport;
        }
        
        showAlert(`Tempos configurados com sucesso para a dosadora ${currentDosadoraId}`, 'Sucesso', 'success', true);
        configModal.hide();
    }).catch(error => {
        showAlert(`Erro ao configurar tempos: ${error.message}`, 'Erro', 'error');
    });
});

// Elementos de status_machine
const statusMachineTableBody = document.getElementById('status-machine-table-body');
const otherDevicesTableBody = document.getElementById('other-devices-table-body');
const statusHistoryTableBody = document.getElementById('status-history-table-body');
const refreshStatusMachinesBtn = document.getElementById('refresh-status-machines');
const refreshOtherDevicesBtn = document.getElementById('refresh-other-devices');

// Dados de status de máquinas
let machinesStatusData = [];
let statusHistory = [];

// ... existing code ...

// Função para carregar os dados de status_machine
function carregarStatusMachines(forceRefresh = false) {
    console.log('Carregando dados de status das máquinas da loja:', lojaId);
    
    // Mostrar spinner na tabela de lavadoras e secadoras
    if (statusMachineTableBody) {
        statusMachineTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">Carregando lavadoras e secadoras...</p>
                </td>
            </tr>
        `;
    }
    
    // Mostrar spinner na tabela de outros dispositivos
    if (otherDevicesTableBody) {
        otherDevicesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-2">Carregando dosadoras, ar-condicionado e totem...</p>
                </td>
            </tr>
        `;
    }
    
    // Buscar dados no Firebase (tanto status quanto status_machine)
    Promise.all([
        database.ref(`/${lojaId}/status`).once('value'),
        database.ref(`/${lojaId}/status_machine`).once('value'),
        buscarDadosApiExterna() // Adicionar chamada � API externa
    ])
    .then(([statusSnapshot, statusMachineSnapshot, apiData]) => {
        const statusData = statusSnapshot.val() || {};
        const statusMachineData = statusMachineSnapshot.val() || {};
        
        console.log('Dados de status recebidos:', statusData);
        console.log('Dados de status_machine recebidos:', statusMachineData);
        
        const machinesData = [];
        
        // Processar lavadoras
        if (statusData.lavadoras) {
            Object.keys(statusData.lavadoras).forEach(id => {
                // Obter disponibilidade do status_machine, se disponível
                const availability = statusMachineData && 
                                    statusMachineData[id] ? 
                                    statusMachineData[id].status || 'unknown' : 
                                    'unknown';
                
                machinesData.push({
                    tipo: 'Lavadora',
                    id: id,
                    status: statusData.lavadoras[id] || 'desconhecido',
                    availability: availability,
                    availabilityTimestamp: Date.now(),
                    lastUpdate: Date.now(),
                    historico: []
                });
            });
        }
        
        // Processar secadoras
        if (statusData.secadoras) {
            Object.keys(statusData.secadoras).forEach(id => {
                // Obter disponibilidade do status_machine, se disponível
                const availability = statusMachineData && 
                                    statusMachineData[id] ? 
                                    statusMachineData[id].status || 'unknown' : 
                                    'unknown';
                
                machinesData.push({
                    tipo: 'Secadora',
                    id: id,
                    status: statusData.secadoras[id] || 'desconhecido',
                    availability: availability,
                    availabilityTimestamp: Date.now(),
                    lastUpdate: Date.now(),
                    historico: []
                });
            });
        }
        
        // Processar dosadoras
        if (statusData.dosadoras) {
            Object.keys(statusData.dosadoras).forEach(id => {
                // Obter disponibilidade do status_machine, se disponível
                const availability = statusMachineData && 
                                    statusMachineData[id] ? 
                                    statusMachineData[id].status || 'unknown' : 
                                    'unknown';
                
                machinesData.push({
                    tipo: 'Dosadora',
                    id: id,
                    status: statusData.dosadoras[id] || 'desconhecido',
                    availability: availability,
                    availabilityTimestamp: Date.now(),
                    lastUpdate: Date.now(),
                    historico: []
                });
            });
        }
        
        // Processar ar condicionado
        if (statusData.ar_condicionado) {
            // Obter disponibilidade do status_machine, se disponível
            const availability = statusMachineData && 
                                statusMachineData['AC-01'] ? 
                                statusMachineData['AC-01'].status || 'unknown' : 
                                'unknown';
            
            machinesData.push({
                tipo: 'Ar-Condicionado',
                id: 'AC-01',
                status: statusData.ar_condicionado || 'desconhecido',
                availability: availability,
                availabilityTimestamp: Date.now(),
                lastUpdate: Date.now(),
                historico: []
            });
        }
        
        // Adicionar entrada para o totem/PC
        if (statusData.pc_online !== undefined) {
            // Totem não tem uma propriedade availability específica
            machinesData.push({
                tipo: 'Totem',
                id: 'PC-01',
                status: statusData.pc_online ? 'online' : 'offline',
                availability: 'unknown', // Totem não tem estado de disponibilidade
                availabilityTimestamp: Date.now(),
                lastUpdate: Date.now(),
                historico: []
            });
        }
        
        // Atualizar dados globais com as informações da API, se disponíveis
        if (apiData) {
            machinesStatusData = atualizarDadosComApi(machinesData, apiData);
        } else {
            machinesStatusData = machinesData;
        }
        
        // Renderizar tabela
        renderizarTabelaStatusMachines();
        
        // Configurar listeners para monitorar alterações em tempo real
        configurarListenersStatus();
    })
    .catch(error => {
        console.error('Erro ao carregar status das máquinas:', error);
        
        // Mostrar erro na tabela de lavadoras e secadoras
        if (statusMachineTableBody) {
            statusMachineTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Erro ao carregar lavadoras e secadoras: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        }
        
        // Mostrar erro na tabela de outros dispositivos
        if (otherDevicesTableBody) {
            otherDevicesTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Erro ao carregar outros dispositivos: ${error.message}
                        </div>
                    </td>
                </tr>
            `;
        }
    });
}

// Função para configurar listeners de status em tempo real
function configurarListenersStatus() {
    const statusRef = database.ref(`/${lojaId}/status`);
    const statusMachineRef = database.ref(`/${lojaId}/status_machine`);
    
    // Listener para lavadoras
    statusRef.child('lavadoras').on('child_changed', (snapshot) => {
        const id = snapshot.key;
        const status = snapshot.val();
        
        atualizarStatusMachine('Lavadora', id, status);
    });
    
    // Listener para secadoras
    statusRef.child('secadoras').on('child_changed', (snapshot) => {
        const id = snapshot.key;
        const status = snapshot.val();
        
        atualizarStatusMachine('Secadora', id, status);
    });
    
    // Listener para dosadoras
    statusRef.child('dosadoras').on('child_changed', (snapshot) => {
        const id = snapshot.key;
        const status = snapshot.val();
        
        atualizarStatusMachine('Dosadora', id, status);
    });
    
    // Listener para ar condicionado
    statusRef.child('ar_condicionado').on('value', (snapshot) => {
        const status = snapshot.val();
        
        atualizarStatusMachine('Ar-Condicionado', 'AC-01', status);
    });
    
    // Listener para PC/totem
    statusRef.child('pc_online').on('value', (snapshot) => {
        const online = snapshot.val();
        const status = online ? 'online' : 'offline';
        
        atualizarStatusMachine('Totem', 'PC-01', status);
    });
    
    // Listener para status_machine
    statusMachineRef.on('child_changed', (snapshot) => {
        const id = snapshot.key;
        const machineData = snapshot.val();
        
        // Buscar na lista de dados atuais
        const machine = machinesStatusData.find(m => m.id === id);
        if (machine) {
            // Apenas atualizar disponibilidade para lavadoras e secadoras
            if (machine.tipo === 'Lavadora' || machine.tipo === 'Secadora') {
                // Verificar se o status de disponibilidade mudou
                if (machine.availability !== (machineData.status || 'unknown')) {
                    // Atualizar o timestamp apenas se a disponibilidade mudou
                    machine.availabilityTimestamp = Date.now();
                    
                    // Registrar no histórico a mudança de disponibilidade
                    if (!machine.historico) {
                        machine.historico = [];
                    }
                    
                    machine.historico.unshift({
                        timestamp: Date.now(),
                        status: machine.status, // Status de conexão permanece o mesmo
                        availability: machineData.status || 'unknown',
                        evento: `Alteração de disponibilidade: ${machine.availability} → ${machineData.status || 'unknown'}`
                    });
                    
                    // Limitar histórico a 10 entradas
                    if (machine.historico.length > 10) {
                        machine.historico = machine.historico.slice(0, 10);
                    }
                }
                
                // Atualizar apenas o campo de disponibilidade (availability)
                machine.availability = machineData.status || 'unknown';
            }
            
            // Renderizar a tabela com os dados atualizados
            renderizarTabelaStatusMachines();
        }
    });
}

// Função para atualizar o status de uma máquina
function atualizarStatusMachine(tipo, id, status) {
    console.log(`Atualizando status: ${tipo} ${id} -> ${status}`);
    
    // Encontrar a máquina nos dados
    const machineIndex = machinesStatusData.findIndex(m => 
        m.tipo === tipo && m.id === id
    );
    
    if (machineIndex === -1) {
        // Máquina não encontrada, adicionar nova
        machinesStatusData.push({
            tipo: tipo,
            id: id,
            status: status,
            lastUpdate: Date.now(),
            historico: [{
                timestamp: Date.now(),
                status: status,
                evento: 'Status inicial'
            }]
        });
    } else {
        // Máquina encontrada, verificar se o status mudou
        const currentStatus = machinesStatusData[machineIndex].status;
        
        if (currentStatus !== status) {
            // Status mudou, adicionar ao histórico
            if (!machinesStatusData[machineIndex].historico) {
                machinesStatusData[machineIndex].historico = [];
            }
            
            machinesStatusData[machineIndex].historico.unshift({
                timestamp: Date.now(),
                status: status,
                evento: `Alteração de status: ${currentStatus} → ${status}`
            });
            
            // Limitar histórico a 10 entradas
            if (machinesStatusData[machineIndex].historico.length > 10) {
                machinesStatusData[machineIndex].historico = 
                    machinesStatusData[machineIndex].historico.slice(0, 10);
            }
            
            // Atualizar status atual e timestamp
            machinesStatusData[machineIndex].status = status;
            machinesStatusData[machineIndex].lastUpdate = Date.now();
            
            // Criar objeto de hist�rico com o evento de altera��o
            const historyEntry = {
                timestamp: Date.now(),
                tipo: tipo,
                id: id,
                status: status,
                evento: `Alteração de status: ${currentStatus} → ${status}`
            };
            
            // Atualizar histórico global para a tabela de histórico
            statusHistory.unshift(historyEntry);
            
            // Limitar histórico global a 50 entradas
            if (statusHistory.length > 50) {
                statusHistory = statusHistory.slice(0, 50);
            }
            
            // Salvar a entrada de hist�rico no Firebase
            const newHistoryRef = statusHistoryRef.push();
            newHistoryRef.set(historyEntry)
                .then(() => {
                    console.log("Histórico de status salvo no banco de dados");
                })
                .catch(error => {
                    console.error("Erro ao salvar histórico de status:", error);
                });
            
            // Renderizar o histórico
            renderizarHistoricoStatus();
        }
    }
    
    // Atualizar a tabela
    renderizarTabelaStatusMachines();
}

// Função para renderizar a tabela de status
function renderizarTabelaStatusMachines() {
    if (!statusMachineTableBody || !otherDevicesTableBody) return;
    
    // Separar os dispositivos em duas categorias
    const washersAndDryers = machinesStatusData.filter(m => m.tipo === 'Lavadora' || m.tipo === 'Secadora');
    const otherDevices = machinesStatusData.filter(m => !washersAndDryers.includes(m));
    
    // TABELA 1: LAVADORAS E SECADORAS
    // ----------------------------
    
    // Limpar a tabela
    statusMachineTableBody.innerHTML = '';
    
    // Verificar se há dados
    if (washersAndDryers.length === 0) {
        statusMachineTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhuma lavadora ou secadora disponível.
                    </div>
                </td>
            </tr>
        `;
    } else {
        // Adicionar cada lavadora/secadora à tabela
        washersAndDryers.forEach(machine => {
            const tr = document.createElement('tr');
            
            // Formatar status com badge colorida
            const statusHtml = machine.status === 'online' ? 
                `<span class="badge bg-success">Online</span>` : 
                machine.status === 'offline' ? 
                `<span class="badge bg-danger">Offline</span>` : 
                machine.status === 'liberando' || machine.status === 'processando' ? 
                `<span class="badge bg-info">Processando</span>` : 
                `<span class="badge bg-secondary">${machine.status}</span>`;
            
            // Formatar disponibilidade com badge colorida
            let availabilityHtml = '';
            
            switch (machine.availability) {
                case 'available':
                    availabilityHtml = `<span class="badge bg-success">Disponível</span>`;
                    break;
                case 'busy':
                    // Remover a informação de tempo, mantendo apenas a badge
                    availabilityHtml = `<span class="badge bg-warning text-dark">Ocupada</span>`;
                    break;
                case 'suspended':
                    // Remover a informação de tempo, mantendo apenas a badge
                    availabilityHtml = `<span class="badge bg-secondary">Suspensa</span>`;
                    break;
                case 'unknown':
                default:
                    availabilityHtml = `<span class="badge bg-light text-dark">Indeterminado</span>`;
                    break;
            }
            
            // Formatar última atualização
            const lastUpdateText = formatarTempoRelativo(Date.now() - machine.lastUpdate);
            
            tr.innerHTML = `
                <td>${machine.tipo}</td>
                <td>${machine.id}</td>
                <td>${statusHtml}</td>
                <td>${availabilityHtml}</td>
                
                <td>
                    <button class="btn btn-sm btn-outline-info view-machine-details" 
                            data-tipo="${machine.tipo}" data-id="${machine.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            statusMachineTableBody.appendChild(tr);
        });
    }
    
    // TABELA 2: OUTROS DISPOSITIVOS (DOSADORAS, AR-CONDICIONADO, TOTEM)
    // --------------------------------------------------------
    
    // Limpar a tabela
    otherDevicesTableBody.innerHTML = '';
    
    // Verificar se há dados
    if (otherDevices.length === 0) {
        otherDevicesTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Nenhum outro dispositivo disponível.
                    </div>
                </td>
            </tr>
        `;
    } else {
        // Adicionar cada dispositivo tabela
        otherDevices.forEach(machine => {
            const tr = document.createElement('tr');
            
            // Formatar status com badge colorida
            const statusHtml = machine.status === 'online' ? 
                `<span class="badge bg-success">Online</span>` : 
                machine.status === 'offline' ? 
                `<span class="badge bg-danger">Offline</span>` : 
                machine.status === 'liberando' || machine.status === 'processando' ? 
                `<span class="badge bg-info">Processando</span>` : 
                `<span class="badge bg-secondary">${machine.status}</span>`;
            
            // Formatar última atualização
            const lastUpdateText = formatarTempoRelativo(Date.now() - machine.lastUpdate);
            
            tr.innerHTML = `
                <td>${machine.tipo}</td>
                <td>${machine.id}</td>
                <td>${statusHtml}</td>
                
                <td>
                    <button class="btn btn-sm btn-outline-info view-machine-details" 
                            data-tipo="${machine.tipo}" data-id="${machine.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            
            otherDevicesTableBody.appendChild(tr);
        });
    }
    
    // Adicionar eventos aos botões de detalhes
    document.querySelectorAll('.view-machine-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            const id = this.getAttribute('data-id');
            
            mostrarDetalhesMachine(tipo, id);
        });
    });
}

// Variáveis para paginação do histórico
let paginaAtualHistorico = 1;
let itensPorPaginaHistorico = 10;
let historicoFiltradoAtual = [];

// ... existing code ...

// Função para renderizar o histórico de status
function renderizarHistoricoStatus(pagina = 1, forceRefresh = false) {
    if (!statusHistoryTableBody) return;
    
    // Se não for forçar a atualização, usar o número de itens por página atual
    if (!forceRefresh) {
        // Obter o valor do seletor de registros por página
        const registrosPorPaginaSelect = document.getElementById('registros-por-pagina');
        if (registrosPorPaginaSelect) {
            const novoValor = parseInt(registrosPorPaginaSelect.value);
            // Só atualizar se o valor mudou
            if (novoValor !== itensPorPaginaHistorico) {
                itensPorPaginaHistorico = novoValor;
                // Se mudou o número de itens por página, reiniciar para a primeira página
                pagina = 1;
            }
        }
    }
    
    // Atualizar página atual
    paginaAtualHistorico = pagina;
    
    // Limpar a tabela
    statusHistoryTableBody.innerHTML = '';
    
    // Verificar se há dados
    if (statusHistory.length === 0) {
        statusHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-3">
                    <i class="text-muted">Nenhum histórico disponível</i>
                </td>
            </tr>
        `;
        atualizarControlePaginacao(0, 0, 0);
        return;
    }
    
    // Obter o filtro selecionado
    const filtroSelect = document.getElementById('filtro-historico');
    const filtroTipo = filtroSelect ? filtroSelect.value : 'offline';
    
    // Filtrar o histórico conforme selecionado
    let historicoFiltrado = statusHistory;
    
    if (filtroTipo === 'offline') {
        // Filtrar apenas as entradas com status offline
        historicoFiltrado = statusHistory.filter(entry => {
            // Verificar se o status atual é offline
            const isOfflineStatus = entry.status === "offline";
            
            // Verificar se o evento menciona transição para offline
            const isOfflineEvent = (entry.evento.includes("online") && entry.evento.includes("offline")) || 
                                  (entry.evento.includes("online") && entry.evento.includes("?") && entry.status === "offline");
            
            return isOfflineStatus && isOfflineEvent;
        });
    }
    
    // Armazenar o histórico filtrado atual para uso pela paginação
    historicoFiltradoAtual = historicoFiltrado;
    
    // Verificar se há dados após a filtragem
    if (historicoFiltrado.length === 0) {
        statusHistoryTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-3">
                    <i class="text-muted">Nenhuma ${filtroTipo === 'offline' ? 'alteração de status online para offline' : 'entrada de histórico'} disponível</i>
                </td>
            </tr>
        `;
        atualizarControlePaginacao(0, 0, 0);
        return;
    }
    
    // Calcular índices de paginação
    const totalItens = historicoFiltrado.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPaginaHistorico);
    
    // Garantir que a página solicitada está dentro dos limites
    if (paginaAtualHistorico < 1) paginaAtualHistorico = 1;
    if (paginaAtualHistorico > totalPaginas) paginaAtualHistorico = totalPaginas;
    
    // Calcular índices de início e fim para a página atual
    const indiceFinal = paginaAtualHistorico * itensPorPaginaHistorico;
    const indiceInicial = indiceFinal - itensPorPaginaHistorico;
    
    // Obter apenas os itens da página atual
    const itensDaPagina = historicoFiltrado.slice(indiceInicial, indiceFinal);
    
    // Adicionar cada entrada da página atual à tabela
    itensDaPagina.forEach(entry => {
        const tr = document.createElement("tr");
        
        // Formatar status com badge colorida
        const statusHtml = entry.status === "online" ? 
            `<span class="badge bg-success">Online</span>` : 
            entry.status === "offline" ? 
            `<span class="badge bg-danger">Offline</span>` : 
            entry.status === "liberando" || entry.status === "processando" ? 
            `<span class="badge bg-info">Processando</span>` : 
            `<span class="badge bg-secondary">${entry.status}</span>`;
        
        // Formatar data e hora
        const dataHora = formatarDataHora(entry.timestamp);
        
        tr.innerHTML = `
            <td>${dataHora}</td>
            <td>${entry.tipo}</td>
            <td>${entry.id}</td>
            <td>${statusHtml}</td>
            <td>${entry.evento}</td>
        `;
        
        statusHistoryTableBody.appendChild(tr);
    });
    
    // Atualizar controles de paginação
    atualizarControlePaginacao(indiceInicial + 1, Math.min(indiceFinal, totalItens), totalItens);
}

// Função para atualizar os controles de paginação
function atualizarControlePaginacao(inicio, fim, total) {
    // Atualizar texto de informação de paginação
    const paginacaoInfo = document.getElementById('historico-paginacao-info');
    if (paginacaoInfo) {
        if (total === 0) {
            paginacaoInfo.textContent = "Nenhum registro encontrado";
        } else {
            paginacaoInfo.textContent = `Mostrando ${inicio}-${fim} de ${total} registros`;
        }
    }
    
    // Atualizar os botões de navegação
    const paginacao = document.getElementById('historico-paginacao');
    if (!paginacao) return;
    
    // Calcular total de páginas
    const totalPaginas = Math.ceil(total / itensPorPaginaHistorico);
    
    // Limpar paginação atual
    paginacao.innerHTML = '';
    
    // Botão anterior
    const itemAnterior = document.createElement('li');
    itemAnterior.className = `page-item ${paginaAtualHistorico <= 1 ? 'disabled' : ''}`;
    itemAnterior.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior" id="historico-pagina-anterior">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    paginacao.appendChild(itemAnterior);
    
    // Determinar quais números de página mostrar
    let paginasParaMostrar = [];
    
    if (totalPaginas <= 5) {
        // Mostrar todas as páginas se forem 5 ou menos
        for (let i = 1; i <= totalPaginas; i++) {
            paginasParaMostrar.push(i);
        }
    } else {
        // Sempre mostrar a primeira página
        paginasParaMostrar.push(1);
        
        // Mostrar páginas ao redor da página atual
        let inicio = Math.max(2, paginaAtualHistorico - 1);
        let fim = Math.min(paginaAtualHistorico + 1, totalPaginas - 1);
        
        // Adicionar elipse se necessário
        if (inicio > 2) {
            paginasParaMostrar.push('...');
        }
        
        // Adicionar páginas do meio
        for (let i = inicio; i <= fim; i++) {
            paginasParaMostrar.push(i);
        }
        
        // Adicionar elipse se necessário
        if (fim < totalPaginas - 1) {
            paginasParaMostrar.push('...');
        }
        
        // Sempre mostrar a última página
        paginasParaMostrar.push(totalPaginas);
    }
    
    // Adicionar números de página
    paginasParaMostrar.forEach(numeroPagina => {
        const itemPagina = document.createElement('li');
        
        if (numeroPagina === '...') {
            // Elipse para indicar páginas omitidas
            itemPagina.className = 'page-item disabled';
            itemPagina.innerHTML = '<span class="page-link">...</span>';
        } else {
            // Número de página clicável
            itemPagina.className = `page-item ${numeroPagina === paginaAtualHistorico ? 'active' : ''}`;
            itemPagina.innerHTML = `<a class="page-link" href="#" data-pagina="${numeroPagina}">${numeroPagina}</a>`;
        }
        
        paginacao.appendChild(itemPagina);
    });
    
    // Botão próximo
    const itemProximo = document.createElement('li');
    itemProximo.className = `page-item ${paginaAtualHistorico >= totalPaginas ? 'disabled' : ''}`;
    itemProximo.innerHTML = `
        <a class="page-link" href="#" aria-label="Próximo" id="historico-proxima-pagina">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    paginacao.appendChild(itemProximo);
    
    // Adicionar eventos aos botões de navegação
    const btnAnterior = document.getElementById('historico-pagina-anterior');
    if (btnAnterior) {
        btnAnterior.addEventListener('click', function(e) {
            e.preventDefault();
            if (paginaAtualHistorico > 1) {
                renderizarHistoricoStatus(paginaAtualHistorico - 1);
            }
        });
    }
    
    const btnProximo = document.getElementById('historico-proxima-pagina');
    if (btnProximo) {
        btnProximo.addEventListener('click', function(e) {
            e.preventDefault();
            if (paginaAtualHistorico < totalPaginas) {
                renderizarHistoricoStatus(paginaAtualHistorico + 1);
            }
        });
    }
    
    // Adicionar eventos aos números de página
    document.querySelectorAll('#historico-paginacao .page-link[data-pagina]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pagina = parseInt(this.getAttribute('data-pagina'));
            renderizarHistoricoStatus(pagina);
        });
    });
}

// ... existing code ...

// Inicializa a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    verificarStatusLoja();
    carregarLavadoras();
    carregarSecadoras();
    carregarDosadoras();
    carregarAr();
    
    // Carregar status das máquinas e histórico
    carregarStatusMachines();
    carregarHistoricoStatus();
    
    // Carregar dados brutos do status_machine
    carregarRawStatus();
    
    // Configurar botões de refresh
    if (refreshStatusMachinesBtn) {
        refreshStatusMachinesBtn.addEventListener('click', () => {
            carregarStatusMachines(true);
        });
    }
    
    // Configurar botão de atualizar dados brutos
    if (refreshRawStatusBtn) {
        refreshRawStatusBtn.addEventListener('click', () => {
            carregarRawStatus();
        });
    }
    
    if (refreshOtherDevicesBtn) {
        refreshOtherDevicesBtn.addEventListener('click', () => {
            carregarStatusMachines(true);
        });
    }
    
    // Configurar listener para o select de filtro de histórico
    const filtroHistorico = document.getElementById('filtro-historico');
    if (filtroHistorico) {
        filtroHistorico.addEventListener('change', () => {
            // Ao mudar o filtro, voltar para a primeira página
            renderizarHistoricoStatus(1);
        });
    }
    
    // Configurar listener para o seletor de registros por página
    const registrosPorPagina = document.getElementById('registros-por-pagina');
    if (registrosPorPagina) {
        registrosPorPagina.addEventListener('change', () => {
            // Ao mudar a quantidade de registros, atualizar a tabela
            renderizarHistoricoStatus(1);
        });
    }
    
    // Buscar o CEP da loja na API externa
    if (typeof exibirCEPLoja === 'function') {
        exibirCEPLoja(lojaId, '#loja-cep');
    } else {
        console.error('Função exibirCEPLoja não disponível');
    }
    
    // Verificar status da loja a cada 30 segundos para atualizar rapidamente quando desconectar
    setInterval(verificarStatusLoja, 30000);
    
    // Configurar listener para o botão de colapso da sidebar
    const sidebarCollapse = document.getElementById('sidebar-collapse');
    if (sidebarCollapse) {
        sidebarCollapse.addEventListener('click', function() {
            const sidebarWrapper = document.getElementById('sidebar-wrapper');
            const pageContentWrapper = document.getElementById('page-content-wrapper');
            if (sidebarWrapper) {
                sidebarWrapper.classList.toggle('sidebar-collapsed');
            }
            if (pageContentWrapper) {
                pageContentWrapper.classList.toggle('content-expanded');
            }
        });
    }
    
    // Configurar os listeners para tab de raw status quando for selecionada
    const rawStatusTab = document.getElementById('raw-status-tab');
    if (rawStatusTab) {
        rawStatusTab.addEventListener('shown.bs.tab', function (e) {
            // Recarregar os dados quando a tab for selecionada
            carregarRawStatus();
        });
    }
    
    // Configurar os listeners para tab de status quando for selecionada
    const statusTab = document.getElementById('status-tab');
    if (statusTab) {
        statusTab.addEventListener('shown.bs.tab', function (e) {
            // Recarregar os dados quando a tab for selecionada
            carregarStatusMachines(true);
        });
    }
    
    // Configurar listener para o botão de reset de 1s
    const btnReset1s = document.getElementById('btn-reset-1s');
    if (btnReset1s) {
        btnReset1s.addEventListener('click', () => enviarComandoReset('1s'));
    }
});

// Função para buscar dados da API externa
async function buscarDadosApiExterna() {
    console.log('Buscando dados da API externa para a loja:', lojaId);
    
    try {
        // Montar a URL com o código da loja
        const url = `https://sistema.lavanderia60minutos.com.br/api/v1/machines?store_code=${lojaId}`;
        
        // Fazer a requisição para a API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-Token': '1be10a9c20528183b64e3c69564db6958eab7f434ee94350706adb4efc261869',
                'Content-Type': 'application/json'
            }
        });
        
        // Verificar se a requisição foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }
        
        // Converter a resposta para JSON
        const data = await response.json();
        
        console.log('Dados da API externa recebidos:', data);
        
        // Verificar se a API retornou dados válidos
        if (!data || !data.data || !Array.isArray(data.data)) {
            console.warn('API retornou formato de dados inesperado:', data);
            return null;
        }
        
        // Processar e retornar os dados recebidos em um formato mais simples
        return data.data.map(item => {
            return {
                name: item.attributes.name,
                status: item.attributes.status,
                type: item.attributes["machine-type"]
            };
        });
    } catch (error) {
        console.error('Erro ao buscar dados da API externa:', error);
        showAlert(`Erro ao buscar dados de disponibilidade: ${error.message}`, 'Erro', 'error', true);
        return null;
    }
}

// Função para atualizar os dados das máquinas com as informações da API
function atualizarDadosComApi(machinesData, apiData) {
    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
        console.warn('Dados da API inválidos ou vazios');
        return machinesData;
    }
    
    console.log('Atualizando dados das máquinas com informações da API');
    
    // Mapear os nomes das máquinas para os status da API
    const apiStatusMap = {};
    apiData.forEach(item => {
        apiStatusMap[item.name] = item.status;
    });
    
    // Atualizar os dados das máquinas com os status da API
    return machinesData.map(machine => {
        // Apenas atualizar lavadoras e secadoras
        if ((machine.tipo === 'Lavadora' || machine.tipo === 'Secadora') && apiStatusMap[machine.id]) {
            // Verificar se o status mudou
            if (machine.availability !== apiStatusMap[machine.id]) {
                // Registrar no histórico a mudança de disponibilidade
                if (!machine.historico) {
                    machine.historico = [];
                }
                
                machine.historico.unshift({
                    timestamp: Date.now(),
                    status: machine.status, // Status de conexão permanece o mesmo
                    availability: apiStatusMap[machine.id],
                    evento: `Alteração de disponibilidade via API: ${machine.availability} → ${apiStatusMap[machine.id]}`
                });
                
                // Limitar histórico a 10 entradas
                if (machine.historico.length > 10) {
                    machine.historico = machine.historico.slice(0, 10);
                }
                
                // Atualizar o timestamp de disponibilidade
                machine.availabilityTimestamp = Date.now();
            }
            
            // Atualizar a disponibilidade com o status da API
            machine.availability = apiStatusMap[machine.id];
        }
        
        return machine;
    });
}

// Função para carregar o histórico do Firebase
function carregarHistoricoStatus() {
    console.log("Carregando histórico do Firebase...");
    statusHistoryRef.orderByChild('timestamp').limitToLast(50).once('value')
        .then(snapshot => {
            const historicoData = snapshot.val();
            if (historicoData) {
                // Converter objeto em array
                const historico = Object.values(historicoData);
                
                // Ordenar por timestamp (mais recentes primeiro)
                historico.sort((a, b) => b.timestamp - a.timestamp);
                
                // Atualizar a lista na memória
                statusHistory = historico;
                
                // Renderizar o histórico na tabela
                renderizarHistoricoStatus();
                
                console.log(`Carregados ${historico.length} registros de histórico`);
            } else {
                console.log("Nenhum histórico encontrado no banco de dados");
            }
        })
        .catch(error => {
            console.error("Erro ao carregar histórico:", error);
            showAlert("Erro ao carregar histórico de status", "Erro", "error", true);
        });
}

// ... existing code ...

// Elementos adicionais para a visualização de dados brutos
const jsonViewer = document.getElementById('json-viewer');
const refreshRawStatusBtn = document.getElementById('refresh-raw-status');
const btnExpandAll = document.getElementById('btn-expand-all');
const btnCollapseAll = document.getElementById('btn-collapse-all');
const btnCopyJson = document.getElementById('btn-copy-json');

// Dados brutos do status_machine
let rawStatusData = null;

// ... existing code ...

// Função para mostrar detalhes de uma máquina
function mostrarDetalhesMachine(tipo, id) {
    // Encontrar a máquina
    const machine = machinesStatusData.find(m => m.tipo === tipo && m.id === id);
    
    if (!machine) {
        Swal.fire({
            title: 'Erro',
            text: `Máquina ${tipo} ${id} não encontrada`,
            icon: 'error',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    const statusClass = machine.status === 'online' ? 'text-success' : 
                       machine.status === 'offline' ? 'text-danger' : 'text-secondary';
    
    // Formatação da disponibilidade
    let availabilityText = '';
    let availabilityClass = '';
    let availabilitySection = '';
    
    // Apenas mostrar disponibilidade para lavadoras e secadoras
    if (machine.tipo === 'Lavadora' || machine.tipo === 'Secadora') {
        switch (machine.availability) {
            case 'available':
                availabilityText = 'Disponível';
                availabilityClass = 'text-success';
                break;
            case 'busy':
                availabilityText = 'Ocupada';
                availabilityClass = 'text-warning';
                break;
            case 'suspended':
                availabilityText = 'Suspensa';
                availabilityClass = 'text-secondary';
                break;
            case 'unknown':
            default:
                availabilityText = 'Indeterminado';
                availabilityClass = 'text-muted';
                break;
        }
        
        availabilitySection = `
            <p><strong>Disponibilidade:</strong> <span class="${availabilityClass}">${availabilityText}</span></p>
        `;
    }
    
    Swal.fire({
        title: `${tipo} ${id}`,
        html: `
            <div class="text-start">
                <p><strong>Status atual:</strong> <span class="${statusClass}">${machine.status}</span></p>
                ${availabilitySection}
                <p><strong>Última atualização:</strong> ${formatarDataHora(machine.lastUpdate)}</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'Fechar'
    });
}

// Função para formatar timestamp para data/hora legível
function formatarDataHora(timestamp) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
}

// Função para formatar tempo relativo (quanto tempo atrás)
function formatarTempoRelativo(diffMs) {
    // Converter para segundos
    const diffSec = Math.floor(diffMs / 1000);
    
    // Menos de 1 minuto
    if (diffSec < 60) {
        return 'Agora mesmo';
    }
    
    // Menos de 1 hora
    if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        return `${mins} ${mins === 1 ? 'minuto' : 'minutos'} atrás`;
    }
    
    // Menos de 1 dia
    if (diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        return `${hours} ${hours === 1 ? 'hora' : 'horas'} atrás`;
    }
    
    // Mais de 1 dia
    const days = Math.floor(diffSec / 86400);
    return `${days} ${days === 1 ? 'dia' : 'dias'} atrás`;
}

// ... existing code ...

// Função para carregar dados brutos do nó status_machine
function carregarRawStatus() {
    console.log('Carregando dados brutos do nó status_machine...');
    
    // Identificar o elemento JSON viewer
    const jsonViewer = document.getElementById('json-viewer');
    
    // Mostrar spinner
    if (jsonViewer) {
        jsonViewer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2">Carregando dados brutos...</p>
            </div>
        `;
    }
    
    // Buscar dados no Firebase - usando o nó status_machine em vez de status
    const statusMachineRef = firebase.database().ref(`status_machine/${lojaId}`);
    
    statusMachineRef.once('value')
        .then(snapshot => {
            const data = snapshot.val() || {};
            
            // Renderiza JSON com formatação bonita
            if (jsonViewer) {
                try {
                    // Formatação do JSON com indentação
                    const formattedJson = JSON.stringify(data, null, 2);
                    
                    // Adicionar syntax highlighting
                    jsonViewer.innerHTML = `<pre class="json-pre"><code class="language-json">${formattedJson}</code></pre>`;
                    
                    // Se tiver a biblioteca Prism.js carregada, aplicar o highlighting
                    if (typeof Prism !== 'undefined') {
                        Prism.highlightElement(jsonViewer.querySelector('code'));
                    }
                } catch (error) {
                    jsonViewer.innerHTML = `<div class="alert alert-danger">Erro ao formatar JSON: ${error.message}</div>`;
                    console.error('Erro ao formatar JSON:', error);
                }
            }
            
            console.log('Dados brutos carregados com sucesso');
        })
        .catch(error => {
            console.error('Erro ao carregar dados brutos:', error);
            
            if (jsonViewer) {
                jsonViewer.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Erro ao carregar dados brutos: ${error.message}
                    </div>
                `;
            }
        });
}

// ... existing code ...





