"""Gera a carga de uma campanha (CSV + SQL) a partir do PDF de vagas da Secretaria.

Uso:
  python3 db/campanhas/gerar-carga.py <pdf> --id remocao-2027-2a-fase --data 2026-11-20 \
      --nome "Remoção 2027 · 2ª fase" --descricao "..." --fonte "Lista da Secretaria de 20/11/2026" \
      --inicio "2026-11-18 06:00:00-03" --fim "2026-11-19 07:00:00-03" [--saida db/campanhas]

Casa cada nome com o INEP pelos CSVs de campanhas anteriores (db/campanhas/*.csv). Nome sem par
anterior: o script para e lista; o agente casa à mão (README, passo 3) e acrescenta no CSV gerado.
Precisa do `pdftotext` (poppler-utils).
"""
import argparse, csv, glob, os, re, subprocess, sys, unicodedata

LINHA = re.compile(r"^(\S.*?\S)\s{2,}(-?\d+)\s*$")


def normalizar(nome: str) -> str:
    s = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


def extrair(pdf: str) -> list[tuple[str, int]]:
    texto = subprocess.run(["pdftotext", "-layout", pdf, "-"], capture_output=True, text=True, check=True).stdout
    return [(m.group(1).strip(), int(m.group(2))) for l in texto.splitlines() if (m := LINHA.match(l.strip()))]


def mapa_conhecido(pasta: str, ignorar: str) -> dict[str, str]:
    mapa = {}
    for arq in sorted(glob.glob(os.path.join(pasta, "*.csv"))):
        if os.path.abspath(arq) == os.path.abspath(ignorar):
            continue
        with open(arq, encoding="utf-8") as f:
            for r in csv.DictReader(f, delimiter=";"):
                mapa[normalizar(r["nome_na_fonte"])] = r["codigo_inep"]
    return mapa


def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("pdf")
    for a in ("id", "data", "nome", "descricao", "fonte", "inicio", "fim"):
        p.add_argument("--" + a, required=True)
    p.add_argument("--saida", default=os.path.dirname(os.path.abspath(__file__)))
    a = p.parse_args()

    base = os.path.join(a.saida, f"{a.data}-{a.id}")
    linhas = extrair(a.pdf)
    mapa = mapa_conhecido(os.path.dirname(os.path.abspath(__file__)), base + ".csv")
    casadas, sem_par = [], []
    for nome, vagas in linhas:
        inep = mapa.get(normalizar(nome))
        (casadas if inep else sem_par).append((nome, inep, vagas))
    ineps = [i for _, i, _ in casadas]
    repetidos = sorted({i for i in ineps if ineps.count(i) > 1})

    positivas = [v for *_, v in casadas if v > 0]
    print(f"linhas no PDF: {len(linhas)} | casadas: {len(casadas)} | sem par: {len(sem_par)}")
    print(f"escolas com vaga: {len(positivas)} | total de vagas: {sum(positivas)}")
    if sem_par or repetidos:
        for nome, _, v in sem_par:
            print(f"  SEM PAR: {nome} ({v})")
        for i in repetidos:
            print(f"  INEP REPETIDO: {i}")
        sys.exit(1)

    with open(base + ".csv", "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, delimiter=";", lineterminator="\n")
        w.writerow(["nome_na_fonte", "codigo_inep", "vagas"])
        w.writerows(casadas)

    valores = ",\n".join(f"  ({q(a.id)}, {q(i)}, {q(n)}, {v})" for n, i, v in casadas)
    sql = f"""-- {a.nome} — {a.descricao}
-- Fonte: {os.path.relpath(a.pdf)} ({len(casadas)} escolas). Casamento nome → INEP: o .csv ao lado.
-- Período: {a.inicio} a {a.fim}.
-- Gerado por db/campanhas/gerar-carga.py. Idempotente sem `delete`: rodar de novo atualiza dados e
-- vagas, mas não mexe no interruptor nem no arquivamento (a campanha nasce desligada).

begin;

insert into praqualescola.campanhas (id, nome, descricao, inicio, fim, ligada, fonte)
values ({q(a.id)}, {q(a.nome)}, {q(a.descricao)}, {q(a.inicio)}, {q(a.fim)}, false, {q(a.fonte)})
on conflict (id) do update
   set nome = excluded.nome, descricao = excluded.descricao, inicio = excluded.inicio,
       fim = excluded.fim, fonte = excluded.fonte, atualizada_em = now();

insert into praqualescola.campanha_vagas (campanha, codigo_inep, nome_na_fonte, vagas) values
{valores}
on conflict (campanha, codigo_inep) do update
   set nome_na_fonte = excluded.nome_na_fonte, vagas = excluded.vagas;

commit;
"""
    with open(base + ".sql", "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"gravados: {base}.csv e {base}.sql")


if __name__ == "__main__":
    main()
