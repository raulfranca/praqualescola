# Campanhas: como carregar uma nova

Cada campanha (remoção, atribuição...) entra no banco a partir do documento da Secretaria. Quem carrega é o
agente; o painel `/admin` só edita nome, descrição, datas, o interruptor e o arquivamento. Schema e funções:
`db/migrations/20261111_pqe_campanhas.sql`.

## Passo a passo

> **Atalho:** `python3 db/campanhas/gerar-carga.py <pdf> --id … --data … --nome … --descricao … --fonte …
> --fim …` faz os passos 2 a 5 para listas no formato da APUS: extrai, casa os nomes pelos CSVs anteriores,
> confere e grava o `.csv` e o `.sql`. Para (e o agente segue à mão) se o número de linhas lidas não bate com
> o esperado ou se algum nome não tem par anterior. **O script não substitui a leitura:** o agente lê o PDF ele
> mesmo e confere o resultado do script contra o documento (linhas, escolas com vaga, soma, nomes novos).
> O `.sql` gerado não usa `delete` (atualiza com `on conflict`), então roda inteiro pelo MCP do Supabase.

1. **Guardar o PDF** em `ref/documentos/<ano>/`.
2. **Extrair** cada linha: nome como está no PDF e o número cru (zero e negativo também; só positivo é vaga).
3. **Casar** cada nome com `dados_gerais.escolas.codigo_inep` (consulta só leitura). Ignorar acento, "EM/CMEI",
   abreviações (Prof./Profª/Mons./Pe./Frei/Da.) e a ordem do título. Toda dúvida (sem par, mais de um par, nome
   muito diferente) vai ao usuário de uma vez, antes de gravar.
4. **Conferir** o número de linhas contra o cadastro e recontar no PDF as escolas com vaga e a soma das vagas.
   A rede tem 67 escolas; as listas de remoção trazem 66, porque a EM Maria Apparecida Camargo de Souza
   (terceirizada) não tem vaga de remoção. Qualquer outra diferença: parar e perguntar.
5. **Gravar** `AAAA-MM-DD-<id>.csv` (`nome_na_fonte;codigo_inep;vagas`; campo com aspas vai entre aspas, com as
   internas dobradas) e `AAAA-MM-DD-<id>.sql`. **Início = o momento da carga** (`now()`): o professor consulta
   as vagas antes de o sistema da Secretaria abrir. **Fim** = fim do período de indicação daquela fase no
   edital, com fuso `-03` (Brasília); se o documento não traz, perguntar. A campanha **nasce desligada**
   (boa prática), salvo quando o usuário pedir explicitamente que já nasça ligada (`--ligar` no script).
6. **Executar** o `.sql` no Supabase "Dados" e conferir:

   ```sql
   select count(*), count(*) filter (where vagas > 0), sum(vagas) filter (where vagas > 0)
     from praqualescola.campanha_vagas where campanha = '<id>';
   select v.codigo_inep from praqualescola.campanha_vagas v
     left join dados_gerais.escolas e using (codigo_inep) where e.codigo_inep is null;  -- vazio
   ```

7. **Ligada a pedido do usuário, conferir que está no ar:** `select public.pqe_campanha_no_ar() ->> 'id';`
   deve devolver o `<id>` novo.
   Se devolver outra campanha (uma anterior ainda dentro das datas e ligada, que vence por ter começado antes),
   avisar o usuário: desligar a anterior é decisão dele. O app passa a mostrar as vagas em até 1 minuto, sem
   publicar o app nem abrir o painel. Desligada, o usuário liga pelo painel quando quiser.

> Pelo MCP do Supabase, `delete` cai numa confirmação que é recusada sozinha; por isso o `.sql` gerado não
> usa `delete`. Escola que saiu da lista numa recarga continua no banco: apagar à mão no SQL Editor.
