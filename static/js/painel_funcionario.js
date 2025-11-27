// Painel do Funcionário - Interações Expandidas

document.addEventListener('DOMContentLoaded', function() {
  // Inicializar modais
  initModals();
  
  // Inicializar formulários
  initForms();
  
  // Carregar dados iniciais
  loadInitialData();
  
  // Inicializar trilha contínua
  initContinuousPath();
  
  // Inicializar modais de atividade
  initActivityModals();
  
  // Inicializar barra de progresso
  initProgressBar();
});

// Inicializar modais
function initModals() {
  // Fechar modais ao clicar no X ou fora
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
      modal.addEventListener('click', function(e) {
          if (e.target === modal || e.target.classList.contains('modal-close')) {
              closeModal(modal);
          }
      });
  });
  
  // Botão para abrir modal de registrar métricas
  const registerMetricsBtn = document.getElementById('register-metrics-btn');
  if (registerMetricsBtn) {
      registerMetricsBtn.addEventListener('click', function() {
          openModal('metrics-modal');
      });
  }
  
  // Botão para abrir modal de vincular máquina
  const linkMachineBtn = document.getElementById('link-machine-btn');
  if (linkMachineBtn) {
      linkMachineBtn.addEventListener('click', function() {
          openModal('link-machine-modal');
      });
  }
  
  // Botão secundário para vincular máquina
  const linkMachineBtn2 = document.getElementById('link-machine-btn-2');
  if (linkMachineBtn2) {
      linkMachineBtn2.addEventListener('click', function() {
          openModal('link-machine-modal');
      });
  }
  
  // Botão para abrir modal de feedback
  const sendFeedbackBtn = document.getElementById('send-feedback-btn');
  if (sendFeedbackBtn) {
      sendFeedbackBtn.addEventListener('click', function() {
          openModal('feedback-modal');
      });
  }
}

// Abrir modal
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
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
  }
}

// Inicializar formulários
function initForms() {
  // Formulário de métricas
  const metricsForm = document.getElementById('metrics-form');
  if (metricsForm) {
      metricsForm.addEventListener('submit', handleMetricsSubmit);
      
      // Calcular eficiência em tempo real
      const energiaUtil = document.getElementById('energia_util');
      const energiaTotal = document.getElementById('energia_total');
      const eficienciaPreview = document.getElementById('eficiencia-preview');
      
      if (energiaUtil && energiaTotal && eficienciaPreview) {
          function updateEfficiency() {
              const util = parseFloat(energiaUtil.value) || 0;
              const total = parseFloat(energiaTotal.value) || 0;
              
              if (total > 0) {
                  const eficiencia = (util / total) * 100;
                  eficienciaPreview.textContent = eficiencia.toFixed(2) + '%';
                  
                  // Colorir baseado na eficiência
                  if (eficiencia >= 80) {
                      eficienciaPreview.className = 'efficiency-high';
                  } else if (eficiencia >= 60) {
                      eficienciaPreview.className = 'efficiency-medium';
                  } else {
                      eficienciaPreview.className = 'efficiency-low';
                  }
              } else {
                  eficienciaPreview.textContent = '0%';
                  eficienciaPreview.className = 'efficiency-low';
              }
          }
          
          energiaUtil.addEventListener('input', updateEfficiency);
          energiaTotal.addEventListener('input', updateEfficiency);
      }
  }
  
  // Formulário de vincular máquina
  const linkMachineForm = document.getElementById('link-machine-form');
  if (linkMachineForm) {
      linkMachineForm.addEventListener('submit', handleLinkMachineSubmit);
  }
  
  // Formulário de feedback
  const feedbackForm = document.getElementById('feedback-form');
  if (feedbackForm) {
      feedbackForm.addEventListener('submit', handleFeedbackSubmit);
      
      // Seleção de tipo de feedback
      const feedbackTypeOptions = document.querySelectorAll('.feedback-type-option');
      feedbackTypeOptions.forEach(option => {
          option.addEventListener('click', function() {
              feedbackTypeOptions.forEach(opt => opt.classList.remove('selected'));
              this.classList.add('selected');
              document.getElementById('feedback-type').value = this.dataset.type;
          });
      });
  }
}

