/**
 * NEXUS - MAIA DIAGNOSTIC INTELLIGENCE
 * Lógica do Overlay Interativo (Chat) + Supabase
 */

class NexusMaia {
  constructor() {
    // ---- DOM Elements ----
    this.overlay = document.getElementById('maiaOverlay');
    this.closeBtn = document.getElementById('closeMaiaBtn');
    this.triggerBtns = document.querySelectorAll('.btn-open-maia, a[href="#diagnostico"]');
    this.chatArea = document.getElementById('maiaChatArea');
    this.inputContainer = document.getElementById('maiaInputContainer');
    this.typingIndicator = document.getElementById('maiaTypingIndicator');

    // ---- Setup Supabase ----
    const SUPABASE_URL = 'https://ktxjlkdhxbcjmczsfqlv.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eGpsa2RoeGJjam1jenNmcWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzUyNzQsImV4cCI6MjA3Njc1MTI3NH0.w3O6ByJEOgnQrnLTkvTnugVBDBsLN51SGgSq16tyVU8';

    // Initialize Supabase only if keys exist to prevent errors on the landing page
    if (SUPABASE_URL && SUPABASE_KEY && window.supabase) {
      this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
      console.warn("Nexus Maia: Supabase não configurado.");
      this.supabase = null;
    }

    // Lead State
    this.leadId = null;
    this.collectedData = {};
    this.hasStarted = false;

    // Config
    this.typingSpeed = 800; // ms to pretend typing

    // Fluxo de Perguntas (Máquina de Estados - Branching / Nós)
    this.currentStep = 'abertura';
    this.flow = {
      abertura: {
        bot: ["Olá. Eu sou a Maia. Vou fazer 4 perguntas rápidas para projetar o que sua clínica está perdendo e liberar seu diagnóstico.", "Qual o seu nome?"],
        type: 'text',
        placeholder: 'Seu nome ou como prefere ser chamado',
        field: 'nome',
        next: 'papel'
      },
      papel: {
        bot: (data) => [`Prazer, ${data.nome.split(' ')[0]}. Qual seu cargo na clínica?`],
        type: 'options',
        options: [
          { label: 'Sou o Médico/Dono', value: 'medico_dono' },
          { label: 'Sou Gestor/Gerente', value: 'gestor' },
          { label: 'Secretária/Recepção', value: 'secretaria' },
          { label: 'Outro', value: 'outro' }
        ],
        field: 'cargo',
        next: 'volume'
      },
      volume: {
        bot: (data) => {
          return ["Em média, quantos atendimentos/orçamentos pelo WhatsApp vocês recebem por dia?"];
        },
        type: 'options',
        options: [
          { label: 'Menos de 10/dia', value: 'baixo' },
          { label: 'De 10 a 50/dia', value: 'medio' },
          { label: 'Mais de 50/dia', value: 'alto' }
        ],
        field: 'volume',
        next: 'faturamento'
      },
      faturamento: {
        bot: (data) => ["E qual a média de faturamento mensal hoje?"],
        type: 'options',
        options: [
          { label: 'Abaixo de R$ 50k', value: 'baixo' },
          { label: 'De R$ 50k a R$ 150k', value: 'medio' },
          { label: 'Acima de R$ 150k', value: 'alto' }
        ],
        field: 'faturamento',
        next: (data) => {
          if (data.volume === 'baixo' && data.faturamento === 'baixo') return 'desqualificacao_email';
          return 'tempo_resposta';
        }
      },
      tempo_resposta: {
        bot: (data) => ["Atualmente, quanto tempo um paciente leva para receber a 1ª resposta no WhatsApp da clínica?"],
        type: 'options',
        options: [
          { label: 'Imediatamente (equipe dedicada)', value: 'imediato' },
          { label: 'Alguns minutos a horas', value: 'horas' },
          { label: 'Só no fim do dia ou muitas ficam sem resposta', value: 'lento' }
        ],
        field: 'tempo_resposta',
        next: 'sistema_atual'
      },
      sistema_atual: {
        bot: (data) => {
          return ["Vocês já utilizam algum CRM médico ou sistema de agendamento online hoje?"];
        },
        type: 'options',
        options: [
          { label: 'Sim (Doctoralia, Feegow, iClinic, etc)', value: 'sim' },
          { label: 'Não, usamos planilhas ou agenda de papel', value: 'nao' }
        ],
        field: 'sistema_atual',
        next: 'email_hot'
      },
      email_hot: {
        bot: (data) => {
          return [
            "Diagnóstico pronto. Onde devo enviar o seu relatório personalizado?",
          ];
        },
        type: 'text',
        subtype: 'email',
        placeholder: 'seu@melhoremail.com',
        field: 'email',
        next: 'whatsapp_hot'
      },
      whatsapp_hot: {
        bot: ["Perfeito. Qual o seu WhatsApp (com DDD) para enviarmos o acesso exclusivo e o executivo da Nexus te chamar?"],
        type: 'text',
        subtype: 'tel',
        placeholder: '(11) 99999-9999',
        field: 'telefone',
        next: null // Fim fluxo quente
      },

      // --- ROTA DESQUALIFICADA (SOFT-REJECTION) ---
      desqualificacao_email: {
        bot: (data) => [
          `Sendo muito transparente com você, ${data.nome.split(' ')[0]}: o Nexus é uma infraestrutura de inteligência artificial projetada para escalar operações com alta demanda.`,
          "Para o seu limite de pacientes atual, a plataforma seria um recurso subutilizado. O ideal agora é você focar fortemente em alcance e tráfego orgânico/pago.",
          "Mas quero te ajudar: posso te enviar um material técnico no e-mail sobre estratégias para gerar mais escala para clínicas. Qual e-mail utilizo?"
        ],
        type: 'text',
        subtype: 'email',
        placeholder: 'seu@melhoremail.com',
        field: 'email',
        next: null // Fim fluxo frio e educado
      }
    };

    this.initEvents();
  }

