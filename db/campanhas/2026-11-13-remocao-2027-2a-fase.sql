-- Remoção 2027 · 2ª fase — Vagas para remoção na 2ª fase, conforme a lista da Secretaria de 13/11/2026.
-- Fonte: ref/documentos/2026/Vagas_para_Remocao_2_fase_13_11_26.pdf (66 escolas). Casamento nome → INEP: o .csv ao lado.
-- Período no app: de agora (início = quando as vagas ficam disponíveis) a 2026-11-19 07:00:00-03.
-- Gerado por db/campanhas/gerar-carga.py. A campanha nasce ligada. Idempotente sem `delete`: rodar de
-- novo atualiza dados e vagas, mas não mexe no início, no interruptor nem no arquivamento.

begin;

insert into praqualescola.campanhas (id, nome, descricao, inicio, fim, ligada, fonte)
values ('remocao-2027-2a-fase', 'Remoção 2027 · 2ª fase', 'Vagas para remoção na 2ª fase, conforme a lista da Secretaria de 13/11/2026.', now(), '2026-11-19 07:00:00-03', true, 'Lista da Secretaria de 13/11/2026')
on conflict (id) do update
   set nome = excluded.nome, descricao = excluded.descricao, fim = excluded.fim, fonte = excluded.fonte, atualizada_em = now();