// Manipular envio de métricas
async function handleMetricsSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const maquinaId = formData.get('maquina_id');
  const energiaUtil = parseFloat(formData.get('energia_util'));
  const energiaTotal = parseFloat(formData.get('energia_total'));
  const producao = parseFloat(formData.get('producao'));
  const emissaoGas = parseFloat(formData.get('emissao_gas') || 0);
  
  // Validação básica
  if (energiaTotal <= 0) {
      showMessage('A energia total deve ser maior que zero.', 'error');
      return;
  }
  
  if (energiaUtil > energiaTotal) {
      showMessage('A energia útil não pode ser maior que a energia total.', 'error');
      return;
  }
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Registrando...';
  submitBtn.disabled = true;
  
  try {
      const response = await fetch('/registrar_metricas', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              maquina_id: maquinaId,
              energia_util: energiaUtil,
              energia_total: energiaTotal,
              producao: producao,
              emissao_gas: emissaoGas
          })
      });
      
      const data = await response.json();
      
      if (data.status === 'sucesso') {
          showMessage(data.mensagem, 'success');
          closeModal('metrics-modal');
          e.target.reset();
          
          // Atualizar interface
          updateUserStats(data.xp_ganho);
          
          // Recarregar a página após um breve delay para mostrar a animação
          setTimeout(() => {
              window.location.reload();
          }, 1500);
      } else {
          showMessage(data.mensagem, 'error');
      }
  } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao registrar métricas. Tente novamente.', 'error');
  } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
  }
}

// Manipular vinculação de máquina
async function handleLinkMachineSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const codigoConvite = formData.get('codigo_convite');
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Vinculando...';
  submitBtn.disabled = true;
  
  try {
      const response = await fetch('/vincular_maquina', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              codigo_convite: codigoConvite
          })
      });
      
      const data = await response.json();
      
      if (data.status === 'sucesso') {
          showMessage(data.mensagem, 'success');
          closeModal('link-machine-modal');
          e.target.reset();
          
          // Recarregar a página para mostrar a nova máquina
          setTimeout(() => {
              window.location.reload();
          }, 1000);
      } else {
          showMessage(data.mensagem, 'error');
      }
  } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao vincular máquina. Tente novamente.', 'error');
  } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
  }
}

// Manipular envio de feedback
async function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const destinatarioId = formData.get('destinatario_id');
  const maquinaId = formData.get('maquina_id');
  const mensagem = formData.get('mensagem');
  const tipo = formData.get('tipo');
  
  if (!mensagem.trim()) {
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
              destinatario_id: destinatarioId,
              maquina_id: maquinaId,
              mensagem: mensagem,
              tipo: tipo
          })
      });
      
      const data = await response.json();
      
      if (data.status === 'sucesso') {
          showMessage(data.mensagem, 'success');
          closeModal('feedback-modal');
          e.target.reset();
      } else {
          showMessage(data.mensagem, 'error');
      }
  } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro ao enviar feedback. Tente novamente.', 'error');
  } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
  }
}

// Marcar feedback como lido
async function markFeedbackAsRead(feedbackId) {
  try {
      const response = await fetch('/marcar_feedback_lido', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              feedback_id: feedbackId
          })
      });
      
      const data = await response.json();
      
      if (data.status === 'sucesso') {
          // Remover o feedback da lista
          const feedbackItem = document.querySelector(`[data-feedback-id="${feedbackId}"]`);
          if (feedbackItem) {
              feedbackItem.remove();
          }
          
          // Atualizar contador de feedbacks não lidos
          updateUnreadFeedbackCount();
      }
  } catch (error) {
      console.error('Erro:', error);
  }
}

// Atualizar contador de feedbacks não lidos
function updateUnreadFeedbackCount() {
  const feedbackItems = document.querySelectorAll('.feedback-item');
  const unreadCount = feedbackItems.length;
  const badge = document.getElementById('unread-feedback-badge');
  
  if (badge) {
      if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = 'inline';
      } else {
          badge.style.display = 'none';
      }
  }
}

