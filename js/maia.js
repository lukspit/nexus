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

    // Fluxo de Perguntas (A Máquina de Estados)
    this.currentStep = 0;
    this.flow = [
      {
        id: 'abertura',
        bot: ["Olá. Sou a Maia, a inteligência virtual da Nexus.", "Vou fazer um diagnóstico rápido da sua operação para ver onde você está perdendo dinheiro.", "Para começar, com quem estou falando?"],
        type: 'text',
        placeholder: 'Seu nome ou como prefere ser chamado',
        field: 'nome'
      },
      {
        id: 'papel',
        bot: (data) => [`Prazer, ${data.nome.split(' ')[0]}. Qual o seu papel atual na clínica?`],
        type: 'options',
        options: [
          { label: 'Sou o Médico/Dono', value: 'medico_dono' },
          { label: 'Sou Gestor/Gerente', value: 'gestor' },
          { label: 'Secretária/Recepção', value: 'secretaria' },
          { label: 'Outro', value: 'outro' }
        ],
        field: 'cargo'
      },
      {
        id: 'volume',
        bot: (data) => {
          let prefix = "";
          if (data.cargo === 'medico_dono') prefix = "Entendi. Vamos focar em recuperar o tempo que você perde no operacional e focar no lucro.";
          else if (data.cargo === 'gestor') prefix = "Perfeito. Vamos ver como otimizar a performance da sua equipe de atendimento.";
          else prefix = "Legal. Vamos tentar facilitar o seu dia a dia.";

          return [prefix, "Me diz uma coisa: qual o volume aproximado de leads/mensagens novas vocês recebem por dia (WhatsApp/Direct)?"];
        },
        type: 'options',
        options: [
          { label: 'Menos de 10/dia', value: 'baixo' },
          { label: 'De 10 a 50/dia', value: 'medio' },
          { label: 'Mais de 50/dia', value: 'alto' }
        ],
        field: 'volume'
      },
      {
        id: 'tempo_resposta',
        bot: (data) => {
          let prefix = "Ok. É o momento ideal para estruturar a automação.";
          if (data.volume === 'alto' || data.volume === 'medio') {
            prefix = "Esse é um volume crítico. Se não houver escala no atendimento, vocês perdem vendas todos os dias.";
          }
          return [prefix, "Sendo bem transparente: quanto tempo, em média, um lead leva para receber a primeira resposta hoje?"];
        },
        type: 'options',
        options: [
          { label: 'Imediatamente (equipe 100% dedicada)', value: 'imediato' },
          { label: 'Alguns minutos a horas', value: 'horas' },
          { label: 'Só no fim do dia ou muitas passam batido', value: 'lento' }
        ],
        field: 'tempo_resposta'
      },
      {
        id: 'infraestrutura',
        bot: (data) => {
          let prefix = "O Lead Response Time ideal para converter é de apenas 5 minutos. Se passa disso, a chance de conversão despenca 100x.";
          if (data.tempo_resposta === 'imediato') prefix = "Excelente que vocês já são rápidos. Mas isso deve custar caro e depender muito de pessoas.";

          return [prefix, "Vocês já utilizam algum CRM médico ou sistema de agendamento?"];
        },
        type: 'options',
        options: [
          { label: 'Sim (Doctoralia, Feegow, iClinic, etc)', value: 'sim' },
          { label: 'Não, usamos planilhas ou agenda de papel', value: 'nao' }
        ],
        field: 'sistema_atual'
      },
      {
        id: 'email',
        bot: (data) => {
          let prefix = "Excelente. O Nexus se conecta nativamente para ler e salvar no seu sistema.";
          if (data.sistema_atual === 'nao') prefix = "Sem problemas. O Nexus pode organizar essa base inicial pra você.";
          return [prefix, "Seu diagnóstico prévio está pronto.", "Qual o seu melhor e-mail para eu enviar o relatório técnico e os detalhes da plataforma?"];
        },
        type: 'text',
        subtype: 'email',
        placeholder: 'seu@melhoremail.com',
        field: 'email'
      },
      {
        id: 'telefone',
        bot: ["Excelente. Última coisa para terminarmos:", "Qual o seu número de WhatsApp (com DDD) para um atendimento humano caso necessário?"],
        type: 'text',
        subtype: 'tel',
        placeholder: '(11) 99999-9999',
        field: 'telefone'
      }
    ];

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
    this.currentStep = 0;
    this.collectedData = {};

    // 1) Criar a row no Supabase
    await this.initSupabaseLead();

    // 2) Executar primeira etapa
    this.processStep();
  }

  async processStep() {
    if (this.currentStep >= this.flow.length) {
      this.finishDiagnostic();
      return;
    }

    const stepInfo = this.flow[this.currentStep];

    // Clear Input Area
    this.clearInputArea();

    // Prepare Messages
    let messages = stepInfo.bot;
    if (typeof messages === 'function') {
      messages = messages(this.collectedData);
    }

    // Show Messages with typing delay
    for (let i = 0; i < messages.length; i++) {
      this.showTypingIndicator();
      await this.sleep(this.typingSpeed);
      this.hideTypingIndicator();
      this.addBotMessage(messages[i]);
    }

    // Render Input mechanism
    this.renderInputBlock(stepInfo);
  }

  // --- INPUT RENDERING ---

  clearInputArea() {
    this.inputContainer.innerHTML = '';
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
    // 1. Clear input area to stop double clicking
    this.clearInputArea();

    // 2. Render user message block
    this.addUserMessage(displayValue);

    // 3. Save to state
    this.collectedData[fieldName] = storedValue;

    // 4. Async Save to Supabase (Background)
    this.updateSupabaseLead();

    // 5. Next Step
    this.currentStep++;
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
    this.showTypingIndicator();
    await this.sleep(1000);
    this.hideTypingIndicator();

    this.addBotMessage("Muito obrigado pelas informações.");

    await this.sleep(800);
    this.addBotMessage("Finalizando seu diagnóstico estratégico e encaminhando para a equipe da Nexus...");

    // Final Supabase Update
    if (this.supabase && this.leadId) {
      await this.supabase
        .from('leads')
        .update({ status: 'completed', data: this.collectedData })
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
