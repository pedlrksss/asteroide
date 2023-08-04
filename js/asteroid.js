// Variáveis globais
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var nave = { x: canvas.width / 2, y: canvas.height / 2, raio: 10 };
var asteroides = [];
var tiros = [];
var tiroImagem = new Image();
tiroImagem.src = "imagens/Captura_de_tela_de_2023-07-01_15-02-39-removebg-preview.png";
var pontos = 0;
var vidas = 3;
var tempo = 0;
var gameOver = false;
var pausado = false;
var naveImagem = new Image();
naveImagem.src = "imagens/nave.png";

var tamanhoMinimo = 10;
var tamanhoMaximo = 30;
var maximoAsteroides = 15;
var asteroideImagem = new Image();
asteroideImagem.src = "imagens/asteroide.png";
var explosões = [];
var explosaoImagem = new Image();
explosaoImagem.src = "imagens/explosao.png";
var recorde = localStorage.getItem('recorde');
if (recorde === null) {
  recorde = 0;
} else {
  recorde = parseInt(recorde);
}
var teclasPressionadas = {};

var inputNave = document.getElementById('input-nave');
var inputAsteroide = document.getElementById('input-asteroide');

// Event listener para o upload da imagem da nave
inputNave.addEventListener('change', function (event) {
  var file = event.target.files[0];
  var reader = new FileReader();

  reader.onload = function () {
    // Definir a imagem da nave com a imagem carregada
    naveImagem.src = reader.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});

// Event listener para o upload da imagem do asteroide
inputAsteroide.addEventListener('change', function (event) {
  var file = event.target.files[0];
  var reader = new FileReader();

  reader.onload = function () {
    // Definir a imagem do asteroide com a imagem carregada
    asteroideImagem.src = reader.result;
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});



// Event listeners para capturar entrada do jogador
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
canvas.addEventListener("click", reiniciarJogo, false);
canvas.addEventListener("keydown", keyDownHandler, false);



// Função para atualizar as explosões
function atualizarExplosões() {
  for (var i = 0; i < explosões.length; i++) {
    var explosão = explosões[i];
    explosão.tempoVida--;

    if (explosão.tempoVida <= 0) {
      explosões.splice(i, 1);
      i--;
    }
  }
}

// Função para atualizar a posição da nave e dos asteroides
function atualizarPosicao() {
  if (pausado) {
    return; // Retorna se o jogo estiver em pausa
  }

  if (teclasPressionadas[37]) {
    // Seta esquerda
    nave.x -= 5;
  }
  if (teclasPressionadas[39]) {
    // Seta direita
    nave.x += 5;
  }
  if (teclasPressionadas[38]) {
    // Seta cima
    nave.y -= 5;
  }
  if (teclasPressionadas[40]) {
    // Seta baixo
    nave.y += 5;
  }

  // Limitar a posição da nave dentro do canvas
  if (nave.x < nave.raio) {
    nave.x = nave.raio;
  }
  if (nave.x > canvas.width - nave.raio) {
    nave.x = canvas.width - nave.raio;
  }
  if (nave.y < nave.raio) {
    nave.y = nave.raio;
  }
  if (nave.y > canvas.height - nave.raio) {
    nave.y = canvas.height - nave.raio;
  }
    // Cria um novo asteroide apenas se a quantidade atual de asteroides for menor que o máximo permitido
  if (!gameOver && asteroides.length < maximoAsteroides && !pausado && tempo % 15 === 0) {
    criarAsteroide();
  }
  // Atualizar a posição dos asteroides
  for (var i = 0; i < asteroides.length; i++) {
    var asteroide = asteroides[i];
    asteroide.x += asteroide.velocidadeX;
    asteroide.y += asteroide.velocidadeY;

    

    // Verificar se o asteroide saiu do canvas e removê-lo
    if (
      asteroide.x < -asteroide.raio ||
      asteroide.x > canvas.width + asteroide.raio ||
      asteroide.y < -asteroide.raio ||
      asteroide.y > canvas.height + asteroide.raio
    ) {
      asteroides.splice(i, 1);
      i--;
    }
  }
        atualizarTiros();
  // Verificar colisões apenas se o jogo não tiver acabado
  if (!gameOver) {
    verificarColisoes();
  }
}

// Função responsável por atualizar a posição dos tiros e verificar colisões com os asteroides
function atualizarTiros() {
  for (var i = 0; i < tiros.length; i++) {
    var tiro = tiros[i];
    tiro.y += tiro.velocidadeY;

    // Verificar colisão entre o tiro e os asteroides
    for (var j = 0; j < asteroides.length; j++) {
      var asteroide = asteroides[j];
      var dx = tiro.x - asteroide.x;
      var dy = tiro.y - asteroide.y;
      var distancia = Math.sqrt(dx * dx + dy * dy);
      
      if (distancia < tiro.raio + asteroide.raio && asteroide.raio > tamanhoMinimo) {
        // Dividir o asteroide em dois pedaços menores
        var tamanhoMenor = asteroide.raio / 2;

        asteroides.push({
          x: asteroide.x,
          y: asteroide.y,
          raio: tamanhoMenor,
          velocidadeX: -asteroide.velocidadeX, // Manter a direção oposta
          velocidadeY: -asteroide.velocidadeY, // Manter a direção oposta
          acertado: false // Definir como false para o novo asteroide
        });

        asteroides.push({
          x: asteroide.x,
          y: asteroide.y,
          raio: tamanhoMenor,
          velocidadeX: asteroide.velocidadeX, // Manter a direção original
          velocidadeY: asteroide.velocidadeY, // Manter a direção original
          acertado: false // Definir como false para o novo asteroide
        });

        asteroides.splice(j, 1); // Remover o asteroide original do array
        j--; // Decrementar o contador para continuar verificando os asteroides
        tiros.splice(i, 1);
        i--;
        pontos++; // Incrementar a pontuação

        criarExplosão(asteroide.x, asteroide.y); // Chama a função criarExplosao() para criar a explosão
        
        // Verificar se a pontuação atual é maior que o recorde
        if (pontos > recorde) {
          recorde = pontos;
        localStorage.setItem('recorde', recorde);
        }
        
        break; // Sair do loop interno
      }

      if (distancia < tiro.raio + asteroide.raio && !asteroide.acertado && asteroide.raio <= tamanhoMinimo) {
        // Colisão detectada e asteroide não dividido, aumentar a pontuação
        pontos++;

          // Cria uma explosão no local da colisão
          criarExplosão(asteroide.x, asteroide.y);

        // Verificar se a pontuação atual é maior que o recorde
        if (pontos > recorde) {
          recorde = pontos;
        localStorage.setItem('recorde', recorde);
        }

        asteroide.acertado = true;
        asteroides.splice(j, 1); // Remover o asteroide do array
        j--; // Decrementar o contador para continuar verificando os asteroides
        tiros.splice(i, 1);
        i--;
        break; // Sair do loop interno
      }
    }
      

    // Remover tiros que saíram da tela
    if (tiro.y < 0) {
      tiros.splice(i, 1);
      i--;
    }
  }
}

// Função para criar asteroides em posições aleatórias
function criarAsteroide() {
  if (asteroides.length >= maximoAsteroides) {
    return; // Retorna sem criar um novo asteroide
  }

  var tamanhoMinimo = 20; // Reduzi o tamanho mínimo para que os asteroides menores também possam ser divididos
  var tamanhoMaximo = 50; // Define o tamanho máximo inicial dos asteroides

  var tamanho = gerarNumeroAleatorio(tamanhoMinimo, tamanhoMaximo);
  var asteroide = {
    x: 0,
    y: 0,
    raio: tamanho / 2,
    velocidadeX: (Math.random() * 4 - 2) * (1 + pontos / 100),
    velocidadeY: (Math.random() * 4 - 2) * (1 + pontos / 100)
  };

  // Escolher um lado aleatoriamente
  var lado = Math.floor(Math.random() * 4);

  // Definir a posição inicial com base no lado escolhido
  if (lado === 0) { // Lado superior
    asteroide.x = Math.random() * canvas.width;
    asteroide.y = -asteroide.raio;
  } else if (lado === 1) { // Lado direito
    asteroide.x = canvas.width + asteroide.raio;
    asteroide.y = Math.random() * canvas.height;
  } else if (lado === 2) { // Lado inferior
    asteroide.x = Math.random() * canvas.width;
    asteroide.y = canvas.height + asteroide.raio;
  } else { // Lado esquerdo
    asteroide.x = -asteroide.raio;
    asteroide.y = Math.random() * canvas.height;
  }

  asteroides.push(asteroide);
}

// Função para criar efeito da explosão
function criarExplosão(x, y) {
   var explosao = {
    x: x,
    y: y,
    tamanho: 30,
    tempoVida: 1000  // Tempo de vida em milissegundos (1.5 segundos)
  };
  explosões.push(explosao);

  // Remover a explosão após o tempo de vida especificado
  setTimeout(function() {
    var index = explosões.indexOf(explosao);
    if (index > -1) {
      explosões.splice(index, 1);
    }
  }, explosao.tempoVida);
}

// Função para desenhar a nave e os asteroides na tela
function desenhar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenhar a nave com a imagem personalizada
  ctx.save();
  ctx.translate(nave.x, nave.y);
  ctx.drawImage(naveImagem, -nave.raio, -nave.raio, nave.raio * 4, nave.raio * 4);
  ctx.restore();


    // Desenhar os asteroides com a imagem personalizada
  for (var i = 0; i < asteroides.length; i++) {
    var asteroide = asteroides[i];
    ctx.drawImage(asteroideImagem, asteroide.x - asteroide.raio, asteroide.y - asteroide.raio, asteroide.raio * 2, asteroide.raio * 2);
  }

  for (var i = 0; i < tiros.length; i++) {
  var tiro = tiros[i];
  ctx.drawImage(tiroImagem, tiro.x - tiro.raio, tiro.y - tiro.raio, tiro.raio * 2, tiro.raio * 2);
}

  // Desenhar as explosões
  desenharExplosoes();

  // Exibir pontos, vidas, recorde  na tela
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Pontuação: " + pontos, 10, 20);
  ctx.fillText("Vidas: " + vidas, 10, 40);
  ctx.fillText("Recorde: " + recorde, 10, 60);

  // Exibir tela de Game Over quando o jogo acabar
  if (gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "32px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Game Over", canvas.width / 2 - 80, canvas.height / 2);
    ctx.font = "16px Arial";
    ctx.fillText("Pontuação: " + pontos, canvas.width / 2 - 60, canvas.height / 2 + 30);
    ctx.fillText("Recorde: " + recorde, canvas.width / 2 - 50, canvas.height / 2 + 60);
    ctx.fillText("Clique para jogar novamente", canvas.width / 2 - 120, canvas.height / 2 + 150);
  }
}



