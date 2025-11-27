// Painel do Gerente - Interações

// Variável global para armazenar dados atuais
let currentFeedbackData = {
    userId: null,
    userName: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando Painel do Gerente...');
    
    // Inicializar modais
    initModals();
    
    // Inicializar formulários
    initForms();
    
    // Inicializar gráficos (se Chart.js estiver disponível)
    initCharts();
});

// Inicializar modais
function initModals() {
    console.log('🔧 Inicializando modais...');
    
    // Fechar modais ao clicar no X ou fora
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('modal-close')) {
                closeModal(modal);
            }
        });
    });
    
    // Botão para abrir modal de criar máquina - PRINCIPAL
    const createMachineBtn = document.getElementById('create-machine-btn');
    if (createMachineBtn) {
        console.log('✅ Botão Nova Máquina (header) encontrado');
        createMachineBtn.addEventListener('click', function() {
            console.log('🖱️ Botão Nova Máquina clicado');
            openModal('create-machine-modal');
        });
    } else {
        console.log('❌ Botão Nova Máquina (header) NÃO encontrado');
    }
    
    // Botão secundário para abrir modal de criar máquina
    const createMachineBtn2 = document.getElementById('create-machine-btn-2');
    if (createMachineBtn2) {
        console.log('✅ Botão Nova Máquina 2 encontrado');
        createMachineBtn2.addEventListener('click', function() {
            console.log('🖱️ Botão Nova Máquina 2 clicado');
            openModal('create-machine-modal');
        });
    }
    
    // Botão terciário para abrir modal de criar máquina
    const createMachineBtn3 = document.getElementById('create-machine-btn-3');
    if (createMachineBtn3) {
        console.log('✅ Botão Nova Máquina 3 encontrado');
        createMachineBtn3.addEventListener('click', function() {
            console.log('🖱️ Botão Nova Máquina 3 clicado');
            openModal('create-machine-modal');
        });
    }
    
    // Botão para abrir modal de enviar feedback
    const sendFeedbackBtns = document.querySelectorAll('.send-feedback-btn');
    console.log(`✅ ${sendFeedbackBtns.length} botões de feedback encontrados`);
    
    sendFeedbackBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            console.log(`🖱️ Feedback para: ${userName} (ID: ${userId})`);
            openFeedbackModal(userId, userName);
        });
    });
    
    // Botões de Ver Detalhes nas máquinas
    const verDetalhesBtns = document.querySelectorAll('.ver-detalhes-btn');
    console.log(`✅ ${verDetalhesBtns.length} botões "Ver Detalhes" encontrados`);
    
    verDetalhesBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const machineId = this.getAttribute('data-machine-id');
            const machineName = this.getAttribute('data-machine-name');
            console.log(`🔍 Ver detalhes da máquina: ${machineName} (ID: ${machineId})`);
            showMachineDetails(machineId, machineName);
        });
    });
    
    // Botões de Editar nas máquinas
    const editarBtns = document.querySelectorAll('.editar-btn');
    console.log(`✅ ${editarBtns.length} botões "Editar" encontrados`);
    
    editarBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const machineId = this.getAttribute('data-machine-id');
            console.log(`✏️ Editar máquina ID: ${machineId}`);
            editMachine(machineId);
        });
    });
}

// Abrir modal
function openModal(modalId) {
    console.log(`📂 Abrindo modal: ${modalId}`);
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log(`✅ Modal ${modalId} aberto`);
    } else {
        console.log(`❌ Modal ${modalId} NÃO encontrado`);
    }
}

// Fechar modal
function closeModal(modal) {
    if (typeof modal === 'string') {
        modal = document.getElementById(modal);
    }
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log(`📂 Modal fechado`);
    }
}

