/*
 * Favorito "Assistente de Remoção".
 * A página remocao/index.html transforma esta função em texto e monta o link
 * javascript: que o professor arrasta para a barra de favoritos. Por isso a
 * função não pode usar nada de fora dela nem comentários de linha (//).
 * '__BASE__' é trocado pelo endereço da pasta publicada (ex.: .../scripts/remocao/).
 */
function favorito(amb) {
  amb = amb || { loc: location, doc: document, janela: window, agora: Date.now(), esperar: function (fn, ms) { setTimeout(fn, ms); }, base: '__BASE__' };
  var doc = amb.doc;
  var LOGIN = 'https://educ.apus.info/professor/pinda';
  var REMOCAO = 'https://educ.apus.info/profWeb/atribRemocao/';

  function aviso(texto, erro) {
    var antigo = doc.getElementById('assistente-remocao-aviso');
    if (antigo) antigo.remove();
    var caixa = doc.createElement('div');
    caixa.id = 'assistente-remocao-aviso';
    caixa.setAttribute('role', 'status');
    caixa.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;max-width:320px;padding:12px 16px;border-radius:12px;' +
      'font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 10px 30px rgba(15,29,54,.14);' +
      (erro ? 'background:#fbe8e5;color:#a8322a' : 'background:#ebf2fa;color:#164292');
    caixa.textContent = texto;
    doc.body.appendChild(caixa);
    return caixa;
  }

  if (amb.loc.hostname !== 'educ.apus.info') {
    aviso('Levando você para o login da APUS. Depois de entrar, abra a remoção e clique de novo em Assistente de Remoção.');
    amb.esperar(function () { amb.loc.href = LOGIN; }, 1800);
    return 'login';
  }

  if (amb.loc.pathname.indexOf('/profWeb/atribRemocao') !== 0) {
    aviso('Levando você para a remoção. Quando a página abrir, clique de novo em Assistente de Remoção.');
    amb.esperar(function () { amb.loc.href = REMOCAO; }, 1800);
    return 'remocao';
  }

  if (amb.janela.AssistenteRemocao) {
    amb.janela.AssistenteRemocao.abrir();
    return 'reabrir';
  }

  var marca = doc.documentElement.dataset;
  if (marca.assistenteRemocao === 'carregando') return 'carregar';
  marca.assistenteRemocao = 'carregando';

  var carregando = aviso('Abrindo o Assistente de Remoção…');
  var falhou = function () {
    if (amb.janela.AssistenteRemocao) return;
    delete marca.assistenteRemocao;
    aviso('Não consegui carregar o assistente. Confira a internet e clique de novo.', true);
  };
  var script = doc.createElement('script');
  script.src = amb.base + 'assistente.js?v=' + amb.agora;
  script.onload = function () { if (carregando) carregando.remove(); };
  script.onerror = falhou;
  doc.body.appendChild(script);
  amb.esperar(falhou, 8000);
  return 'carregar';
}

if (typeof module !== 'undefined' && module.exports) module.exports = { favorito: favorito };
