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
        bot: ["Olá. Sou a Maia, a inteligência virtual da Nexus.", "Vou conduzir um mapeamento rápido da sua operação para projetar o seu potencial de recuperação de ROI.", "Para começar, com quem estou falando?"],
        type: 'text',
        placeholder: 'Seu nome ou como prefere ser chamado',
        field: 'nome',
        next: 'papel'
      },
      papel: {
        bot: (data) => [`Prazer, ${data.nome.split(' ')[0]}. Qual o seu papel executivo/operacional na clínica hoje?`],
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
          let prefix = "";
          if (data.cargo === 'medico_dono') prefix = "Entendido. Nosso foco será devolver o seu tempo estratégico e maximizar sua margem real de lucro.";
          else if (data.cargo === 'gestor') prefix = "Perfeito. Vamos focar em escalar a performance operacional e a conversão do seu time.";
          else prefix = "Certo. Vamos entender como a infraestrutura da Nexus se aplica à sua rotina.";

          return [prefix, "Para entender a demanda atual: qual o volume aproximado de leads/mensagens novas vocês recebem por dia (WhatsApp/Direct)?"];
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
        bot: (data) => ["Com base nesse volume, e visando entender o impacto financeiro da nossa IA na sua operação...", "Qual a faixa de faturamento médio da clínica hoje?"],
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
        bot: (data) => ["E sendo bem pragmático em relação ao atendimento atual: quanto tempo, em média, um paciente leva para receber a primeira resposta da clínica hoje?"],
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
          let prefix = "Pacientes de alto padrão não têm paciência para aguardar. A curva de evasão é altíssima após os primeiros 5 minutos.";
          if (data.tempo_resposta === 'imediato') prefix = "Excelente tempo de resposta. O problema é que isso custa muito caro e não escala sem inflar a folha de pagamento.";
          return [prefix, "Vocês já utilizam algum CRM médico ou sistema de agendamento?"];
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
          let prefix = "Perfeito. O Nexus se conecta nativamente organizando todo esse gargalo e injetando consultas direto na agenda.";
          if (data.sistema_atual === 'nao') prefix = "Sem problemas. A infraestrutura do Nexus organiza exatamente esse gargalo de forma automática.";
          return [
            prefix,
            `Analisando a sua faixa de faturamento e o delay de resposta... A sua evasão de pacientes agendados está custando dezenas de milhares de reais anualmente à clínica. É essa perda silenciosa que o Nexus elimina instantaneamente.`,
            "Qual o seu melhor e-mail executivo para enviarmos a projeção comercial?"
          ];
        },
        type: 'text',
        subtype: 'email',
        placeholder: 'seu@melhoremail.com',
        field: 'email',
        next: 'whatsapp_hot'
      },
      whatsapp_hot: {
        bot: ["Excelente. A projeção será mapeada pela nossa equipe corporativa.", "Para enviarmos e conectarmos você com nosso executivo Comercial: qual o seu WhatsApp (com DDD)?"],
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

    // 1) Criar a row no Supabase
    await this.initSupabaseLead();

    // 2) Executar primeira etapa
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

      let delay = 3500;
      if (this.currentStep === 'abertura' && i === 0) {
        delay = 1000; // fast start
      } else if (messages[i].length < 40) {
        delay = 2000;
      } else {
        delay = 3000 + (Math.random() * 1000); // Between 3 and 4 secs
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
    const webhookURL = 'https://n8n-n8n.as5fee.easypanel.host/webhook/nexus';
    if (!webhookURL) return;

    try {
      await fetch(webhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'Nexus Maia Diagnostic',
          leadId: this.leadId,
          data: this.collectedData,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("N8n Webhook Error:", error);
    }
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
