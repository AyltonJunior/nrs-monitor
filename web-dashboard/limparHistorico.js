function limparHistoricoStatus() { 
    showConfirm('Tem certeza que deseja limpar todo o histórico de status dos dispositivos?', 'Confirmação')
        .then(confirmado => { 
            if (confirmado) { 
                // Limpar o histórico em memória
                statusHistory = []; 
                renderizarHistoricoStatus(); 
                
                // Limpar o histórico no Firebase
                const lojaId = new URLSearchParams(window.location.search).get('id');
                if (lojaId) {
                    firebase.database().ref(`status_history/${lojaId}`).remove()
                        .then(() => {
                            console.log("Histórico de status removido do banco de dados");
                            showAlert('Histórico de status limpo com sucesso!', 'Sucesso', 'success', true);
                        })
                        .catch(error => {
                            console.error("Erro ao limpar histórico no banco de dados:", error);
                            showAlert('Erro ao limpar histórico no banco de dados', 'Erro', 'error', true);
                        });
                } else {
                    showAlert('Histórico de status limpo com sucesso!', 'Sucesso', 'success', true);
                }
            } 
        }); 
} 