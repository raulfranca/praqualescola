import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseCSV } from "./csvParser";

const CABECALHO =
  "ID,TIPO,NOME,ENDERECO,CEP,TELEFONE,RAMAL,BAIRRO,LAT,LNG,LINK,SETOR,POLO,TERC,BERC,INF1,INF2,PRE1,PRE2,A1,A2,A3,A4,A5,VAGAS";

describe("parseCSV", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("lê uma escola, com vírgula dentro de aspas e a coluna de vagas", () => {
    const linha =
      '7,EM,Escola Teste,"Rua A, 100",12400-000,1234,,Centro,-22.9,-45.4,link,S1,P1,,1,0,2,0,0,1,1,0,0,0,3';
    const [s] = parseCSV(`${CABECALHO}\n${linha}`, "VAGAS");
    expect(s).toMatchObject({
      id: 7,
      name: "Escola Teste",
      address: "Rua A, 100",
      lat: -22.9,
      lng: -45.4,
      bercario: 1,
      infantil2: 2,
      ano2: 1,
      vacancies: 3,
    });
  });

  it("pula linhas vazias e linhas com menos de 14 colunas", () => {
    const csv = `${CABECALHO}\n\n1,EM,Curta\n`;
    expect(parseCSV(csv, "VAGAS")).toEqual([]);
  });

  it("zera vagas quando a coluna não existe ou o valor não é positivo", () => {
    const linha = "1,EM,X,End,0,0,,B,0,0,l,S,P,,0,0,0,0,0,0,0,0,0,0,-2";
    expect(parseCSV(`${CABECALHO}\n${linha}`, "VAGAS")[0].vacancies).toBe(0);
    expect(parseCSV(`${CABECALHO}\n${linha}`, "OUTRA")[0].vacancies).toBe(0);
  });
});
