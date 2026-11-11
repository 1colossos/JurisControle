# Back-end futuro — Catálogo de prazos, calculadora e foto do cliente

Especificação da API REST que substituirá a camada mock do front-end
(`src/lib/prazos.ts`, `src/lib/businessDays.ts` e o Base64 de `Cliente.foto`).
O front-end já está preparado: os selects em cascata, a calculadora e o
payload da foto consomem exatamente as estruturas descritas aqui.

## 1. Modelagem de dados

### `ramos_direito`
| Campo | Tipo | Observação |
|---|---|---|
| id | serial PK | |
| nome | varchar(40) unique | "Cível", "Penal", "Trabalhista", "Tributária", "Previdenciária", "Juizados Especiais", "Empresarial", "Outra" |

### `procedimentos` (catálogo de prazos — seeding na tabela abaixo)
| Campo | Tipo | Observação |
|---|---|---|
| id | serial PK | |
| ramo_id | FK → ramos_direito | |
| nome | varchar(80) | ex.: "Resposta à Acusação" |
| quantidade | int null | `null` = sem contagem automática (referência manual) |
| unidade | enum `dias` \| `meses` \| `anos` | meses/anos para prazos decadenciais (queixa-crime, rescisória) |
| contagem | enum `uteis` \| `corridos` | úteis = CPC/CLT; corridos = CPP e esfera administrativa |
| fundamento | text | dispositivo legal exibido na UI |

### `processos` (acréscimos)
- `ramo_id` FK → ramos_direito (hoje `Processo.area`)
- `procedimento_nome` varchar(80) — nome do catálogo **ou** texto livre
  quando o usuário usa "Outros / Inserção Manual"
- `prazo_quantidade` / `prazo_contagem` — persistidos apenas na inserção
  manual, para auditoria do cálculo

### `clientes` (acréscimo)
- `foto_url` varchar(255) null — URL do objeto armazenado (S3/disco).
  O front envia a imagem em **Base64 (Data URL)** no JSON de criação/edição
  ou via **multipart/form-data** (campo `foto`); o servidor valida tipo
  (`image/jpeg|png|webp`) e tamanho (≤ 2 MB), grava o arquivo e devolve a URL.

### `feriados`
| Campo | Tipo | Observação |
|---|---|---|
| id | serial PK | |
| data | date | feriados pontuais e suspensões de expediente |
| ambito | enum `nacional` \| `estadual` \| `municipal` \| `forense` | |
| descricao | varchar(120) | |

Feriados móveis (Carnaval, Sexta-feira Santa, Corpus Christi) podem ser
pré-computados por ano via algoritmo de Meeus/Butcher (já implementado em
`src/lib/businessDays.ts`) em uma rotina de seeding anual.

## 2. Rotas REST

```
GET    /api/ramos                          → lista de ramos
GET    /api/ramos/:id/procedimentos        → catálogo do ramo (popula o 2º select)
GET    /api/feriados?ano=2026&uf=MA        → feriados do calendário forense
POST   /api/prazos/calcular                → motor de cálculo (abaixo)
POST   /api/clientes                       → cria cliente (foto em Base64 ou multipart)
PUT    /api/clientes/:id                   → atualiza cliente (idem)
DELETE /api/clientes/:id/foto              → remove a foto de perfil
```

### `POST /api/prazos/calcular`
Requisição:
```json
{
  "termoInicial": "2026-06-12",
  "quantidade": 15,
  "unidade": "dias",
  "contagem": "uteis",
  "feriadosExtras": ["2026-06-24", "2026-07-09"]
}
```
Resposta:
```json
{ "vencimento": "2026-07-03", "diasUteisRestantes": 14, "urgencia": "medio" }
```

## 3. Regras do motor de cálculo

Portar `calcularVencimento` (`src/lib/prazos.ts`) e `somarDiasUteis` /
`somarDiasCorridos` / `somarMeses` (`src/lib/businessDays.ts`):

1. **Exclui o dia do começo** e inclui o do vencimento (art. 224, CPC).
2. **Dias úteis** (CPC art. 219 / CLT art. 775): pula fins de semana,
   feriados do calendário e feriados extras informados.
3. **Dias corridos** (CPP art. 798 / esfera administrativa): soma direta;
   se o vencimento cair em dia não útil, **prorroga** para o primeiro dia
   útil seguinte.
4. **Meses/anos** (prazos decadenciais): soma civil com ajuste de fim de
   mês (31/01 + 1 mês → 28/02) e prorrogação para o dia útil seguinte.

## 4. Seeding do catálogo (tabela de referência)

| Ramo | Procedimento | Prazo | Contagem |
|---|---|---|---|
| Penal | Resposta à Acusação | 10 dias | corridos |
| Penal | Alegações Finais (Memoriais) | 5 dias | corridos |
| Penal | Apelação / RESE (interposição) | 5 dias | corridos |
| Penal | Razões / Contrarrazões de Apelação | 8 dias | corridos |
| Penal | Embargos de Declaração | 2 dias | corridos |
| Penal | Queixa-Crime (decadência) | 6 meses | — |
| Cível | Contestação, Réplica, Embargos à Execução | 15 dias | úteis |
| Cível | Apelação, Agravo de Instrumento, Agravo Interno | 15 dias | úteis |
| Cível | Embargos de Declaração | 5 dias | úteis |
| Cível | Ação Rescisória | 2 anos | — |
| Trabalhista | Contestação | na audiência | manual |
| Trabalhista | Recursos (Ordinário, Revista, Agravo, Embargos TST) | 8 dias | úteis |
| Trabalhista | Embargos de Declaração | 5 dias | úteis |
| Tributária | Impugnação / Recurso ao CARF (administrativo) | 30 dias | corridos |
| Tributária | Contestação / Embargos à Execução Fiscal (judicial) | 30 dias | úteis |
| Tributária | Apelação / Agravos (judicial) | 15 dias | úteis |
| Previdenciária | Recurso ao CRPS / Contrarrazões (administrativo) | 30 dias | corridos |
| Previdenciária | Judicial (Apelação / EDcl) | 15 / 5 dias | úteis |
| Juizados Especiais | Recurso Inominado e Contrarrazões | 10 dias | úteis |
| Juizados Especiais | Embargos de Declaração | 5 dias | úteis |

Fonte canônica no front-end: `src/lib/prazos.ts` (constante `CATALOGO`).
