// ===== HELPERS =====

function getAtividades() {
  return JSON.parse(localStorage.getItem('atividades')) || [];
}

function salvarAtividades(lista) {
  localStorage.setItem('atividades', JSON.stringify(lista));
}

function getLimite() {
  return parseInt(localStorage.getItem('limite-diario'), 10) || 120;
}

function getNome() {
  return localStorage.getItem('nome-usuario') || '';
}

function getDataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== NAVEGAÇÃO =====

function voltar() {
  window.history.back();
}

// ===== LOGIN =====

function login() {
  const input = document.getElementById('nome-usuario');
  const nome = input ? input.value.trim() : '';

  if (!nome) {
    input.style.borderColor = '#e74c3c';
    input.placeholder = 'Digite seu nome para continuar!';
    input.focus();
    setTimeout(() => { input.style.borderColor = ''; }, 2000);
    return;
  }

  localStorage.setItem('nome-usuario', nome);
  window.location.href = 'agenda.html';
}

// ===== SAUDAÇÃO =====

function exibirSaudacao() {
  const el = document.getElementById('saudacao');
  if (!el) return;

  const nome = getNome();
  if (!nome) {
    window.location.href = 'index.html';
    return;
  }

  const hora = new Date().getHours();
  let periodo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  el.innerHTML = `<p>${periodo}, <strong>${nome}</strong>! 👋 Registre seu uso de hoje.</p>`;
}

// ===== SALVAR ATIVIDADE =====

function salvarAtividade() {
  const dataInput  = document.getElementById('data-atividade');
  const appInput   = document.getElementById('app-atividade');
  const tempoInput = document.getElementById('tempo-atividade');

  if (!dataInput || !appInput || !tempoInput) return;

  const data  = dataInput.value;
  const app   = appInput.value.trim();
  const tempo = parseInt(tempoInput.value, 10);

  // Validação
  let ok = true;
  [dataInput, appInput, tempoInput].forEach(el => el.style.borderColor = '');

  if (!data)          { dataInput.style.borderColor  = '#e74c3c'; ok = false; }
  if (!app)           { appInput.style.borderColor   = '#e74c3c'; ok = false; }
  if (isNaN(tempo) || tempo < 1) { tempoInput.style.borderColor = '#e74c3c'; ok = false; }

  if (!ok) return;

  const atividades = getAtividades();
  atividades.push({ data, app, tempo });
  salvarAtividades(atividades);

  // Limpar campos
  appInput.value   = '';
  tempoInput.value = '';
  [dataInput, appInput, tempoInput].forEach(el => el.style.borderColor = '');

  carregarAtividades();
  calcularResumo();
}

// ===== EXCLUIR ATIVIDADE =====

function excluirAtividade(index) {
  if (!confirm('Excluir este registro?')) return;

  const atividades = getAtividades();
  atividades.splice(index, 1);
  salvarAtividades(atividades);

  carregarAtividades();
  calcularResumo();
}

// ===== CARREGAR HISTÓRICO =====

let filtroDataAtivo = null;

