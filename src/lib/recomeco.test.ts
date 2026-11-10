import { describe, expect, it } from "vitest";
import { recomecarAparelho } from "./recomeco";

class StorageFalso implements Storage {
  private dados = new Map<string, string>();
  get length() { return this.dados.size; }
  key(i: number) { return [...this.dados.keys()][i] ?? null; }
  getItem(k: string) { return this.dados.get(k) ?? null; }
  setItem(k: string, v: string) { this.dados.set(k, v); }
  removeItem(k: string) { this.dados.delete(k); }
  clear() { this.dados.clear(); }
  chaves() { return [...this.dados.keys()].sort(); }
}

describe("recomecarAparelho", () => {
  it("apaga os dados ligados às escolas uma única vez", () => {
    const s = new StorageFalso();
    s.setItem("school-favorites", "[1,2]");
    s.setItem("home-location", "{}");
    s.setItem("addressSetDate", "2026-11-01");
    s.setItem("school-distances", "{}");
    s.setItem("cachedDistances_-22.9_-45.4", "{}");
    s.setItem("cachedDistances_-22.8_-45.5", "{}");
    s.setItem("app-version-seen", "2.1.0");

    expect(recomecarAparelho(s)).toBe(true);
    expect(s.chaves()).toEqual(["app-version-seen", "school-data-version"]);
    expect(s.getItem("school-data-version")).toBe("supabase");

    s.setItem("school-favorites", '["35073179"]');
    expect(recomecarAparelho(s)).toBe(false);
    expect(s.getItem("school-favorites")).toBe('["35073179"]');
  });

  it("visitante novo não tem o que apagar, mas fica marcado", () => {
    const s = new StorageFalso();
    expect(recomecarAparelho(s)).toBe(false);
    expect(s.getItem("school-data-version")).toBe("supabase");
  });
});