  initEvents() {
    if (!this.overlay) return;

    // Open Overlay
    this.triggerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openOverlay();
      });
    });

    // Close Overlay
    this.closeBtn.addEventListener('click', () => {
      this.closeOverlay();
    });
  }

  // --- UI CONTROLS ---

  openOverlay() {
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Start flow if empty
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.chatArea.innerHTML = ''; // Clean any existing HTML comments
      this.chatArea.appendChild(this.typingIndicator); // Make sure typing indicator is there
      this.startDiagnosticSession();
    }
  }

  closeOverlay() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatArea.scrollTop = this.chatArea.scrollHeight;
    }, 50);
  }

  // --- CORE ENGINE ---

  async startDiagnosticSession() {
    this.currentStep = 'abertura';
    this.collectedData = {};

    // 1) Criar a row no Supabase (background, não bloqueia a UX)
    this.initSupabaseLead();

    // 2) Executar primeira etapa imediatamente
    this.processStep();
  }

  async processStep() {
    if (!this.currentStep || !this.flow[this.currentStep]) {
      this.finishDiagnostic();
      return;
    }

    const stepInfo = this.flow[this.currentStep];

    // Maintain the text bar visual if option is coming, or placeholder
    this.renderDisabledTextInput();

    // Prepare Messages
    let messages = stepInfo.bot;
    if (typeof messages === 'function') {
      messages = messages(this.collectedData);
    }

    // Show Messages with typing delay
    for (let i = 0; i < messages.length; i++) {
      this.showTypingIndicator();

      let delay = 2500;
      if (this.currentStep === 'abertura' && i === 0) {
        delay = 0; // instantâneo na abertura
      } else if (messages[i].length < 40) {
        delay = 1000;
      } else {
        delay = 2000 + (Math.random() * 1000); // Between 2 and 3 secs
      }

      await this.sleep(delay);
      this.hideTypingIndicator();
      this.addBotMessage(messages[i]);
    }

    // Render Input mechanism
    this.clearInputArea();
    this.renderInputBlock(stepInfo);
  }

  // --- INPUT RENDERING ---

  clearInputArea() {
    this.inputContainer.innerHTML = '';
  }

  renderDisabledTextInput() {
    this.clearInputArea();
    const wrapper = document.createElement('div');
    wrapper.className = 'maia-text-input-wrapper';
    wrapper.style.opacity = '0.5';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'maia-text-input';
    input.placeholder = 'Aguarde...';
    input.disabled = true;

    const btn = document.createElement('button');
    btn.className = 'maia-send-btn';
    btn.disabled = true;
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    this.inputContainer.appendChild(wrapper);
  }

  renderInputBlock(stepInfo) {
    if (stepInfo.type === 'text') {
      this.renderTextInput(stepInfo);
    } else if (stepInfo.type === 'options') {
      this.renderOptionsInput(stepInfo);
    }
  }

  renderTextInput(stepInfo) {
    const wrapper = document.createElement('div');
    wrapper.className = 'maia-text-input-wrapper';

    // Create animated entry
    wrapper.style.opacity = '0';
    wrapper.style.transform = 'translateY(10px)';
    wrapper.style.transition = 'opacity 0.3s, transform 0.3s';

    const input = document.createElement('input');
    input.type = stepInfo.subtype || 'text';
    input.className = 'maia-text-input';
    input.placeholder = stepInfo.placeholder || 'Digite...';

    const btn = document.createElement('button');
    btn.className = 'maia-send-btn';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    this.inputContainer.appendChild(wrapper);

    // Fade in
    setTimeout(() => {
      wrapper.style.opacity = '1';
      wrapper.style.transform = 'translateY(0)';
      input.focus(); // Auto-focus no mobile pode dar problema, testar dps
    }, 100);

    // Event listeners
    const handleSend = () => {
      const val = input.value.trim();
      if (!val) return;

      // Basic validate email
      if (stepInfo.subtype === 'email' && !val.includes('@')) {
        this.addBotMessage("Por favor, digite um formato de e-mail válido.");
        return;
      }

      this.handleUserReply(val, val, stepInfo.field);
    };

    btn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  renderOptionsInput(stepInfo) {
    const wrapper = document.createElement('div');
    wrapper.className = 'maia-options-wrapper';

    stepInfo.options.forEach((opt, index) => {
      const btn = document.createElement('button');
      btn.className = 'maia-option-btn';
      btn.textContent = opt.label;
      btn.style.animationDelay = `${index * 0.1}s`; // Stagger animation

      btn.addEventListener('click', () => {
        this.handleUserReply(opt.label, opt.value, stepInfo.field);
      });

      wrapper.appendChild(btn);
    });

    this.inputContainer.appendChild(wrapper);
  }

  // --- REPLY LOGIC & SUPABASE ---

  async handleUserReply(displayValue, storedValue, fieldName) {
    // 1. Clear input area and block clicks with disabled input text
    this.renderDisabledTextInput();

    // 2. Render user message block
    this.addUserMessage(displayValue);

    // 3. Save to state
    this.collectedData[fieldName] = storedValue;

    // 4. Async Save to Supabase (Background)
    this.updateSupabaseLead();

    // 5. Next Step Evaluation
    const nextNode = this.flow[this.currentStep].next;
    if (typeof nextNode === 'function') {
      this.currentStep = nextNode(this.collectedData);
    } else {
      this.currentStep = nextNode;
    }
    await this.processStep();
  }

  // --- DOM RENDERING ---

  addBotMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'maia-msg bot';
    msgDiv.innerHTML = `
      <div class="maia-bubble">${text}</div>
      <div class="maia-msg-time">${this.getTime()}</div>
    `;
    this.chatArea.appendChild(msgDiv);
    this.scrollToBottom();
  }

  addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'maia-msg user';
    msgDiv.innerHTML = `
      <div class="maia-bubble">${text}</div>
      <div class="maia-msg-time">${this.getTime()}</div>
    `;
    this.chatArea.appendChild(msgDiv);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    this.chatArea.appendChild(this.typingIndicator); // Move up to the end
    this.typingIndicator.classList.remove('hidden');
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.typingIndicator.classList.add('hidden');
  }

  // --- BACKEND LOGIC ---

  async initSupabaseLead() {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .insert([{ status: 'in_progress', data: {} }])
        .select('id')
        .single();

      if (data && data.id) {
        this.leadId = data.id;
      }
    } catch (e) {
      console.error("Supabase Init Error:", e);
    }
  }

  async updateSupabaseLead() {
    if (!this.supabase || !this.leadId) return;
    try {
      await this.supabase
        .from('leads')
        .update({ data: this.collectedData })
        .eq('id', this.leadId);
    } catch (e) {
      console.error("Supabase Update Error:", e);
    }
  }

  async finishDiagnostic() {
    this.renderDisabledTextInput();
    this.showTypingIndicator();
    await this.sleep(1000);
    this.hideTypingIndicator();

    // Determinar Status de Classificação do Lead
    const isDisqualified = (this.collectedData.volume === 'baixo' && this.collectedData.faturamento === 'baixo');
    const finalStatus = isDisqualified ? 'disqualified' : 'hot_lead';

    // Anexar no collectedData pra ser enviado no webhook e ver no painel se quiser
    this.collectedData.lead_status = finalStatus;

    if (isDisqualified) {
      this.addBotMessage("O material gratuito foi enviado. Te desejo muito sucesso na sua escala!");
    } else {
      this.addBotMessage("Muito obrigado pelas informações.");
      await this.sleep(800);
      this.addBotMessage("Finalizando seu diagnóstico estratégico e encaminhando para a equipe da Nexus...");
    }

    // Final Supabase Update
    if (this.supabase && this.leadId) {
      await this.supabase
        .from('leads')
        .update({ status: finalStatus, data: this.collectedData })
        .eq('id', this.leadId);
    }

    // Call N8n webhook
    await this.callN8nWebhook();

    await this.sleep(2000);
    this.addBotMessage("Enviado com sucesso! Entraremos em contato assim que possível.");

    // Add close button
    const endDiv = document.createElement('div');
    endDiv.innerHTML = `<button class="btn btn-secondary mt-3" style="font-size: 0.9rem;" onclick="document.getElementById('closeMaiaBtn').click()">Fechar e Voltar ao Site</button>`;
    endDiv.style.textAlign = 'center';
    endDiv.style.marginTop = '20px';
    this.chatArea.appendChild(endDiv);
    this.scrollToBottom();
  }

  async callN8nWebhook() {
    const webhookURL = 'https://n8n-n8n.as5fee.easypanel.host/webhook/nexuspagina';
    if (!webhookURL) return;

    // Map internal values to readable labels for the report
    const cargoLabels = {
      'medico_dono': 'Médico / Dono da Clínica',
      'gestor': 'Gestor / Gerente',
      'secretaria': 'Secretária / Recepção',
      'outro': 'Outro'
    };
    const volumeLabels = {
      'baixo': 'Menos de 10 atendimentos/dia',
      'medio': 'De 10 a 50 atendimentos/dia',
      'alto': 'Mais de 50 atendimentos/dia'
    };
    const faturamentoLabels = {
      'baixo': 'Abaixo de R$ 50k/mês',
      'medio': 'De R$ 50k a R$ 150k/mês',
      'alto': 'Acima de R$ 150k/mês'
    };
    const tempoRespostaLabels = {
      'imediato': 'Imediatamente (equipe dedicada)',
      'horas': 'Alguns minutos a horas',
      'lento': 'Fim do dia ou ficam sem resposta'
    };
    const sistemaLabels = {
      'sim': 'Sim (CRM / sistema de agendamento)',
      'nao': 'Não (planilhas ou agenda de papel)'
    };

    const d = this.collectedData;

    // Build enriched payload
    const payload = {
      // --- Identificação ---
      source: 'landing_page_maia',
      lead_id: this.leadId,
      timestamp: new Date().toISOString(),

      // --- Dados do Lead ---
      lead: {
        nome: d.nome || '',
        email: d.email || '',
        telefone: d.telefone || '',
        cargo: cargoLabels[d.cargo] || d.cargo || '',
        cargo_raw: d.cargo || ''
      },

      // --- Perfil da Clínica ---
      clinica: {
        volume_atendimentos: volumeLabels[d.volume] || d.volume || '',
        volume_raw: d.volume || '',
        faturamento_mensal: faturamentoLabels[d.faturamento] || d.faturamento || '',
        faturamento_raw: d.faturamento || '',
        tempo_resposta_whatsapp: tempoRespostaLabels[d.tempo_resposta] || d.tempo_resposta || '',
        tempo_resposta_raw: d.tempo_resposta || '',
        usa_crm: sistemaLabels[d.sistema_atual] || d.sistema_atual || '',
        sistema_atual_raw: d.sistema_atual || ''
      },

      // --- Classificação automática ---
      classificacao: {
        status: d.lead_status || 'unknown',
        is_qualified: d.lead_status === 'hot_lead',
        urgencia: this.calcularUrgencia(d),
        potencial_perda_mensal: this.estimarPerdaMensal(d)
      },

      // --- Dados brutos (fallback) ---
      raw_data: { ...d }
    };

    try {
      await fetch(webhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("N8n Webhook Error:", error);
    }
  }

  // --- Helpers para enriquecimento ---

  calcularUrgencia(d) {
    let score = 0;
    if (d.volume === 'alto') score += 3;
    else if (d.volume === 'medio') score += 2;
    else score += 1;

    if (d.faturamento === 'alto') score += 3;
    else if (d.faturamento === 'medio') score += 2;
    else score += 1;

    if (d.tempo_resposta === 'lento') score += 3;
    else if (d.tempo_resposta === 'horas') score += 2;
    else score += 1;

    if (d.sistema_atual === 'nao') score += 1;

    if (score >= 9) return 'alta';
    if (score >= 6) return 'media';
    return 'baixa';
  }

  estimarPerdaMensal(d) {
    // Estimativa simplificada baseada nos dados coletados
    const volumeMap = { 'baixo': 5, 'medio': 30, 'alto': 75 };
    const ticketMedio = 350; // ticket médio de consulta
    const taxaPerda = d.tempo_resposta === 'lento' ? 0.35 : d.tempo_resposta === 'horas' ? 0.20 : 0.05;

    const atendimentosDia = volumeMap[d.volume] || 10;
    const perdaDiaria = Math.round(atendimentosDia * taxaPerda);
    const perdaMensal = perdaDiaria * 22 * ticketMedio; // 22 dias úteis

    return {
      leads_perdidos_dia: perdaDiaria,
      leads_perdidos_mes: perdaDiaria * 22,
      estimativa_reais: `R$ ${perdaMensal.toLocaleString('pt-BR')}`,
      valor_numerico: perdaMensal
    };
  }

  // --- UTILS ---
  getTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize on Document Load
document.addEventListener('DOMContentLoaded', () => {
  window.nexusMaia = new NexusMaia();
});
