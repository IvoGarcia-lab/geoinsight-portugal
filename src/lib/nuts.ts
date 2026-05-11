/**
 * NUTS code → Portuguese region name mapping
 */
const NUTS_NAMES: Record<string, string> = {
  // NUTS 1
  PT1: 'Portugal Continental',
  PT2: 'Região Autónoma dos Açores',
  PT3: 'Região Autónoma da Madeira',

  // NUTS 2
  PT11: 'Norte',
  PT15: 'Algarve',
  PT16: 'Centro',
  PT17: 'Área Metropolitana de Lisboa',
  PT18: 'Alentejo',
  PT20: 'Região Autónoma dos Açores',
  PT30: 'Região Autónoma da Madeira',

  // NUTS 3
  PT111: 'Alto Minho',
  PT112: 'Cávado',
  PT119: 'Ave',
  PT11A: 'Área Metropolitana do Porto',
  PT11B: 'Alto Tâmega',
  PT11C: 'Tâmega e Sousa',
  PT11D: 'Douro',
  PT11E: 'Terras de Trás-os-Montes',
  PT150: 'Algarve',
  PT16B: 'Oeste',
  PT16D: 'Região de Aveiro',
  PT16E: 'Região de Coimbra',
  PT16F: 'Região de Leiria',
  PT16G: 'Viseu Dão Lafões',
  PT16H: 'Beira Baixa',
  PT16I: 'Médio Tejo',
  PT16J: 'Beiras e Serra da Estrela',
  PT170: 'Área Metropolitana de Lisboa',
  PT181: 'Alentejo Litoral',
  PT184: 'Baixo Alentejo',
  PT185: 'Lezíria do Tejo',
  PT186: 'Alto Alentejo',
  PT187: 'Alentejo Central',
  PT200: 'Região Autónoma dos Açores',
  PT300: 'Região Autónoma da Madeira',
};

export function getNutsName(code: string): string {
  return NUTS_NAMES[code] || code;
}

export function getNutsLevel(code: string): 1 | 2 | 3 {
  // PT = country, PT1 = NUTS1 (3 chars), PT11 = NUTS2 (4 chars), PT111 = NUTS3 (5 chars)
  const len = code.length;
  if (len <= 3) return 1;
  if (len === 4) return 2;
  return 3;
}

export function getAllNutsNames(): Record<string, string> {
  return { ...NUTS_NAMES };
}