// Função para desenhar as explosões
function desenharExplosoes() {
  for (var i = 0; i < explosões.length; i++) {
    var explosão = explosões[i];
    ctx.drawImage(explosaoImagem, explosão.x - explosão.tamanho, explosão.y - explosão.tamanho, explosão.tamanho * 2, explosão.tamanho * 2);
  }
}

// Função para entrar no modo de tela cheia
function enterFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

// Função para sair do modo de tela cheia
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

// Função para gerar numeros aleatorios
function gerarNumeroAleatorio(min, max) {
  return Math.random() * (max - min) + min;
}

// Função principal do jogo
function iniciarJogo() {
  var telaInicio = document.getElementById("tela-inicio");
  var btnIniciar = document.getElementById("btn-iniciar");

  // Função para começar o jogo quando o botão for clicado
  function comecarJogo() {
    telaInicio.style.display = "none"; // Esconde a tela de início
    canvas.style.display = "block"; // Exibe o canvas
    canvas.focus(); // Dá foco ao canvas para capturar eventos de teclado
    
    // Pausar a música
    var musica = document.getElementById("musica");
    musica.pause();
  }

  // Adiciona o evento de clique ao botão "Iniciar Jogo"
  btnIniciar.addEventListener("click", comecarJogo);
  

  // Reiniciar a música
  var musica = document.getElementById("musica");
  musica.currentTime = 0;
  musica.play();

  setInterval(function () {
    if (!gameOver) {
      atualizarPosicao();
      desenhar();

      // Cria um novo asteroide a cada 1.5 segundos
      if (!pausado && tempo % 150 === 0) {
        criarAsteroide();
      }
    }
  }, 10);
    redimensionarCanvas();
  window.requestAnimationFrame(loopPrincipal);
}

