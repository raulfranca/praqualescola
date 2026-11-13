# Simulação da carga da 2ª fase (13/11/2026)

PDF **falso** (`SIMULACAO_Vagas_Remocao_2a_fase.pdf`), gerado no layout da lista da APUS a partir da 1ª fase
com números alterados, para testar o fluxo inteiro pela nuvem: PDF → `gerar-carga.py` → CSV/SQL → Supabase →
campanha ligada → `pqe_campanha_no_ar()`. No banco, tudo rodou dentro de um bloco desfeito no fim (nada
gravado). Esta pasta não deve ir para a `dev`.
