import { School } from "@/types/school";

export interface SchoolTag {
  label: string;
  className: string;
}

/**
 * Gera as tags de níveis escolares com base na lógica exata dos dados
 */
export function getSchoolLevelTags(school: School): SchoolTag[] {
  const tags: SchoolTag[] = [];

  // 1. Berçário
  if (school.bercario && school.bercario > 0) {
    tags.push({
      label: "Berçário",
      className: "bg-teal-500/15 text-teal-800 dark:text-teal-300"
    });
  }

  // 2. Infantil - lógica detalhada
  const hasInfantil1 = school.infantil1 && school.infantil1 > 0;
  const hasInfantil2 = school.infantil2 && school.infantil2 > 0;

  if (hasInfantil1 && hasInfantil2) {
    tags.push({
      label: "Inf. 1 e 2",
      className: "bg-teal-500/15 text-teal-800 dark:text-teal-300"
    });
  } else if (hasInfantil1) {
    tags.push({
      label: "Inf. 1",
      className: "bg-teal-500/15 text-teal-800 dark:text-teal-300"
    });
  } else if (hasInfantil2) {
    tags.push({
      label: "Inf. 2",
      className: "bg-teal-500/15 text-teal-800 dark:text-teal-300"
    });
  }

  // 3. Pré-escola - lógica detalhada
  const hasPre1 = school.pre1 && school.pre1 > 0;
  const hasPre2 = school.pre2 && school.pre2 > 0;

  if (hasPre1 && hasPre2) {
    tags.push({
      label: "Pré 1 e 2",
      className: "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    });
  } else if (hasPre1) {
    tags.push({
      label: "Pré 1",
      className: "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    });
  } else if (hasPre2) {
    tags.push({
      label: "Pré 2",
      className: "bg-amber-500/15 text-amber-800 dark:text-amber-300"
    });
  }

  // 4. Ensino Fundamental - lógica de ranges contínuos
  const anos = [
    { num: 1, has: school.ano1 && school.ano1 > 0 },
    { num: 2, has: school.ano2 && school.ano2 > 0 },
    { num: 3, has: school.ano3 && school.ano3 > 0 },
    { num: 4, has: school.ano4 && school.ano4 > 0 },
    { num: 5, has: school.ano5 && school.ano5 > 0 },
  ];

  const fundamentalTags = getFundamentalTags(anos);
  tags.push(...fundamentalTags);

  return tags;
}

/**
 * Gera tags para o ensino fundamental detectando ranges contínuos
 */
function getFundamentalTags(anos: { num: number; has: boolean }[]): SchoolTag[] {
  const tags: SchoolTag[] = [];
  const className = "bg-cyan-600/15 text-cyan-800 dark:text-cyan-300";

  // Encontrar blocos contínuos
  let i = 0;
  while (i < anos.length) {
    if (!anos[i].has) {
      i++;
      continue;
    }

    // Início de um bloco
    const start = i;
    let end = i;

    // Encontrar o fim do bloco contínuo
    while (end + 1 < anos.length && anos[end + 1].has) {
      end++;
    }

    // Gerar a tag apropriada
    if (start === end) {
      // Ano único
      tags.push({
        label: `${anos[start].num}º`,
        className
      });
    } else {
      // Range de anos
      tags.push({
        label: `${anos[start].num}º ao ${anos[end].num}º ano`,
        className
      });
    }

    i = end + 1;
  }

  return tags;
}