// Abrir modal de feedback com dados do usuário
function openFeedbackModal(userId, userName) {
    console.log(`📝 Abrindo feedback para: ${userName} (${userId})`);
    
    // Salvar dados globalmente
    currentFeedbackData.userId = userId;
    currentFeedbackData.userName = userName;
    
    const modal = document.getElementById('feedback-modal');
    if (modal) {
        // Preencher dados do destinatário
        const recipientName = document.getElementById('feedback-recipient-name');
        const recipientAvatar = document.getElementById('feedback-recipient-avatar');
        const destinatarioId = document.getElementById('feedback-destinatario-id');
        
        if (recipientName) {
            recipientName.textContent = userName;
            console.log(`✅ Nome do destinatário definido: ${userName}`);
        }
        
        if (recipientAvatar) {
            recipientAvatar.textContent = userName.charAt(0).toUpperCase();
            console.log(`✅ Avatar do destinatário definido`);
        }
        
        if (destinatarioId) {
            destinatarioId.value = userId;
            console.log(`✅ ID do destinatário definido: ${userId}`);
        } else {
            console.log('❌ Campo hidden do destinatário NÃO encontrado');
        }
        
        // Limpar formulário
        const mensagemField = document.getElementById('feedback-mensagem');
        const maquinaField = document.getElementById('feedback-maquina-id');
        
        if (mensagemField) mensagemField.value = '';
        if (maquinaField) maquinaField.value = '';
        
        // Abrir modal
        openModal('feedback-modal');
    } else {
        console.log('❌ Modal de feedback NÃO encontrado');
    }
}

// Inicializar formulários
function initForms() {
    console.log('🔧 Inicializando formulários...');
    
    // Formulário de criar máquina
    const createMachineForm = document.getElementById('create-machine-form');
    if (createMachineForm) {
        console.log('✅ Formulário de criar máquina encontrado');
        createMachineForm.addEventListener('submit', handleCreateMachineSubmit);
    } else {
        console.log('❌ Formulário de criar máquina NÃO encontrado');
    }
    
    // Formulário de feedback
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
        console.log('✅ Formulário de feedback encontrado');
        feedbackForm.addEventListener('submit', handleFeedbackSubmit);
        
        // Seleção de tipo de feedback
        const feedbackTypeOptions = document.querySelectorAll('.feedback-type-option');
        feedbackTypeOptions.forEach(option => {
            option.addEventListener('click', function() {
                feedbackTypeOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                const tipoInput = document.getElementById('feedback-type');
                if (tipoInput) {
                    tipoInput.value = this.dataset.type;
                    console.log(`✅ Tipo de feedback definido: ${this.dataset.type}`);
                }
            });
        });
    } else {
        console.log('❌ Formulário de feedback NÃO encontrado');
    }
}