function carregarAtividades(filtroData) {
  const lista = document.getElementById('lista-atividades');
  if (!lista) return;

  lista.innerHTML = '';
  const atividades = getAtividades();

  // Índice original necessário para excluir corretamente
  const itens = atividades
    .map((item, i) => ({ ...item, originalIndex: i }))
    .filter(item => !filtroData || item.data === filtroData)
    .reverse(); // mais recente primeiro

  if (itens.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📭</span>
        ${filtroData ? 'Nenhum registro nesta data.' : 'Nenhuma atividade registrada ainda.'}
      </div>`;
    return;
  }

  itens.forEach(item => {
    const tempoNum = isNaN(parseInt(item.tempo)) ? 0 : parseInt(item.tempo);
    const card = document.createElement('div');
    card.className = 'item-salvo';
    card.innerHTML = `
      <div class="item-header">
        <div class="item-info">
          <div class="item-app">📱 ${item.app}</div>
          <div class="item-meta">
            <span>📅 ${formatarData(item.data)}</span>
            <span>⏱ ${tempoNum} min</span>
          </div>
        </div>
        <button class="btn-excluir" onclick="excluirAtividade(${item.originalIndex})">Excluir</button>
      </div>`;
    lista.appendChild(card);
  });
}

function formatarData(dataISO) {
  if (!dataISO) return '—';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ===== FILTRO =====

function aplicarFiltro() {
  const input = document.getElementById('filtro-data');
  if (!input) return;
  filtroDataAtivo = input.value || null;
  carregarAtividades(filtroDataAtivo);
}

function limparFiltro() {
  filtroDataAtivo = null;
  const input = document.getElementById('filtro-data');
  if (input) input.value = '';
  carregarAtividades();
}

// ===== RESUMO DIÁRIO =====

function calcularResumo() {
  const barra    = document.getElementById('barra-progresso');
  const tempoEl  = document.getElementById('tempo-hoje');
  const msgEl    = document.getElementById('msg-limite');
  if (!barra || !tempoEl || !msgEl) return;

  const atividades = getAtividades();
  const hoje = getDataHoje();
  const limite = getLimite();

  const totalHoje = atividades.reduce((acc, item) => {
    if (item.data === hoje) {
      const t = parseInt(item.tempo, 10);
      return acc + (isNaN(t) ? 0 : t);
    }
    return acc;
  }, 0);

  tempoEl.textContent = `${totalHoje} / ${limite} min`;

  const pct = Math.min((totalHoje / limite) * 100, 100);
  barra.style.width = `${pct}%`;

  barra.className = 'progress-bar';
  msgEl.className = 'progress-msg';

  if (totalHoje >= limite) {
    barra.classList.add('vermelho');
    msgEl.classList.add('alerta');
    msgEl.textContent = `⚠️ Limite ultrapassado! +${totalHoje - limite} min`;
  } else if (totalHoje >= limite * 0.75) {
    barra.classList.add('amarelo');
    msgEl.classList.add('aviso');
    msgEl.textContent = `🟡 Atenção: você já usou ${Math.round(pct)}% do limite`;
  } else {
    msgEl.classList.add('ok');
    msgEl.textContent = totalHoje > 0 ? `✅ Tudo sob controle (${Math.round(pct)}%)` : '';
  }

  // Preenche o input de limite com o valor atual
  const inputLimite = document.getElementById('input-limite');
  if (inputLimite && !inputLimite.value) {
    inputLimite.placeholder = limite;
  }
}

// ===== CONFIGURAR LIMITE =====

function configurarLimite() {
  const input = document.getElementById('input-limite');
  if (!input) return;

  const novoLimite = parseInt(input.value, 10);
  if (isNaN(novoLimite) || novoLimite < 10) {
    input.style.borderColor = '#e74c3c';
    setTimeout(() => { input.style.borderColor = ''; }, 2000);
    return;
  }

  localStorage.setItem('limite-diario', novoLimite);
  input.value = '';
  input.placeholder = novoLimite;
  calcularResumo();
}

// ===== GRÁFICOS =====

let chartApp = null;
let chartDias = null;

function gerarGrafico() {
  const ctx = document.getElementById('graficoUso');
  if (!ctx) return;

  const atividades = getAtividades();

  const dadosAgrupados = {};
  atividades.forEach(item => {
    const t = isNaN(parseInt(item.tempo, 10)) ? 0 : parseInt(item.tempo, 10);
    dadosAgrupados[item.app] = (dadosAgrupados[item.app] || 0) + t;
  });

  const labels = Object.keys(dadosAgrupados);
  const valores = Object.values(dadosAgrupados);

  if (chartApp) chartApp.destroy();

  if (labels.length === 0) {
    ctx.parentElement.innerHTML = '<div class="empty-state"><span class="empty-icon">📊</span>Sem dados para exibir.</div>';
    return;
  }

  const cores = ['#6c63ff','#3498db','#2ecc71','#f39c12','#e74c3c','#9b59b6','#1abc9c','#e67e22'];

  chartApp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Minutos',
        data: valores,
        backgroundColor: labels.map((_, i) => cores[i % cores.length] + 'cc'),
        borderColor:     labels.map((_, i) => cores[i % cores.length]),
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

function gerarGraficoDias() {
  const ctx = document.getElementById('graficoDias');
  if (!ctx) return;

  const atividades = getAtividades();

  // Últimos 7 dias
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const label = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    dias.push({ iso, label });
  }

  const totaisPorDia = dias.map(({ iso }) => {
    return atividades.reduce((acc, item) => {
      if (item.data === iso) {
        const t = parseInt(item.tempo, 10);
        return acc + (isNaN(t) ? 0 : t);
      }
      return acc;
    }, 0);
  });

  const limite = getLimite();

  if (chartDias) chartDias.destroy();

  chartDias = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dias.map(d => d.label),
      datasets: [
        {
          label: 'Uso (min)',
          data: totaisPorDia,
          fill: true,
          backgroundColor: 'rgba(108,99,255,0.12)',
          borderColor: '#6c63ff',
          borderWidth: 2,
          pointBackgroundColor: '#6c63ff',
          pointRadius: 4,
          tension: 0.3,
        },
        {
          label: 'Limite',
          data: new Array(7).fill(limite),
          borderColor: '#e74c3c',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ===== ESTATÍSTICAS =====

function calcularEstatisticas() {
  const statTotal  = document.getElementById('stat-total');
  const statMedia  = document.getElementById('stat-media');
  const statTopApp = document.getElementById('stat-top-app');
  const limiteMsg  = document.getElementById('limite-msg');

  if (!statTotal) return;

  const atividades = getAtividades();
  const limite = getLimite();

  if (atividades.length === 0) {
    statTotal.textContent  = '0';
    statMedia.textContent  = '0';
    statTopApp.textContent = '—';
    return;
  }

  // Total geral
  const total = atividades.reduce((acc, item) => {
    const t = parseInt(item.tempo, 10);
    return acc + (isNaN(t) ? 0 : t);
  }, 0);

  // Dias únicos
  const diasUnicos = [...new Set(atividades.map(i => i.data))];
  const media = diasUnicos.length > 0 ? Math.round(total / diasUnicos.length) : 0;

  // App mais usado
  const porApp = {};
  atividades.forEach(item => {
    const t = isNaN(parseInt(item.tempo,10)) ? 0 : parseInt(item.tempo,10);
    porApp[item.app] = (porApp[item.app] || 0) + t;
  });
  const topApp = Object.entries(porApp).sort((a, b) => b[1] - a[1])[0];

  statTotal.textContent  = total;
  statMedia.textContent  = media;
  statTopApp.textContent = topApp ? `${topApp[0]} (${topApp[1]} min)` : '—';

  // Limite msg
  if (limiteMsg) {
    const hoje = getDataHoje();
    const totalHoje = atividades.reduce((acc, item) => {
      if (item.data === hoje) {
        const t = parseInt(item.tempo, 10);
        return acc + (isNaN(t) ? 0 : t);
      }
      return acc;
    }, 0);

    if (totalHoje > limite) {
      limiteMsg.textContent = `⚠️ Limite ultrapassado hoje! Você usou ${totalHoje} de ${limite} min.`;
      limiteMsg.style.cssText = 'background:#fdf2f2; color:#e74c3c; border:1px solid #f5c6c6;';
    } else {
      limiteMsg.textContent = `✅ Dentro do limite hoje: ${totalHoje} de ${limite} min usados.`;
      limiteMsg.style.cssText = 'background:#f0fdf4; color:#27ae60; border:1px solid #c3e6cb;';
    }
  }
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', () => {
  // Agenda
  const btnSalvar = document.getElementById('btn-salvar');
  if (btnSalvar) {
    btnSalvar.addEventListener('click', salvarAtividade);

    // Preenche data de hoje por padrão
    const dataInput = document.getElementById('data-atividade');
    if (dataInput) dataInput.value = getDataHoje();

    exibirSaudacao();
    carregarAtividades();
    calcularResumo();
  }

  // Relatórios
  if (document.getElementById('graficoUso')) {
    calcularEstatisticas();
    gerarGrafico();
    gerarGraficoDias();
  }

  // Login — Enter no campo de nome
  const inputNome = document.getElementById('nome-usuario');
  if (inputNome) {
    const nome = getNome();
    if (nome) inputNome.value = nome;
    inputNome.addEventListener('keydown', e => {
      if (e.key === 'Enter') login();
    });
  }
});