function loopPrincipal() {
  if (!gameOver) {
    atualizarPosicao();
    desenhar();
  }
  window.requestAnimationFrame(loopPrincipal);
}

// Manipulador de eventos para pressionamento de tecla
function keyDownHandler(event) {
  teclasPressionadas[event.keyCode] = true;
// Tecla P para pausar/despausar o jogo
  if (event.keyCode === 80) {
    pausarDespausarJogo();
  }

   if (event.keyCode === 32) {
    tiros.push({ x: nave.x, y: nave.y, raio: 3, velocidadeY: -5 }); // Cria um novo tiro com a posição da nave
  }
}

// Manipulador de eventos para liberação de tecla
function keyUpHandler(event) {
  teclasPressionadas[event.keyCode] = false;
}

// Função para pausar ou despausar o jogo
function pausarDespausarJogo() {
  pausado = !pausado;
}

// Função para reiniciar o jogo quando clicar na tela após o Game Over
function reiniciarJogo() {
  if (gameOver) {
    if (pontos > recorde) {
    }
    gameOver = false;
    pontos = 0;
    vidas = 3;
    tempo = 0;
    asteroides = [];
    pausado = false;
    nave.x = canvas.width / 2;
    nave.y = canvas.height / 2;
  }
}

// Função para voltar à tela inicial
function voltarTelaInicial() {
  // Exibir a tela de início e ocultar o canvas (ou outras partes do jogo)
  var telaInicio = document.getElementById("tela-inicio");
  var canvas = document.getElementById("canvas");
  telaInicio.style.display = "block";
  canvas.style.display = "none";

  // Reseta o estado do jogo (caso queira reiniciar o jogo)
  reiniciarJogo();
}


  // Armazenar as URLs das imagens originais
  const urlNaveOriginal = "imagens/nave.png";
  const urlAsteroideOriginal = "imagens/asteroide.png";

  // Associar uma função ao botão de resetar
  document.getElementById("btn-resetar").addEventListener("click", function() {
    // Definir as imagens originais quando o botão for clicado
    naveImagem.src = urlNaveOriginal;
    asteroideImagem.src = urlAsteroideOriginal;

    // Limpar a seleção dos elementos de upload
    document.getElementById("input-nave").value = '';
    document.getElementById("input-asteroide").value = '';
  });