// Atualizar estatísticas do usuário
function updateUserStats(xpGanho) {
  // Animar ganho de XP
  const xpElement = document.querySelector('.stat-value.xp');
  if (xpElement && xpGanho) {
      const currentXp = parseInt(xpElement.textContent);
      const newXp = currentXp + xpGanho;
      
      // Animação simples de contagem
      animateValue(xpElement, currentXp, newXp, 1000);
      
      // Atualizar barra de progresso
      updateProgressBar(newXp);
  }
}

// Animação de contagem
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = value;
      if (progress < 1) {
          window.requestAnimationFrame(step);
      }
  };
  window.requestAnimationFrame(step);
}

// Inicializar barra de progresso
function initProgressBar() {
  const xpElement = document.querySelector('.stat-value.xp');
  if (xpElement) {
      const currentXp = parseInt(xpElement.textContent) || 0;
      updateProgressBar(currentXp);
  }
}

// Atualizar barra de progresso
function updateProgressBar(xp) {
  const progressBar = document.querySelector('.progress-fill');
  if (progressBar) {
      const xpInLevel = xp % 100;
      const progressPercentage = (xpInLevel / 100) * 100;
      
      progressBar.style.width = progressPercentage + '%';
  }
}

// Mostrar mensagens
function showMessage(message, type) {
  // Criar elemento de mensagem
  const messageEl = document.createElement('div');
  messageEl.className = `flash-message flash-${type}`;
  messageEl.textContent = message;
  
  // Adicionar ao container de mensagens
  const container = document.getElementById('flash-messages');
  if (!container) {
      // Criar container se não existir
      const newContainer = document.createElement('div');
      newContainer.id = 'flash-messages';
      newContainer.className = 'flash-messages';
      document.body.appendChild(newContainer);
      container = newContainer;
  }
  
  container.appendChild(messageEl);
  
  // Remover após 5 segundos
  setTimeout(() => {
      messageEl.remove();
  }, 5000);
}

// Carregar dados iniciais
function loadInitialData() {
  // Inicializar contador de feedbacks não lidos
  updateUnreadFeedbackCount();
  
  // Configurar eventos para marcar feedback como lido
  const markReadButtons = document.querySelectorAll('.mark-feedback-read');
  markReadButtons.forEach(button => {
      button.addEventListener('click', function() {
          const feedbackId = this.dataset.feedbackId;
          markFeedbackAsRead(feedbackId);
      });
  });
}

// ============================================
// TRILHA CONTÍNUA - FUNÇÕES ESPECÍFICAS
// ============================================

// Inicializar trilha contínua
function initContinuousPath() {
  const pathCircles = document.querySelectorAll('.path-circle:not(.locked)');
  
  pathCircles.forEach(circle => {
    circle.addEventListener('click', function() {
      const unitId = this.dataset.unitId;
      const unitName = this.dataset.unitName;
      const unitType = this.dataset.unitType;
      
      if (!this.classList.contains('locked')) {
        openActivityModal(unitId, unitName, unitType);
      } else {
        showMessage('Esta atividade está bloqueada. Complete as atividades anteriores para desbloqueá-la.', 'error');
      }
    });
  });
}

// Inicializar modais de atividade
function initActivityModals() {
  // Fechar modal de atividade
  const activityModals = document.querySelectorAll('.activity-modal');
  activityModals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === modal || e.target.classList.contains('modal-close')) {
        closeActivityModal(modal);
      }
    });
  });
}

// Abrir modal de atividade
function openActivityModal(unitId, unitName, unitType) {
  console.log(`Abrindo atividade: ${unitName} (${unitType})`);
  
  // Criar modal dinamicamente baseado no tipo de unidade
  const modal = createActivityModal(unitId, unitName, unitType);
  document.body.appendChild(modal);
  
  // Configurar eventos do modal
  const startBtn = modal.querySelector('#start-activity-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      startActivity(unitId, unitType);
    });
  }
  
  const skipBtn = modal.querySelector('#skip-activity-btn');
  if (skipBtn) {
    skipBtn.addEventListener('click', function() {
      skipActivity(unitId);
    });
  }
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Fechar modal de atividade
function closeActivityModal(modal) {
  if (typeof modal === 'string') {
    modal = document.getElementById(modal);
  }
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Remover modal do DOM após animação
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 300);
  }
}