// Manipular criação de máquina
async function handleCreateMachineSubmit(e) {
    e.preventDefault();
    console.log('🔄 Enviando formulário de criação de máquina...');
    
    const formData = new FormData(e.target);
    const nome = formData.get('nome');
    const descricao = formData.get('descricao');
    
    console.log(`📝 Dados da máquina: ${nome}, ${descricao}`);
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Criando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/criar_maquina', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nome: nome,
                descricao: descricao
            })
        });
        
        const data = await response.json();
        console.log('📦 Resposta da API:', data);
        
        if (data.status === 'sucesso') {
            showMessage(data.mensagem, 'success');
            
            // Mostrar código de convite
            if (data.codigo_convite) {
                showInviteCode(data.codigo_convite);
            }
            
            closeModal('create-machine-modal');
            e.target.reset();
            
            // Recarregar a página para mostrar a nova máquina
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showMessage(data.mensagem, 'error');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        showMessage('Erro ao criar máquina. Tente novamente.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Manipular envio de feedback
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    console.log('🔄 Enviando feedback...');
    
    // Usar dados da variável global como fallback
    const destinatarioId = currentFeedbackData.userId || document.getElementById('feedback-destinatario-id')?.value;
    const mensagem = document.getElementById('feedback-mensagem').value;
    const tipo = document.getElementById('feedback-type').value;
    const maquinaId = document.getElementById('feedback-maquina-id').value;
    
    console.log('📝 Dados do feedback:', { 
        destinatarioId, 
        mensagem: mensagem.substring(0, 50) + '...', 
        tipo, 
        maquinaId 
    });
    
    if (!destinatarioId) {
        console.log('❌ Destinatário não especificado');
        showMessage('Destinatário não selecionado.', 'error');
        return;
    }
    
    if (!mensagem.trim()) {
        console.log('❌ Mensagem vazia');
        showMessage('Por favor, escreva uma mensagem.', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/enviar_feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                destinatario_id: parseInt(destinatarioId),
                mensagem: mensagem,
                tipo: tipo,
                maquina_id: maquinaId ? parseInt(maquinaId) : null
            })
        });
        
        const data = await response.json();
        console.log('📦 Resposta do feedback:', data);
        
        if (data.status === 'sucesso') {
            showMessage(data.mensagem, 'success');
            closeModal('feedback-modal');
            
            // Limpar dados globais
            currentFeedbackData.userId = null;
            currentFeedbackData.userName = null;
            
            // Limpar formulário
            document.getElementById('feedback-mensagem').value = '';
            document.getElementById('feedback-maquina-id').value = '';
        } else {
            showMessage(data.mensagem, 'error');
        }
    } catch (error) {
        console.error('❌ Erro no feedback:', error);
        showMessage('Erro ao enviar feedback. Tente novamente.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Mostrar código de convite
function showInviteCode(code) {
    const message = `Máquina criada com sucesso! Código de convite: ${code}`;
    showMessage(message, 'success');
    
    // Opcional: Copiar para área de transferência
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
            console.log('📋 Código copiado para a área de transferência');
        });
    }
}

// Função para mostrar detalhes da máquina
function showMachineDetails(machineId, machineName) {
    console.log(`🔍 Mostrando detalhes da máquina: ${machineName} (ID: ${machineId})`);
    
    // Criar modal de detalhes
    const detailsModal = document.createElement('div');
    detailsModal.className = 'modal';
    detailsModal.id = 'machine-details-modal';
    detailsModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Detalhes da Máquina: ${machineName}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="machine-details">
                    <div class="detail-section">
                        <h4>📊 Métricas Recentes</h4>
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-value">85%</div>
                                <div class="metric-label">Eficiência</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">150 kWh</div>
                                <div class="metric-label">Energia Útil</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">180 kWh</div>
                                <div class="metric-label">Energia Total</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">42 unid.</div>
                                <div class="metric-label">Produção</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>👥 Funcionários Vinculados</h4>
                        <div class="employees-list">
                            <div class="employee-item">
                                <div class="user-avatar">F1</div>
                                <span>Funcionário 1</span>
                            </div>
                            <div class="employee-item">
                                <div class="user-avatar">F2</div>
                                <span>Funcionário 2</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📈 Histórico de Eficiência</h4>
                        <p>Gráfico de eficiência nos últimos 30 dias - Em desenvolvimento</p>
                    </div>
                </div>
                
                <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="closeModal('machine-details-modal')">Fechar</button>
                    <button class="btn btn-primary" onclick="editMachine(${machineId})">Editar Máquina</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(detailsModal);
    openModal('machine-details-modal');
}

// Função para editar máquina
function editMachine(machineId) {
    console.log(`✏️ Editando máquina ID: ${machineId}`);
    
    // Criar modal de edição
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'edit-machine-modal';
    editModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Editar Máquina</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <form id="edit-machine-form" class="metrics-form">
                    <div class="form-group">
                        <label class="form-label" for="edit-machine-nome">Nome da Máquina</label>
                        <input type="text" class="form-input" id="edit-machine-nome" name="nome" value="Máquina ${machineId}" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="edit-machine-descricao">Descrição</label>
                        <textarea class="form-input" id="edit-machine-descricao" name="descricao" rows="3">Descrição da máquina ${machineId}</textarea>
                    </div>
                    
                    <div class="modal-actions" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button type="button" class="btn btn-secondary" onclick="closeModal('edit-machine-modal')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(editModal);
    
    // Configurar formulário de edição
    const editForm = document.getElementById('edit-machine-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEditMachine(machineId);
        });
    }
    
    openModal('edit-machine-modal');
}