// Função responsável por alternar entre os modos de tela cheia
function toggleFullscreen() {
  const elem = document.documentElement; // Elemento raiz do documento (pode ser substituído por outro elemento se desejado)

  if (document.fullscreenElement) {
    exitFullscreen();
  } else {
    enterFullscreen(elem);
  }
}

// Função para verificar colisões entre a nave e os asteroides
function verificarColisoes() {
  for (var i = 0; i < asteroides.length; i++) {
    var asteroideA = asteroides[i];
    var dx = nave.x - asteroideA.x;
    var dy = nave.y - asteroideA.y;
    var distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < nave.raio + asteroideA.raio) {
      // Colisão entre nave e asteroide detectada, diminuir uma vida
      vidas--;

      if (vidas <= 0) {
        // Sem vidas restantes, game over
        gameOver = true;
        pausado = true;
      } else {
        // Ainda tem vidas, reposicionar a nave
        nave.x = canvas.width / 2;
        nave.y = canvas.height / 2;
      }
    }

    for (var j = 0; j < asteroides.length; j++) {
      if (i !== j) {
        var asteroideB = asteroides[j];

        // Verificar colisão entre os asteroides
        var dx2 = asteroideB.x - asteroideA.x;
        var dy2 = asteroideB.y - asteroideA.y;
        var distancia2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (distancia2 < asteroideA.raio + asteroideB.raio) {
          // Colisão entre asteroides detectada, inverter a direção
          asteroideA.velocidadeX *= -1;
          asteroideA.velocidadeY *= -1;

          asteroideB.velocidadeX *= -1;
          asteroideB.velocidadeY *= -1;

          // Fator de escala para suavizar a mudança de direção
          var escala = 0.2;

          // Definir direção aleatória para asteroideA
          asteroideA.velocidadeX += (Math.random() - 0.5) * escala;
          asteroideA.velocidadeY += (Math.random() - 0.5) * escala;

          // Definir direção aleatória para asteroideB
          asteroideB.velocidadeX += (Math.random() - 0.5) * escala;
          asteroideB.velocidadeY += (Math.random() - 0.5) * escala;
        }
      }
    }
  }
}

iniciarJogo();