insert into praqualescola.campanha_vagas (campanha, codigo_inep, nome_na_fonte, vagas) values
  ('remocao-2027-2a-fase', '35073179', 'Abdias Júnior Santiago e Silva EM', 0),
  ('remocao-2027-2a-fase', '35206878', 'Alexandre Machado Salgado, Prof. EM', 0),
  ('remocao-2027-2a-fase', '35249695', 'André Franco Montoro, Dr. EM', 0),
  ('remocao-2027-2a-fase', '35011695', 'Andrea Cristina de Souza Bissoli, Prof.ª - CMEI Tabaú', 0),
  ('remocao-2027-2a-fase', '35062431', 'Ângelo Paz da Silva, Dr. EM', 0),
  ('remocao-2027-2a-fase', '35191644', 'Aníbal Ferreira Lima EM', 0),
  ('remocao-2027-2a-fase', '35073143', 'Arthur de Andrade EM', 1),
  ('remocao-2027-2a-fase', '35274159', 'Augusto César Ribeiro EM', 0),
  ('remocao-2027-2a-fase', '35073180', 'Ayrton Senna da Silva EM', 2),
  ('remocao-2027-2a-fase', '35234990', 'Caic CMEI', 1),
  ('remocao-2027-2a-fase', '35278725', 'Dulce Pedrosa Romeiro Guimarães EM', 0),
  ('remocao-2027-2a-fase', '35283307', 'Durvalino dos Santos CMEI', 1),
  ('remocao-2027-2a-fase', '35225198', 'Elias Bargis Mathias, Prof. EM', 0),
  ('remocao-2027-2a-fase', '35585865', 'Esmeralda da Silva Ramos CMEI', 1),
  ('remocao-2027-2a-fase', '35073167', 'Félix Adib Miguel EM', -1),
  ('remocao-2027-2a-fase', '35073131', 'Francisco de Assis César, Dr. EM', 0),
  ('remocao-2027-2a-fase', '35652076', 'Francisco Lessa Júnior, Dr. CMEI', 3),
  ('remocao-2027-2a-fase', '35235003', 'Frei Reynaldo Nieborg CMEI', 1),
  ('remocao-2027-2a-fase', '35073106', 'Gilda Piorini Molica, Profª EM', 0),
  ('remocao-2027-2a-fase', '35004636', 'Isabel do Carmo Nogueira, Profª EM', 1),
  ('remocao-2027-2a-fase', '35585877', 'Isabel Pereira da Silva CMEI', -3),
  ('remocao-2027-2a-fase', '35073118', 'Jairo Monteiro, Prof. EM', 0),
  ('remocao-2027-2a-fase', '35073234', 'João Cesário EM', 5),
  ('remocao-2027-2a-fase', '35652052', 'João Fleury Filho CMEI', -1),
  ('remocao-2027-2a-fase', '35005825', 'João Kolenda Lemos, Prof. EM', 0),
  ('remocao-2027-2a-fase', '35410676', 'Joaquim Pereira Silva, Prof. EM', 0),
  ('remocao-2027-2a-fase', '35471598', 'José Gonçalves da Silva (Seu Juquinha) EM', 3),
  ('remocao-2027-2a-fase', '35191620', 'José Ildefonso Machado CMEI', 0),
  ('remocao-2027-2a-fase', '35652064', 'Josefina Cembranelli Schmidt CMEI', 0),
  ('remocao-2027-2a-fase', '35110206', 'Julieta Reale Vieira, Profª EM', 0),
  ('remocao-2027-2a-fase', '35274161', 'Lauro Vicente de Azevedo EM', 4),
  ('remocao-2027-2a-fase', '35004045', 'Lessa CMEI', 0),
  ('remocao-2027-2a-fase', '35010633', 'Lucineia C. M. do Amaral Carvalho CMEI', 0),
  ('remocao-2027-2a-fase', '35410330', 'Madalena Caltabiano S. Benjamim, Profª EM', 0),
  ('remocao-2027-2a-fase', '35069036', 'Manoel César Ribeiro EM', -2),
  ('remocao-2027-2a-fase', '35064191', 'Maria Ap. Arantes Vasques, Profª EM', -1),
  ('remocao-2027-2a-fase', '35225204', 'Maria Aparecida Gomes - "Sá Maria" CMEI', 0),
  ('remocao-2027-2a-fase', '35652088', 'Maria Benedita Cabral San Martin CMEI', 1),
  ('remocao-2027-2a-fase', '35235015', 'Maria das Dores S. Marcondes - "Mª dos Anjos" CMEI', 0),
  ('remocao-2027-2a-fase', '35206885', 'Maria Helena Ribeiro Vilela, Profª EM', 0),
  ('remocao-2027-2a-fase', '35585889', 'Maria Luiza L. de Almeida CMEI', 0),
  ('remocao-2027-2a-fase', '35567012', 'Maria Madureira Salgado, Profª "Dona Minica" EM', 0),
  ('remocao-2027-2a-fase', '35073209', 'Maria Zara Miné, Profª EM', 0),
  ('remocao-2027-2a-fase', '35073222', 'Mário Antônio Bonotti, Pe. EM', 0),
  ('remocao-2027-2a-fase', '35471604', 'Mário de Assis César, Prof. EM', 3),
  ('remocao-2027-2a-fase', '35191632', 'Marli Lemes de Moura Camargo CMEI', 0),
  ('remocao-2027-2a-fase', '35064221', 'Moacyr de Almeida EM', 0),
  ('remocao-2027-2a-fase', '35010839', 'Monsenhor Jonas Abib CMEI - CMEI Arco Íris', 0),
  ('remocao-2027-2a-fase', '35011066', 'Neide Maria P. de Andrade - D. Neide, Profª - CMEI Araretama', 0),
  ('remocao-2027-2a-fase', '35567024', 'Odete Correa Madureira EM', 0),
  ('remocao-2027-2a-fase', '35410688', 'Olímpia Franco César, Profª - Castolira - CMEI', 0),
  ('remocao-2027-2a-fase', '35064038', 'Orlando Pires, Prof. EM', 4),
  ('remocao-2027-2a-fase', '35073124', 'Padre Zezinho EM', 1),
  ('remocao-2027-2a-fase', '35206891', 'Paulo Freire, Prof. EM', 0),
  ('remocao-2027-2a-fase', '35073155', 'Rachel de Aguiar Loberto, Profª EM', 2),
  ('remocao-2027-2a-fase', '35471616', 'Regina Célia M. de Souza Lima EM', 0),
  ('remocao-2027-2a-fase', '35009928', 'Rosália de Fátima Santos Queiroz, Profª CMEI', 0),
  ('remocao-2027-2a-fase', '35206866', 'Ruth Azevedo Romeiro, Profª EM', 1),
  ('remocao-2027-2a-fase', '35005620', 'Ruth Dóris Lemos, Profª CMEI', -1),
  ('remocao-2027-2a-fase', '35274185', 'Serafim Ferreira EM', 0),
  ('remocao-2027-2a-fase', '35010465', 'Silvia Aparecida Quirino, Profª CMEI', -1),
  ('remocao-2027-2a-fase', '35008094', 'Therezinha Macedo Pedro de Andrade, Profº CMEI', 0),
  ('remocao-2027-2a-fase', '35008097', 'Valdira Morgado, Profª CMEI', 0),
  ('remocao-2027-2a-fase', '35073192', 'Vito Ardito EM', 0),
  ('remocao-2027-2a-fase', '35471628', 'Yolanda Immediato Fryling, Da. CMEI', 0),
  ('remocao-2027-2a-fase', '35191619', 'Yvone Ap. Arantes Corrêa, Profª EM', 0)
on conflict (campanha, codigo_inep) do update
   set nome_na_fonte = excluded.nome_na_fonte, vagas = excluded.vagas;

commit;
