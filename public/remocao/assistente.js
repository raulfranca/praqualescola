/*!
 * Assistente de Remoção — v0.2.0
 * Painel que roda dentro da página de remoção da APUS (educ.apus.info/profWeb/atribRemocao/).
 * Carregado pelo favorito "Assistente de Remoção" (ver remocao/index.html).
 * Só lê dados: nunca escolhe escola, finaliza ou envia pedido.
 * Documentação: remocao/documentacao_remocao.md
 */
(function (raiz) {
  'use strict';

  var VERSAO = '0.2.0';

  // ===========================================================================
  // Nucleo — funções puras (testadas em Node: remocao/tests/)
  // ===========================================================================

  var ENTIDADES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordf: 'ª', ordm: 'º', ccedil: 'ç', Ccedil: 'Ç' };
  (function () {
    var marcas = { acute: '\u0301', grave: '\u0300', circ: '\u0302', tilde: '\u0303', uml: '\u0308' };
    'aeiouAEIOU'.split('').forEach(function (v) {
      Object.keys(marcas).forEach(function (m) { ENTIDADES[v + m] = (v + marcas[m]).normalize('NFC'); });
    });
  })();

  function textoDeHtml(html) {
    if (html === null || html === undefined) return '';
    return String(html)
      .replace(/<[^>]*>/g, ' ')
      .replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&#(\d+);/g, function (_, d) { return String.fromCharCode(parseInt(d, 10)); })
      .replace(/&([a-z]+);/gi, function (m, n) { var v = ENTIDADES[n] !== undefined ? ENTIDADES[n] : ENTIDADES[n.toLowerCase()]; return v === undefined ? m : v; })
      .replace(/[\s\u00a0]+/g, ' ')
      .trim();
  }

  function numero(html) {
    // A APUS mostra vagas negativas (excedentes). "1.023" é ambíguo: melhor não ler do que ler 1.
    var m = textoDeHtml(html).match(/-?\d+(?:[.,]\d+)?/);
    if (!m || /[.,]/.test(m[0])) return null;
    return parseInt(m[0], 10);
  }

  function normalizarNome(s) {
    return textoDeHtml(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  function lerFase(texto) {
    var m = String(texto || '').match(/Processo de Remo[çc][ãa]o\s*-\s*(\d+)\s*[ºªo°]?\s*FASE/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function lerClassificacao(texto) {
    var m = String(texto || '').match(/Classifica[çc][ãa]o:\s*(\d+)(?![.,]\d)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function escolasDaTabela(linhas) {
    return (linhas || []).map(function (d) {
      var ref = d.DT_RowData && d.DT_RowData.REF_ESCOLA;
      return {
        codigo: ref === undefined || ref === null || ref === '' ? null : String(ref),
        nome: textoDeHtml(d.escola),
        vagas: numero(d.vagas_real),
        inscritos: numero(d.inscritos)
      };
    });
  }

  function interessadosDaResposta(json) {
    if (!json || typeof json !== 'object' || !Array.isArray(json.data)) throw new Error('resposta-invalida');
    if (json.erro) throw new Error('erro-apus');
    return json.data.map(function (x) {
      return { nome: normalizarNome(x.PROFESSOR), classificacao: numero(x.PONTOS) };
    });
  }

  // Só pede a lista de interessados de quem tem inscritos (ou de quem não deu para ler).
  function escolasParaConsultar(escolas) {
    return (escolas || []).filter(function (e) { return e.codigo !== null && (e.inscritos === null || e.inscritos > 0); });
  }

  function ehOProfessor(interessado, professor) {
    return normalizarNome(interessado.nome) === normalizarNome(professor.nome) &&
      interessado.classificacao === professor.classificacao;
  }

  function posicaoNaEscola(lista, professor) {
    var naFrente = 0;
    lista.forEach(function (i) {
      if (ehOProfessor(i, professor)) return;
      if (i.classificacao !== null && i.classificacao < professor.classificacao) naFrente++;
    });
    return naFrente + 1;
  }

  function analisar(entrada) {
    var professor = entrada.professor;
    var escolas = entrada.escolas || [];
    var interessados = entrada.interessados || new Map();
    var campo = entrada.campoEscola ? String(entrada.campoEscola) : '';

    var vazio = { estado: 'nenhum', escola: null, escolaCampo: null, posicao: null, vagas: null, dentro: null };
    if (!escolas.length) return { erro: 'tabela-vazia', pedido: vazio, oportunidades: [], falhas: [], lidas: 0 };

    var falhas = [];
    var listasFalhas = 0;
    var lidas = 0;
    var gravadoEm = [];
    var candidatas = [];

    escolas.forEach(function (e) {
      if (e.codigo === null) { falhas.push(e.nome); return; }
      var lista;
      var listaConfiavel = true;
      if (e.inscritos === 0) {
        lista = [];
      } else {
        var r = interessados.get(e.codigo);
        if (!Array.isArray(r)) { falhas.push(e.nome); listasFalhas++; return; }
        lista = r;
        lidas++;
        // Concorrente sem classificação legível, ou lista vazia quando a tabela diz que há
        // inscritos: não dá para saber quem está na frente.
        if (lista.some(function (i) { return i.classificacao === null; })) listaConfiavel = false;
        if (e.inscritos > 0 && lista.length === 0) listaConfiavel = false;
      }
      var posicao = listaConfiavel ? posicaoNaEscola(lista, professor) : null;
      var registro = { codigo: e.codigo, nome: e.nome, vagas: e.vagas, posicao: posicao };
      if (lista.some(function (i) { return ehOProfessor(i, professor); })) gravadoEm.push(registro);
      if (!listaConfiavel) { falhas.push(e.nome); listasFalhas++; return; }
      if (e.vagas === null) { falhas.push(e.nome); return; }
      if (e.vagas > 0) candidatas.push(registro);
    });

    var porCodigo = {};
    escolas.forEach(function (e) { porCodigo[e.codigo] = e; });
    var escolaCampo = campo && porCodigo[campo] ? { codigo: campo, nome: porCodigo[campo].nome } : (campo ? { codigo: campo, nome: '' } : null);

    var pedido;
    if (gravadoEm.length > 1) {
      pedido = { estado: 'inconsistente', escola: null, escolaCampo: escolaCampo, posicao: null, vagas: null, dentro: null };
    } else if (gravadoEm.length === 1) {
      var g = gravadoEm[0];
      pedido = {
        estado: !campo || campo === g.codigo ? 'gravado' : 'trocar',
        escola: { codigo: g.codigo, nome: g.nome },
        escolaCampo: escolaCampo,
        posicao: g.posicao,
        vagas: g.vagas,
        dentro: g.vagas === null || g.posicao === null ? null : g.posicao <= g.vagas
      };
    } else if (listasFalhas > 0) {
      // O pedido pode estar justamente numa escola que não foi lida.
      pedido = { estado: 'nao-confirmado', escola: null, escolaCampo: escolaCampo, posicao: null, vagas: null, dentro: null };
    } else {
      pedido = { estado: campo ? 'nao-gravado' : 'nenhum', escola: null, escolaCampo: escolaCampo, posicao: null, vagas: null, dentro: null };
    }

    var codigoPedido = pedido.escola ? pedido.escola.codigo : null;
    var oportunidades = candidatas
      .filter(function (c) { return c.codigo !== codigoPedido; })
      .map(function (c) { return { codigo: c.codigo, nome: c.nome, vagas: c.vagas, posicao: c.posicao, justo: c.posicao === c.vagas, zero: c.posicao > c.vagas }; })
      .sort(function (a, b) {
        var fa = a.vagas - a.posicao, fb = b.vagas - b.posicao;
        return fb - fa || a.nome.localeCompare(b.nome, 'pt-BR');
      });

    return { erro: null, pedido: pedido, oportunidades: oportunidades, falhas: falhas, lidas: lidas };
  }

  function compararComAnterior(resultado, anterior) {
    var novas = new Set();
    if (!anterior) return { horaAnterior: null, posicaoAntes: null, novas: novas, sairam: [] };
    var antes = {};
    (anterior.oportunidades || []).forEach(function (o) { antes[o.codigo] = o.nome; });
    var agora = {};
    comChance(resultado).forEach(function (o) {
      agora[o.codigo] = true;
      if (!antes[o.codigo]) novas.add(o.codigo);
    });
    var codigoPedido = resultado.pedido.escola ? resultado.pedido.escola.codigo : null;
    var sairam = Object.keys(antes)
      .filter(function (c) { return !agora[c] && c !== codigoPedido; })
      .map(function (c) { return antes[c]; });
    var posicaoAntes = anterior.pedido && codigoPedido && anterior.pedido.codigo === codigoPedido ? anterior.pedido.posicao : null;
    return { horaAnterior: anterior.hora || null, posicaoAntes: posicaoAntes, novas: novas, sairam: sairam };
  }

  function paraGuardar(resultado, meta) {
    return {
      hora: meta.hora,
      pedido: resultado.pedido.escola ? { codigo: resultado.pedido.escola.codigo, posicao: resultado.pedido.posicao } : null,
      oportunidades: comChance(resultado).map(function (o) { return { codigo: o.codigo, nome: o.nome }; })
    };
  }

  // A comparação com a leitura anterior acompanha só as escolas com chance.
  function comChance(resultado) {
    return resultado.oportunidades.filter(function (o) { return !o.zero; });
  }

  function esperarMs(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Executa uma tarefa por item, uma de cada vez, com pausa entre elas.
  // Falha comum fica registrada no item; "sessao-expirada" interrompe tudo.
  async function emFila(itens, tarefa, opcoes) {
    opcoes = opcoes || {};
    var pausaMs = opcoes.pausaMs === undefined ? 150 : opcoes.pausaMs;
    var esperar = opcoes.esperar || esperarMs;
    var resultados = new Map();
    for (var i = 0; i < itens.length; i++) {
      if (i > 0) await esperar(pausaMs);
      try {
        resultados.set(itens[i], { ok: true, valor: await tarefa(itens[i]) });
      } catch (erro) {
        if (erro && erro.message === 'sessao-expirada') throw erro;
        resultados.set(itens[i], { ok: false, erro: erro });
      }
      if (opcoes.aoProgresso) opcoes.aoProgresso(i + 1, itens.length);
    }
    return resultados;
  }

  // Texto bruto de info.ajax.php → interessados. Se não for JSON, a APUS
  // devolveu outra página (normalmente a de login): sessão expirada.
  function respostaDoServidor(texto) {
    var json;
    try { json = JSON.parse(texto); } catch (e) { throw new Error('sessao-expirada'); }
    return interessadosDaResposta(json);
  }

  // Parâmetros de server_processing.info.php: os mesmos que a tabela da APUS envia
  // (protocolo do DataTables), pedindo todas as escolas de uma vez e sem filtro.
  var COLUNAS_ESCOLAS = ['escola', 'vagas_real', 'professores', 'inscritos', 'turmas'];
  function parametrosEscolas(c) {
    var p = {
      draw: 1, start: 0, length: -1, 'search[value]': '', 'search[regex]': false,
      ref_periodo: c.periodo, remocaoFase: String(c.fase), ref_funcionario: c.funcionario,
      id_menu: c.idMenu, usuario_nome: c.usuario
    };
    COLUNAS_ESCOLAS.forEach(function (nome, i) {
      p['columns[' + i + '][data]'] = nome;
      p['columns[' + i + '][searchable]'] = true;
      p['columns[' + i + '][orderable]'] = false;
      p['columns[' + i + '][search][value]'] = '';
    });
    return p;
  }

  // Texto bruto de server_processing.info.php → escolas.
  function escolasDaResposta(texto) {
    var json;
    try { json = JSON.parse(texto); } catch (e) { throw new Error('sessao-expirada'); }
    if (!json || typeof json !== 'object') throw new Error('resposta-invalida');
    if (json.error) throw new Error('erro-apus');
    if (!Array.isArray(json.data)) throw new Error('resposta-invalida');
    if (!json.data.length) throw new Error('tabela-vazia');
    var total = json.recordsTotal !== undefined ? Number(json.recordsTotal) : null;
    if (total !== null && json.data.length < total) throw new Error('tabela-incompleta');
    return escolasDaTabela(json.data);
  }

  var Nucleo = {
    emFila: emFila,
    parametrosEscolas: parametrosEscolas,
    escolasDaResposta: escolasDaResposta,
    respostaDoServidor: respostaDoServidor,
    escolasParaConsultar: escolasParaConsultar,
    analisar: analisar,
    compararComAnterior: compararComAnterior,
    paraGuardar: paraGuardar,
    textoDeHtml: textoDeHtml,
    numero: numero,
    normalizarNome: normalizarNome,
    lerFase: lerFase,
    lerClassificacao: lerClassificacao,
    escolasDaTabela: escolasDaTabela,
    interessadosDaResposta: interessadosDaResposta
  };

  // ===========================================================================
  // Apus — leitura da página e do servidor (só leitura; roda no navegador)
  // ===========================================================================

  var Apus = {
    lerPagina: function (doc) {
      doc = doc || document;
      var form = doc.getElementById('formEtapa3');
      var oculto = function (id) { var el = doc.getElementById(id); return el ? String(el.value || '').trim() : ''; };
      // A fase vem do campo que a própria APUS usa nas consultas; o texto da tela é só reserva.
      var fase = /^\d+$/.test(oculto('remocaoFase')) ? parseInt(oculto('remocaoFase'), 10) : null;
      if (!fase) fase = lerFase(doc.body ? doc.body.innerText || doc.body.textContent || '' : '');
      if (!form || !fase) return { erro: 'sem-fase' };

      var classificacao = null;
      var celulas = doc.querySelectorAll('td');
      for (var i = 0; i < celulas.length && classificacao === null; i++) {
        classificacao = lerClassificacao(celulas[i].innerText || celulas[i].textContent);
      }
      if (classificacao === null) return { erro: 'sem-classificacao' };

      var campo = function (nome) { var el = form.elements[nome]; return el ? String(el.value || '').trim() : ''; };
      var codigoCampo = campo('ddREF_ESCOLA_OPCAO1');
      if (!campo('ddREF_PERIODO') || !campo('ddREF_FUNCIONARIO') || !campo('ddVIRTUAL_REF_FUNCIONARIO')) return { erro: 'pagina-incompleta' };
      var consulta = { periodo: oculto('pIdDireita'), fase: fase, funcionario: oculto('pCdUsuario'), idMenu: oculto('id_menu'), usuario: oculto('usuario_nome') };
      if (!consulta.periodo || !consulta.funcionario || !consulta.idMenu || !consulta.usuario) return { erro: 'pagina-incompleta' };
      return {
        consulta: consulta,
        professor: { nome: normalizarNome(campo('ddVIRTUAL_REF_FUNCIONARIO')), classificacao: classificacao, codigo: campo('ddREF_FUNCIONARIO') },
        periodo: campo('ddREF_PERIODO'),
        fase: fase,
        campoEscola: codigoCampo ? { codigo: codigoCampo, nome: textoDeHtml(campo('ddVIRTUAL_REF_ESCOLA_OPCAO1')) } : null
      };
    },

    // Lista de escolas direto do servidor, com os mesmos parâmetros da tabela da APUS,
    // mas sem passar por ela: nada abre na tela e nenhum filtro da tela interfere.
    carregarEscolas: function (consulta) {
      return new Promise(function (resolver, rejeitar) {
        if (!raiz.jQuery || !raiz.jQuery.ajax) { rejeitar(new Error('tabela-indisponivel')); return; }
        raiz.jQuery.ajax({
          url: 'server_processing.info.php',
          type: 'GET',
          dataType: 'text',
          timeout: 30000,
          data: parametrosEscolas(consulta)
        }).done(function (texto) {
          try { resolver(escolasDaResposta(texto)); } catch (e) { rejeitar(e); }
        }).fail(function (xhr, status) {
          rejeitar(new Error(xhr && (xhr.status === 401 || xhr.status === 403) ? 'sessao-expirada' : 'tabela-indisponivel'));
        });
      });
    },

    buscarInteressados: function (codigo, contexto) {
      return new Promise(function (resolver, rejeitar) {
        raiz.jQuery.ajax({
          url: 'info.ajax.php',
          type: 'POST',
          dataType: 'text',
          timeout: 15000,
          data: { ref_escola: codigo, ref_periodo: contexto.periodo, opcao: 'img-inscritos', remocaoFase: String(contexto.fase) }
        }).done(function (texto) {
          try { resolver(respostaDoServidor(texto)); } catch (e) { rejeitar(e); }
        }).fail(function (xhr, status) {
          rejeitar(new Error(xhr && (xhr.status === 401 || xhr.status === 403) ? 'sessao-expirada' : 'falha-' + status));
        });
      });
    }
  };

  // ===========================================================================
  // Painel — interface (opção B, design system "Pra Qual Escola")
  // ===========================================================================

  // Pasta de onde este arquivo foi carregado (para achar a coruja).
  var BASE = (function () {
    try { return (document.currentScript && document.currentScript.src || '').replace(/[?#].*$/, '').replace(/[^/]*$/, ''); } catch (e) { return ''; }
  })();

  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box}',
    '.painel{--primary:#164292;--primary-strong:#0f2f6b;--primary-container:#2a5cb8;--soft:#ebf2fa;--surface:#f6f9fd;--card:#fff;--high:#dde7f4;',
    '--ink:#0f1d36;--ink2:#4a5a78;--ink3:#5e6d87;',
    '--ok-bg:#e3f3ec;--ok-fg:#1f6f52;--aviso-bg:#fdf1d8;--aviso-fg:#7a4d00;--erro-bg:#fbe8e5;--erro-fg:#a8322a;--info-bg:#e4ecf8;--info-fg:#164292;',
    'font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.5;color:var(--ink);-webkit-font-smoothing:antialiased;',
    'width:344px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:var(--surface);border-radius:12px;box-shadow:0 10px 30px rgba(15,29,54,.14);overflow:hidden}',
    '.painel[hidden]{display:none}',
    '.cab{display:flex;align-items:center;gap:10px;padding:10px 8px 10px 14px;background:var(--card)}',
    '.cab img{width:30px;height:30px;flex:none}',
    '.cab .titulos{min-width:0;flex:1}',
    '.cab .nome{font-weight:600;font-size:14px;line-height:1.25}',
    '.cab .sub{font-size:12px;color:var(--ink3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.icone{width:36px;height:36px;border:0;border-radius:6px;background:transparent;color:var(--ink2);display:grid;place-items:center;cursor:pointer;flex:none;padding:0}',
    '.icone:hover{background:var(--soft);color:var(--primary)}',
    '.icone.atualizar{background:var(--soft);color:var(--primary)}',
    '.icone.atualizar:hover{background:var(--high)}',
    '.icone:disabled{opacity:.5;cursor:default}',
    '.icone:focus-visible,.botao:focus-visible{outline:2px solid var(--primary);outline-offset:2px}',
    '.corpo{padding:12px;display:flex;flex-direction:column;gap:8px;overflow-y:auto}',
    '.eyebrow{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--ink2);padding:4px 2px 0}',
    '.eyebrow.com-coluna{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding-right:12px}',
    '.pedido{background:var(--card);border-radius:8px;padding:10px 12px;box-shadow:inset 3px 0 0 var(--faixa,var(--primary))}',
    '.pedido .linha{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}',
    '.pedido .escola{font-weight:600;font-size:13.5px;line-height:1.3}',
    '.pedido .texto{font-size:12.5px;color:var(--ink2);margin-top:3px}',
    '.pedido .dica{font-size:12.5px;font-weight:600;color:var(--faixa);margin-top:6px}',
    '.lista{display:flex;flex-direction:column;gap:6px}',
    '.item{display:flex;align-items:center;gap:10px;padding:9px 12px;background:var(--card);border-radius:8px}',
    '.item .info{min-width:0;flex:1}',
    '.item .n{font-weight:600;font-size:13.5px;line-height:1.3}',
    '.item .d{font-size:12px;color:var(--ink2);margin-top:1px}',
    '.tag{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:9999px;white-space:nowrap;vertical-align:1px}',
    '.tag.ok{background:var(--ok-bg);color:var(--ok-fg)}.tag.aviso{background:var(--aviso-bg);color:var(--aviso-fg)}',
    '.tag.erro{background:var(--erro-bg);color:var(--erro-fg)}.tag.info{background:var(--info-bg);color:var(--info-fg)}',
    '.n .tag{margin-left:4px}',
    '.vazio{font-size:13px;color:var(--ink2);background:var(--card);border-radius:8px;padding:10px 12px}',
    '.saiu{font-size:11.5px;color:var(--ink3);padding:2px 2px 0}',
    '.faixa{display:flex;gap:8px;align-items:flex-start;border-radius:8px;padding:9px 12px;font-size:12.5px}',
    '.faixa svg{flex:none;margin-top:2px}',
    '.faixa.aviso{background:var(--aviso-bg);color:var(--aviso-fg)}.faixa.erro{background:var(--erro-bg);color:var(--erro-fg)}.faixa.info{background:var(--info-bg);color:var(--info-fg)}',
    '.progresso{height:6px;border-radius:9999px;background:var(--high);overflow:hidden}',
    '.progresso i{display:block;height:100%;background:linear-gradient(135deg,var(--primary),var(--primary-container));border-radius:inherit;transition:width .2s cubic-bezier(.2,0,0,1)}',
    '.lendo{background:var(--card);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;font-size:13px;color:var(--ink2)}',
    '.botao{height:44px;border:0;border-radius:6px;background:linear-gradient(135deg,var(--primary),var(--primary-container));color:#fff;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;display:flex;gap:8px;align-items:center;justify-content:center;width:100%}',
    '.botao:hover{background:var(--primary-strong)}',
    '.rodape{font-size:11px;color:var(--ink3);padding:0 14px 10px;text-align:center}',
    '@media (max-width:480px){.painel{width:calc(100vw - 16px);max-height:calc(100vh - 16px)}}'
  ].join('');

  var ICONES = {
    atualizar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/></svg>',
    fechar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    alerta: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>'
  };

  var TEXTO_ERRO = {
    'sem-fase': 'Nenhuma fase de remoção aberta agora.',
    'sem-classificacao': 'Não achei sua classificação nesta página.',
    'tabela-vazia': 'Não consegui ler a lista de escolas. Clique em atualizar.',
    'tabela-indisponivel': 'Não consegui ler a lista de escolas. Clique em atualizar.',
    'tabela-incompleta': 'A lista de escolas veio incompleta. Clique em atualizar.',
    'pagina-incompleta': 'Não consegui ler seus dados nesta página. Recarregue a página e clique de novo em Assistente de Remoção.',
    'sessao-expirada': 'Sua sessão na APUS terminou. Entre de novo e clique em Assistente de Remoção.',
    'desconhecido': 'Algo deu errado na leitura. Clique em atualizar.'
  };

  function vagas(n) { return n === 1 ? '1 vaga' : n + ' vagas'; }

  function criar(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined && texto !== null) e.textContent = texto;
    return e;
  }

  function etiqueta(tipo, texto) { return criar('span', 'tag ' + tipo, texto); }

  function faixa(tipo, texto) {
    var f = criar('div', 'faixa ' + tipo);
    f.innerHTML = ICONES.alerta;
    f.appendChild(criar('div', null, texto));
    return f;
  }

  // Bloco "Seu pedido" — uma linha por estado (spec §4, decisão 2).
  function blocoPedido(pedido) {
    var cores = { ok: 'var(--ok-fg)', erro: 'var(--erro-fg)', aviso: 'var(--aviso-fg)', info: 'var(--info-fg)' };
    var tipo, rotulo, escola, texto, dica;
    var nomeCampo = pedido.escolaCampo ? (pedido.escolaCampo.nome || 'outra escola') : '';
    switch (pedido.estado) {
      case 'gravado':
        escola = pedido.escola.nome;
        if (pedido.dentro === null) {
          tipo = 'aviso'; rotulo = 'Confira';
          texto = 'Seu pedido está gravado, mas não consegui ler ' + (pedido.posicao === null ? 'todos os concorrentes' : 'as vagas') + ' desta escola.';
          dica = 'Clique em atualizar.';
          break;
        }
        tipo = pedido.dentro ? 'ok' : 'erro';
        rotulo = pedido.dentro ? 'Entra' : 'Não Entra';
        texto = pedido.vagas > 0 ? 'Você é o ' + pedido.posicao + 'º lugar em ' + vagas(pedido.vagas) : 'Você é o ' + pedido.posicao + 'º, mas a escola está sem vaga';
        dica = pedido.dentro ? null : 'Você não conseguirá esta vaga. Considere as opções abaixo.';
        break;
      case 'nao-gravado':
        tipo = 'aviso'; rotulo = 'Não enviado'; escola = nomeCampo;
        texto = 'Você selecionou esta escola, mas ainda não enviou para a APUS.';
        dica = 'Clique em Finalizar (abaixo, esquerda) para enviar.';
        break;
      case 'trocar':
        tipo = 'aviso'; rotulo = 'Não enviado'; escola = nomeCampo;
        texto = 'IMPORTANTE: A sua escola selecionada para remoção ainda é ' + pedido.escola.nome + '.';
        dica = 'Clique em Finalizar (abaixo, esquerda) para trocar.';
        break;
      case 'nao-confirmado':
        tipo = 'aviso'; rotulo = 'Confira'; escola = 'Pedido não confirmado';
        texto = 'Não consegui ler todas as escolas, então não sei se o seu pedido está gravado.';
        dica = 'Clique em atualizar.';
        break;
      case 'inconsistente':
        tipo = 'aviso'; rotulo = 'Confira'; escola = 'Leitura confusa';
        texto = 'Seu nome apareceu em mais de uma escola.';
        dica = 'Clique em atualizar.';
        break;
      default:
        tipo = 'info'; rotulo = 'Não escolhido'; escola = 'Nenhuma escola';
        texto = 'Você ainda não selecionou nenhuma escola para a remoção.';
        dica = 'Escolha uma escola e clique em Finalizar.';
    }
    var caixa = criar('div', 'pedido');
    caixa.style.setProperty('--faixa', cores[tipo]);
    var linha = criar('div', 'linha');
    linha.appendChild(criar('div', 'escola', escola));
    linha.appendChild(etiqueta(tipo, rotulo));
    caixa.appendChild(linha);
    caixa.appendChild(criar('div', 'texto', texto));
    if (dica) caixa.appendChild(criar('div', 'dica', dica));
    return caixa;
  }

  function cabecalhoComColuna(texto, coluna) {
    var cab = criar('div', 'eyebrow com-coluna');
    cab.appendChild(criar('span', null, texto));
    cab.appendChild(criar('span', null, coluna));
    return cab;
  }

  function conteudoPronto(estado) {
    var r = estado.resultado, c = estado.comparacao || { novas: new Set(), sairam: [] };
    var frag = document.createDocumentFragment();
    frag.appendChild(cabecalhoComColuna(estado.fase ? 'Escola escolhida na ' + estado.fase + 'ª fase' : 'Seu pedido', 'Situação'));
    frag.appendChild(blocoPedido(r.pedido));
    if (r.falhas.length) {
      frag.appendChild(faixa('aviso', 'Não consegui ler ' + (r.falhas.length === 1 ? '1 escola' : r.falhas.length + ' escolas') + '. Clique em atualizar.'));
    }
    frag.appendChild(r.oportunidades.length
      ? cabecalhoComColuna('Escolas com vaga · ' + r.oportunidades.length, 'Chance')
      : criar('div', 'eyebrow', 'Escolas com vaga · 0'));
    if (!r.oportunidades.length) {
      frag.appendChild(criar('div', 'vazio', 'Nenhuma outra escola com vaga para remoção agora.'));
    } else {
      var lista = criar('div', 'lista');
      r.oportunidades.forEach(function (o) {
        var item = criar('div', 'item');
        var info = criar('div', 'info');
        var n = criar('div', 'n', o.nome);
        info.appendChild(n);
        info.appendChild(criar('div', 'd', o.posicao + 'º lugar em ' + vagas(o.vagas)));
        item.appendChild(info);
        item.appendChild(o.zero ? etiqueta('erro', 'Zero') : o.justo ? etiqueta('aviso', 'Menor') : etiqueta('ok', 'Maior'));
        lista.appendChild(item);
      });
      frag.appendChild(lista);
    }
    if (c.sairam && c.sairam.length && c.horaAnterior) {
      frag.appendChild(criar('div', 'saiu', 'Perdeu a chance desde ' + c.horaAnterior + ': ' + c.sairam.join(', ')));
    }
    return frag;
  }

  function conteudoLendo(estado) {
    var caixa = criar('div', 'lendo');
    var total = estado.total || 0;
    var pct = total ? Math.round(100 * estado.feitos / total) : 0;
    caixa.appendChild(criar('div', null, 'Analisando as escolas… ' + pct + '%'));
    var barra = criar('div', 'progresso');
    var i = document.createElement('i');
    i.style.width = Math.max(4, pct) + '%';
    barra.appendChild(i);
    caixa.appendChild(barra);
    return caixa;
  }

  function conteudoErro(estado, aoAtualizar) {
    var frag = document.createDocumentFragment();
    var tipo = estado.motivo === 'sem-fase' ? 'info' : 'erro';
    frag.appendChild(faixa(tipo, TEXTO_ERRO[estado.motivo] || TEXTO_ERRO.desconhecido));
    if (estado.motivo !== 'sem-fase' && estado.motivo !== 'sessao-expirada' && aoAtualizar) {
      var b = criar('button', 'botao');
      b.type = 'button';
      b.innerHTML = ICONES.atualizar;
      b.appendChild(document.createTextNode('Tentar de novo'));
      b.addEventListener('click', aoAtualizar);
      frag.appendChild(b);
    }
    return frag;
  }

  function subtitulo(estado) {
    var partes = [];
    if (estado.tipo === 'pronto' && estado.hora) partes.push('atualizado às ' + estado.hora);
    if (estado.tipo === 'lendo') partes.push('analisando…');
    return partes.join(' · ') || 'Remoção';
  }

  // Monta a estrutura do painel dentro de uma raiz de sombra.
  function construir(sombra, callbacks) {
    var estilo = document.createElement('style');
    estilo.textContent = CSS;
    sombra.appendChild(estilo);
    var painel = criar('section', 'painel');
    painel.setAttribute('role', 'dialog');
    painel.setAttribute('aria-label', 'Assistente de Remoção');
    var cab = criar('div', 'cab');
    var img = document.createElement('img');
    img.alt = '';
    img.src = BASE + 'design-system/assets/icone-app.svg';
    img.onerror = function () { img.style.display = 'none'; };
    cab.appendChild(img);
    var titulos = criar('div', 'titulos');
    titulos.appendChild(criar('div', 'nome', 'Assistente de Remoção'));
    var sub = criar('div', 'sub', 'Remoção');
    titulos.appendChild(sub);
    cab.appendChild(titulos);
    var btAtualizar = criar('button', 'icone atualizar');
    btAtualizar.type = 'button';
    btAtualizar.setAttribute('aria-label', 'Atualizar');
    btAtualizar.title = 'Atualizar';
    btAtualizar.innerHTML = ICONES.atualizar;
    btAtualizar.addEventListener('click', function () { if (callbacks.aoAtualizar) callbacks.aoAtualizar(); });
    var btFechar = criar('button', 'icone');
    btFechar.type = 'button';
    btFechar.setAttribute('aria-label', 'Fechar');
    btFechar.title = 'Fechar';
    btFechar.innerHTML = ICONES.fechar;
    btFechar.addEventListener('click', function () { if (callbacks.aoFechar) callbacks.aoFechar(); });
    cab.appendChild(btAtualizar);
    cab.appendChild(btFechar);
    painel.appendChild(cab);
    var corpo = criar('div', 'corpo');
    painel.appendChild(corpo);
    painel.appendChild(criar('div', 'rodape', 'Esta análise não é uma garantia de resultados.'));
    sombra.appendChild(painel);
    return { painel: painel, sub: sub, corpo: corpo, btAtualizar: btAtualizar, callbacks: callbacks };
  }

  function renderizar(partes, estado) {
    partes.sub.textContent = subtitulo(estado);
    partes.btAtualizar.disabled = estado.tipo === 'lendo';
    partes.corpo.textContent = '';
    if (estado.tipo === 'lendo') partes.corpo.appendChild(conteudoLendo(estado));
    else if (estado.tipo === 'pronto') partes.corpo.appendChild(conteudoPronto(estado));
    else partes.corpo.appendChild(conteudoErro(estado, partes.callbacks.aoAtualizar));
  }

  var atual = null;

  var Painel = {
    montar: function (callbacks) {
      if (atual) return;
      var host = document.createElement('div');
      host.id = 'assistente-remocao';
      host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483000;';
      var sombra = host.attachShadow({ mode: 'open' });
      atual = construir(sombra, callbacks || {});
      atual.host = host;
      document.body.appendChild(host);
    },
    mostrar: function (estado) { if (atual) renderizar(atual, estado); },
    abrir: function () { if (atual) atual.painel.hidden = false; },
    fechar: function () { if (atual) atual.painel.hidden = true; },
    estaAberto: function () { return !!(atual && !atual.painel.hidden); },
    // Só para a página de testes (remocao/tests/painel.html).
    _renderEm: function (elemento, estado) {
      var partes = construir(elemento.attachShadow({ mode: 'open' }), { aoAtualizar: function () {}, aoFechar: function () {} });
      renderizar(partes, estado);
    }
  };

  // ===========================================================================
  // Integração — liga leitura, conta e painel
  // ===========================================================================

  var lendo = false;

  function horaAgora() {
    var d = new Date();
    return d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0');
  }

  function chaveMemoria(pagina) {
    return 'assistente-remocao:v1:' + pagina.professor.codigo + ':' + pagina.periodo + ':' + pagina.fase;
  }

  function lerMemoria(chave) {
    try { return JSON.parse(raiz.localStorage.getItem(chave) || 'null'); } catch (e) { return null; }
  }

  function gravarMemoria(chave, valor) {
    try { raiz.localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem espaço ou bloqueado: segue sem memória */ }
  }

  var MOTIVOS_CONHECIDOS = ['sem-fase', 'sem-classificacao', 'pagina-incompleta', 'tabela-vazia', 'tabela-indisponivel', 'tabela-incompleta', 'sessao-expirada'];

  async function atualizar() {
    if (lendo) return;
    lendo = true;
    var pagina = null;
    try {
      pagina = Apus.lerPagina(document);
      if (pagina.erro) { Painel.mostrar({ tipo: 'erro', motivo: pagina.erro }); return; }
      var base = { classificacao: pagina.professor.classificacao, fase: pagina.fase };

      Painel.mostrar({ tipo: 'lendo', feitos: 0, total: 0, classificacao: base.classificacao, fase: base.fase });
      var escolas = await Apus.carregarEscolas(pagina.consulta);

      var consultar = escolasParaConsultar(escolas);
      Painel.mostrar({ tipo: 'lendo', feitos: 0, total: consultar.length, classificacao: base.classificacao, fase: base.fase });
      var respostas = await emFila(consultar, function (e) {
        return Apus.buscarInteressados(e.codigo, { periodo: pagina.periodo, fase: pagina.fase });
      }, {
        aoProgresso: function (feitos, total) {
          Painel.mostrar({ tipo: 'lendo', feitos: feitos, total: total, classificacao: base.classificacao, fase: base.fase });
        }
      });

      var interessados = new Map();
      respostas.forEach(function (r, escola) { interessados.set(escola.codigo, r.ok ? r.valor : 'falha'); });

      var resultado = analisar({
        professor: pagina.professor,
        escolas: escolas,
        interessados: interessados,
        campoEscola: pagina.campoEscola ? pagina.campoEscola.codigo : ''
      });
      if (resultado.erro) { Painel.mostrar({ tipo: 'erro', motivo: resultado.erro, classificacao: base.classificacao, fase: base.fase }); return; }

      var chave = chaveMemoria(pagina);
      var hora = horaAgora();
      Painel.mostrar({
        tipo: 'pronto', classificacao: base.classificacao, fase: base.fase, hora: hora,
        resultado: resultado, comparacao: compararComAnterior(resultado, lerMemoria(chave))
      });
      // Só vira "leitura anterior" uma leitura completa; com falhas, a comparação seria falsa.
      if (!resultado.falhas.length) gravarMemoria(chave, paraGuardar(resultado, { hora: hora }));
    } catch (erro) {
      var motivo = erro && MOTIVOS_CONHECIDOS.indexOf(erro.message) >= 0 ? erro.message : 'desconhecido';
      if (motivo === 'desconhecido' && raiz.console) raiz.console.error('[Assistente de Remoção]', erro);
      Painel.mostrar({ tipo: 'erro', motivo: motivo, classificacao: pagina && pagina.professor && pagina.professor.classificacao, fase: pagina && pagina.fase });
    } finally {
      lendo = false;
    }
  }

  function abrir() {
    Painel.abrir();
    atualizar();
  }

  // Remove o painel da versão 1 (TamperMonkey), para não haver dois painéis.
  function removerVersaoAntiga() {
    ['dash-container', 'result-modal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
    Array.prototype.forEach.call(document.querySelectorAll('.overlay-bg'), function (el) { el.remove(); });
  }

  function iniciar() {
    if (raiz.AssistenteRemocao) { raiz.AssistenteRemocao.abrir(); return; }
    raiz.AssistenteRemocao = { versao: VERSAO, Nucleo: Nucleo, Apus: Apus, Painel: Painel, abrir: abrir, atualizar: atualizar };
    if (document.documentElement.dataset) delete document.documentElement.dataset.assistenteRemocao;
    removerVersaoAntiga();
    Painel.montar({ aoAtualizar: atualizar, aoFechar: Painel.fechar });
    atualizar();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Nucleo: Nucleo, Apus: Apus, VERSAO: VERSAO };
  } else if (raiz.ASSISTENTE_REMOCAO_TESTE) {
    // Página de testes: expõe as peças sem abrir o painel de verdade.
    raiz.AssistenteRemocaoTeste = { Nucleo: Nucleo, Apus: Apus, Painel: Painel, VERSAO: VERSAO };
  } else {
    iniciar();
  }
})(typeof window !== 'undefined' ? window : globalThis);