// Manipular edição de máquina
async function handleEditMachine(machineId) {
    console.log(`🔄 Salvando edição da máquina ID: ${machineId}`);
    
    const nome = document.getElementById('edit-machine-nome').value;
    const descricao = document.getElementById('edit-machine-descricao').value;
    
    const submitBtn = document.querySelector('#edit-machine-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Salvando...';
    submitBtn.disabled = true;
    
    try {
        // Simular salvamento (substituir por API real)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showMessage(`Máquina "${nome}" atualizada com sucesso!`, 'success');
        closeModal('edit-machine-modal');
        
        // Remover modal do DOM
        const modal = document.getElementById('edit-machine-modal');
        if (modal) {
            modal.remove();
        }
        
    } catch (error) {
        console.error('❌ Erro ao editar máquina:', error);
        showMessage('Erro ao editar máquina. Tente novamente.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Inicializar gráficos
function initCharts() {
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
        console.log('📊 Chart.js não carregado');
        return;
    }
    
    // Gráfico de eficiência por máquina
    const efficiencyCtx = document.getElementById('efficiency-chart');
    if (efficiencyCtx) {
        const efficiencyData = {
            labels: ['Máquina A', 'Máquina B', 'Máquina C', 'Máquina D'],
            datasets: [{
                label: 'Eficiência (%)',
                data: [85, 72, 90, 68],
                backgroundColor: ['#58cc02', '#89e219', '#4b9cff', '#ffc800'],
                borderWidth: 0
            }]
        };
        
        new Chart(efficiencyCtx, {
            type: 'bar',
            data: efficiencyData,
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Eficiência por Máquina' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: function(value) { return value + '%'; } }
                    }
                }
            }
        });
    }
    
    // Gráfico de progresso da equipe
    const progressCtx = document.getElementById('progress-chart');
    if (progressCtx) {
        const progressData = {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
            datasets: [{
                label: 'Eficiência Média',
                data: [72, 75, 78, 82],
                borderColor: '#58cc02',
                backgroundColor: 'rgba(88, 204, 2, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
        
        new Chart(progressCtx, {
            type: 'line',
            data: progressData,
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: 'Progresso da Equipe (Últimas 4 Semanas)' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { callback: function(value) { return value + '%'; } }
                    }
                }
            }
        });
    }
}

// Mostrar mensagens
function showMessage(message, type) {
    console.log(`💬 Mensagem [${type}]: ${message}`);
    
    const messageEl = document.createElement('div');
    messageEl.className = `flash-message flash-${type}`;
    messageEl.textContent = message;
    
    const container = document.getElementById('flash-messages');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'flash-messages';
        newContainer.className = 'flash-messages';
        document.body.appendChild(newContainer);
        container = newContainer;
    }
    
    container.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

// Exportar dados (funcionalidade futura)
function exportData() {
    showMessage('Funcionalidade de exportação em desenvolvimento.', 'info');
}

// Filtrar ranking
function filterRanking() {
    const filter = document.getElementById('ranking-filter').value;
    const rows = document.querySelectorAll('.ranking-table tbody tr');
    
    rows.forEach(row => {
        if (filter === 'all') {
            row.style.display = '';
        } else {
            const level = parseInt(row.querySelector('.ranking-level').textContent);
            if (filter === 'high' && level >= 5) {
                row.style.display = '';
            } else if (filter === 'medium' && level >= 3 && level < 5) {
                row.style.display = '';
            } else if (filter === 'low' && level < 3) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}