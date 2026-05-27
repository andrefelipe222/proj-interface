<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Tempo - Agenda</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="phone">
    <div class="header">
      <span> Registro</span>
    </div>
    <div class="content">
      <h3>Marcar um dia</h3>
      <input type="date" id="data-atividade">
      <input type="text" id="app-atividade" placeholder="Nome do app usado">
      <input type="number" id="tempo-atividade" placeholder="Tempo em minutos">
      <button class="blue" id="btn-salvar">Salvar</button>

      <h3>Histórico de uso</h3>
      <div id="lista-atividades" class="lista-container"></div>

      <h3>Resumo diário</h3>
      <div id="resumo-diario" class="item-salvo"></div>

      <button class="yellow" onclick="transicaopaginas('relatorios.html')">Ver Relatórios</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>