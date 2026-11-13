# Campanhas: como carregar uma nova

Cada campanha (remoção, atribuição...) entra no banco a partir do documento da Secretaria. Quem carrega é o
agente; o painel `/admin` só edita nome, descrição, datas, o interruptor e o arquivamento. Schema e funções:
`db/migrations/20261111_pqe_campanhas.sql`.

## Passo a passo

> **Atalho:** `python3 db/campanhas/gerar-carga.py <pdf> --id … --data … --nome … --descricao … --fonte …
> --inicio … --fim …` faz os passos 2 a 5 para listas no formato da APUS: extrai, casa os nomes pelos CSVs
> anteriores, confere e grava o `.csv` e o `.sql`. Nome sem par anterior: ele para e lista (passo 3 à mão).
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
   internas dobradas) e `AAAA-MM-DD-<id>.sql` (modelo: o da Remoção 2027 · 1ª fase). Datas de início e fim vêm do
   edital, com fuso `-03` (Brasília); se o documento não traz, perguntar. A campanha nasce `ligada = false`.
6. **Executar** o `.sql` no Supabase "Dados" e conferir:

   ```sql
   select count(*), count(*) filter (where vagas > 0), sum(vagas) filter (where vagas > 0)
     from praqualescola.campanha_vagas where campanha = '<id>';
   select v.codigo_inep from praqualescola.campanha_vagas v
     left join dados_gerais.escolas e using (codigo_inep) where e.codigo_inep is null;  -- vazio
   ```

7. O usuário **liga a campanha pelo painel** quando quiser que o app mostre as vagas.

> Pelo MCP do Supabase, o `delete` do `.sql` (que o torna repetível) cai numa confirmação que é recusada
> sozinha. Em carga nova, com a tabela vazia, rode só os `insert`. Para refazer uma carga, rode o arquivo
> inteiro no SQL Editor do Supabase.