// Criar modal de atividade dinamicamente
function createActivityModal(unitId, unitName, unitType) {
  const modalId = `activity-modal-${unitId}`;
  
  // Dados das atividades baseado no tipo
  const activityData = getActivityData(unitType);
  
  const modalHTML = `
    <div id="${modalId}" class="modal activity-modal">
      <div class="modal-content">
        <div class="activity-header">
          <div class="activity-icon">${activityData.icon}</div>
          <h3 class="activity-title">${activityData.title}</h3>
          <p class="activity-desc">${activityData.description}</p>
        </div>
        
        <div class="modal-body">
          <div class="activity-steps">
            <h4 style="margin-bottom: 15px; color: var(--dark-gray);">O que você vai aprender:</h4>
            ${activityData.steps.map((step, index) => `
              <div class="step-item">
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                  <h4>${step.title}</h4>
                  <p>${step.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="activity-rewards">
            <div class="rewards-title">Recompensas:</div>
            <div class="rewards-list">
              ${activityData.rewards.map(reward => `
                <div class="reward-item">
                  <span>${reward.icon}</span>
                  <span>${reward.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="activity-actions">
            <button id="skip-activity-btn" class="btn btn-secondary">Pular</button>
            <button id="start-activity-btn" class="btn btn-primary">Iniciar Atividade</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const modalElement = document.createElement('div');
  modalElement.innerHTML = modalHTML;
  return modalElement.firstElementChild;
}

// Obter dados da atividade baseado no tipo
function getActivityData(unitType) {
  const activities = {
    'fundamentos': {
      icon: '📚',
      title: 'Fundamentos da Energia',
      description: 'Aprenda os conceitos básicos de eficiência energética',
      steps: [
        {
          title: 'O que é Eficiência Energética',
          description: 'Entenda o conceito e sua importância no ambiente industrial'
        },
        {
          title: 'Tipos de Energia',
          description: 'Conheça as diferentes formas de energia utilizadas'
        },
        {
          title: 'Unidades de Medida',
          description: 'Aprenda a converter e interpretar unidades energéticas'
        }
      ],
      rewards: [
        { icon: '⚡', text: '+25 XP' },
        { icon: '📊', text: 'Conhecimento Básico' },
        { icon: '🎯', text: 'Badge Iniciante' }
      ]
    },
    'monitoramento': {
      icon: '📊',
      title: 'Monitoramento de Consumo',
      description: 'Aprenda a monitorar e registrar métricas de consumo energético',
      steps: [
        {
          title: 'Identificar Parâmetros',
          description: 'Conheça os principais parâmetros de monitoramento'
        },
        {
          title: 'Coletar Dados',
          description: 'Aprenda a coletar dados de consumo e produção'
        },
        {
          title: 'Registrar Métricas',
          description: 'Saiba como registrar as métricas corretamente'
        }
      ],
      rewards: [
        { icon: '⚡', text: '+30 XP' },
        { icon: '🔍', text: 'Habilidade de Monitoramento' },
        { icon: '📈', text: 'Badge de Analista' }
      ]
    },
    'praticas': {
      icon: '💡',
      title: 'Práticas de Eficiência',
      description: 'Implemente melhorias para aumentar a eficiência energética',
      steps: [
        {
          title: 'Identificar Oportunidades',
          description: 'Encontre áreas com potencial de otimização'
        },
        {
          title: 'Planejar Ações',
          description: 'Desenvolva um plano de ações de melhoria'
        },
        {
          title: 'Implementar Mudanças',
          description: 'Aplique as melhorias identificadas'
        }
      ],
      rewards: [
        { icon: '⚡', text: '+35 XP' },
        { icon: '🚀', text: 'Habilidade de Otimização' },
        { icon: '💡', text: 'Badge de Inovador' }
      ]
    },
    'analise': {
      icon: '🔍',
      title: 'Análise de Dados',
      description: 'Analise dados históricos e identifique oportunidades de melhoria',
      steps: [
        {
          title: 'Interpretar Gráficos',
          description: 'Aprenda a ler e interpretar gráficos de eficiência'
        },
        {
          title: 'Identificar Tendências',
          description: 'Identifique padrões e tendências nos dados'
        },
        {
          title: 'Comparar Desempenho',
          description: 'Compare o desempenho atual com metas estabelecidas'
        }
      ],
      rewards: [
        { icon: '⚡', text: '+40 XP' },
        { icon: '📊', text: 'Habilidade de Análise' },
        { icon: '🎯', text: 'Badge de Estrategista' }
      ]
    },
    'sustentabilidade': {
      icon: '🌿',
      title: 'Práticas Sustentáveis',
      description: 'Adote práticas sustentáveis e reduza o impacto ambiental',
      steps: [
        {
          title: 'Reduzir Consumo',
          description: 'Aprenda técnicas para reduzir o consumo energético'
        },
        {
          title: 'Minimizar Resíduos',
          description: 'Implemente práticas para minimizar resíduos'
        },
        {
          title: 'Promover Conscientização',
          description: 'Compartilhe conhecimento sobre sustentabilidade'
        }
      ],
      rewards: [
        { icon: '⚡', text: '+45 XP' },
        { icon: '🌎', text: 'Habilidade de Sustentabilidade' },
        { icon: '♻️', text: 'Badge de Guardião Verde' }
      ]
    },
    'otimizacao': {
      icon: '⚡',
      title: 'Otimização Avançada',
      description: 'Domine técnicas avançadas para máxima eficiência energética',
      steps: [
        {
          title: 'Análise Avançada',
          description: 'Técnicas sofisticadas de análise de dados'
        },
        {
          title: 'Otimização de Processos',
          description: 'Melhore processos para máxima eficiência'
        },
        {
          title: 'Gestão da Eficiência',
          description: 'Estratégias de gestão para eficiência contínua'
        }
      ],
      rewards: [
        { icon: '⚡', text: '+50 XP' },
        { icon: '🏆', text: 'Habilidade de Especialista' },
        { icon: '⭐', text: 'Badge de Mestre' }
      ]
    }
  };
  
  return activities[unitType] || activities['fundamentos'];
}

// Iniciar atividade
async function startActivity(unitId, unitType) {
  console.log(`Iniciando atividade: ${unitId} - ${unitType}`);
  
  try {
    const response = await fetch('/iniciar_atividade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unit_id: unitId,
        unit_type: unitType
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'sucesso') {
      showMessage('Atividade iniciada com sucesso!', 'success');
      // Fechar modal de introdução e abrir conteúdo
      closeActivityModal(`activity-modal-${unitId}`);
      showActivityContent(unitId, unitType);
    } else {
      showMessage(data.mensagem, 'error');
    }
  } catch (error) {
    console.error('Erro ao iniciar atividade:', error);
    showMessage('Erro ao iniciar atividade. Tente novamente.', 'error');
  }
}

// Pular atividade
function skipActivity(unitId) {
  if (confirm('Tem certeza que deseja pular esta atividade? Você não ganhará XP.')) {
    closeActivityModal(`activity-modal-${unitId}`);
    showMessage('Atividade pulada. Você pode retornar a ela depois.', 'info');
  }
}

// Mostrar conteúdo da atividade
function showActivityContent(unitId, unitType) {
  // Simular conteúdo da atividade (em um sistema real, isso viria do backend)
  const activityContent = `
    <div class="activity-content">
      <h3>Conteúdo da Atividade</h3>
      <p>Esta é uma simulação do conteúdo da atividade. Em um sistema real, aqui estaria o material educativo interativo.</p>
      
      <div class="form-group" style="margin-top: 20px;">
        <label class="form-label">Qual é a eficiência energética ideal para uma máquina industrial?</label>
        <select class="form-select" id="efficiency-question">
          <option value="">Selecione uma opção</option>
          <option value="60">60%</option>
          <option value="75">75%</option>
          <option value="85">85% ou mais</option>
          <option value="95">95%</option>
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Descreva uma prática de eficiência energética que você pode implementar:</label>
        <textarea class="form-input" id="practice-description" rows="3" placeholder="Descreva sua resposta..."></textarea>
      </div>
      
      <button id="complete-activity-btn" class="btn btn-primary" style="width: 100%; margin-top: 20px;">
        Concluir Atividade
      </button>
    </div>
  `;
  
  // Criar modal de conteúdo
  const contentModal = document.createElement('div');
  contentModal.id = `activity-content-${unitId}`;
  contentModal.className = 'modal activity-modal';
  contentModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">${getActivityData(unitType).title}</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${activityContent}
      </div>
    </div>
  `;
  
  document.body.appendChild(contentModal);
  
  // Configurar evento de conclusão
  const completeBtn = contentModal.querySelector('#complete-activity-btn');
  if (completeBtn) {
    completeBtn.addEventListener('click', function() {
      const efficiencyAnswer = contentModal.querySelector('#efficiency-question').value;
      const practiceDescription = contentModal.querySelector('#practice-description').value;
      
      if (!efficiencyAnswer || !practiceDescription.trim()) {
        showMessage('Por favor, responda todas as questões antes de concluir.', 'error');
        return;
      }
      
      // Calcular eficiência baseado nas respostas (simulação)
      const eficiencia = efficiencyAnswer === '85' ? 90 : 
                        efficiencyAnswer === '95' ? 80 : 
                        practiceDescription.length > 20 ? 75 : 60;
      
      completeActivity(unitId, eficiencia);
    });
  }
  
  contentModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Concluir atividade
async function completeActivity(unitId, eficiencia) {
  const xpGanho = Math.floor(eficiencia / 4); // XP baseado na eficiência
  
  try {
    const response = await fetch('/completar_unidade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unit_id: unitId,
        xp: xpGanho,
        eficiencia: eficiencia
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'sucesso') {
      showMessage(`Atividade concluída! +${xpGanho} XP ganhos. Eficiência: ${eficiencia}%`, 'success');
      updatePathProgress(unitId);
      
      // Fechar modal de conteúdo
      closeActivityModal(`activity-content-${unitId}`);
      
      // Atualizar estatísticas do usuário
      updateUserStats(xpGanho);
    } else {
      showMessage(data.mensagem, 'error');
    }
  } catch (error) {
    console.error('Erro ao completar atividade:', error);
    showMessage('Erro ao completar atividade. Tente novamente.', 'error');
  }
}

// Atualizar progresso na trilha
function updatePathProgress(unitId) {
  const pathCircle = document.querySelector(`[data-unit-id="${unitId}"]`);
  if (pathCircle) {
    pathCircle.classList.remove('active');
    pathCircle.classList.add('completed');
    
    // Atualizar conteúdo correspondente
    const pathContent = pathCircle.closest('.path-item').querySelector('.path-content');
    if (pathContent) {
      pathContent.classList.add('completed');
    }
    
    // Atualizar XP
    const pathXp = pathCircle.closest('.path-item').querySelector('.path-xp');
    if (pathXp) {
      pathXp.classList.add('completed');
    }
    
    // Atualizar status
    const pathStatus = pathCircle.closest('.path-item').querySelector('.path-status');
    if (pathStatus) {
      pathStatus.textContent = 'Concluído';
      pathStatus.className = 'path-status status-completed';
    }
    
    // Verificar se pode desbloquear próxima atividade
    checkNextActivityUnlock(unitId);
  }
}

// Verificar desbloqueio da próxima atividade
function checkNextActivityUnlock(completedUnitId) {
  const currentItem = document.querySelector(`[data-unit-id="${completedUnitId}"]`).closest('.path-item');
  const nextItem = currentItem.nextElementSibling;
  
  if (nextItem && nextItem.classList.contains('path-item')) {
    const nextCircle = nextItem.querySelector('.path-circle');
    const nextContent = nextItem.querySelector('.path-content');
    
    if (nextCircle && nextCircle.classList.contains('locked')) {
      nextCircle.classList.remove('locked');
      nextCircle.classList.add('active');
      
      if (nextContent) {
        nextContent.classList.remove('locked');
      }
      
      showMessage('Parabéns! Você desbloqueou a próxima atividade!', 'success');
    }
  }
}