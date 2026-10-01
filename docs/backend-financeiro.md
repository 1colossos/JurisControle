# Módulo Financeiro — especificação do back-end (futuro)

O JurisControle hoje é um front-end com dados mock (`src/data/seed.ts` + `src/store/AppContext.tsx`).
Este documento registra a modelagem e os contratos que o back-end real (Node.js + Express +
TypeScript + PostgreSQL/Prisma) deverá implementar. A lógica de negócio já existe espelhada no
front-end — os arquivos correspondentes estão indicados em cada seção — de modo que a migração
será trocar a fonte de dados, não reescrever regras.

## 1. Modelagem de dados (Prisma)

Espelhada em: `src/data/seed.ts` (interface `TransacaoFinanceira`).

```prisma
enum TipoTransacao {
  receita
  despesa_operacional
  custas_processuais
}

enum CategoriaTransacao {
  honorarios_contratuais
  honorarios_exito
  sucumbencia
  luz
  internet
  diligencia
}

enum StatusTransacao {
  pendente
  pago
  atrasado
}

model TransacaoFinanceira {
  id             String             @id @default(uuid())
  descricao      String             @db.VarChar(120)
  tipo           TipoTransacao
  categoria      CategoriaTransacao
  valor          Decimal            @db.Decimal(12, 2)
  dataVencimento DateTime           @db.Date
  dataPagamento  DateTime?          @db.Date
  status         StatusTransacao    @default(pendente)

  // Chaves estrangeiras OPCIONAIS: uma conta de luz não tem cliente;
  // honorários podem ter cliente sem processo (consultivo).
  clienteId  String?
  cliente    Cliente?  @relation(fields: [clienteId], references: [id], onDelete: SetNull)
  processoId String?
  processo   Processo? @relation(fields: [processoId], references: [id], onDelete: SetNull)

  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt

  @@index([dataVencimento])
  @@index([status, tipo])
  @@index([clienteId])
  @@index([processoId])
}
```

Equivalente em SQL puro:

```sql
CREATE TYPE tipo_transacao AS ENUM ('receita', 'despesa_operacional', 'custas_processuais');
CREATE TYPE categoria_transacao AS ENUM
  ('honorarios_contratuais', 'honorarios_exito', 'sucumbencia', 'luz', 'internet', 'diligencia');
CREATE TYPE status_transacao AS ENUM ('pendente', 'pago', 'atrasado');

CREATE TABLE transacao_financeira (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao       VARCHAR(120)         NOT NULL,
  tipo            tipo_transacao       NOT NULL,
  categoria       categoria_transacao  NOT NULL,
  valor           NUMERIC(12,2)        NOT NULL CHECK (valor > 0),
  data_vencimento DATE                 NOT NULL,
  data_pagamento  DATE,
  status          status_transacao     NOT NULL DEFAULT 'pendente',
  cliente_id      UUID REFERENCES cliente(id)  ON DELETE SET NULL,
  processo_id     UUID REFERENCES processo(id) ON DELETE SET NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transacao_vencimento ON transacao_financeira (data_vencimento);
CREATE INDEX idx_transacao_status_tipo ON transacao_financeira (status, tipo);
CREATE INDEX idx_transacao_cliente ON transacao_financeira (cliente_id);
CREATE INDEX idx_transacao_processo ON transacao_financeira (processo_id);
```

**Relações.** `Cliente 1—N TransacaoFinanceira` e `Processo 1—N TransacaoFinanceira`, ambas
opcionais (`SET NULL` na exclusão para preservar o histórico contábil). O par de índices
`(status, tipo)` e `data_vencimento` atende às duas consultas quentes: dashboard e régua de
cobrança. O status `atrasado` pode ser persistido pelo job diário ou derivado na leitura
(`status = 'pendente' AND data_vencimento < CURRENT_DATE`) — o front usa a forma derivada
(`statusEfetivo` em `src/lib/financeiro.ts`).

## 2. API REST (Express + TypeScript)

Regras já espelhadas em: `src/lib/financeiro.ts` e `src/store/AppContext.tsx` (CRUD).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/financeiro/transacoes` | Lista com filtros `?tipo=&status=&clienteId=&de=&ate=` |
| `GET` | `/financeiro/transacoes/:id` | Detalhe |
| `POST` | `/financeiro/transacoes` | Cria (valida tipo×categoria, valor > 0) |
| `PUT` | `/financeiro/transacoes/:id` | Atualiza parcial |
| `DELETE` | `/financeiro/transacoes/:id` | Remove |
| `POST` | `/financeiro/transacoes/:id/pagar` | Marca como paga (`dataPagamento = hoje`) |
| `GET` | `/financeiro/dashboard` | Consolidado para o front |

Resposta de `GET /financeiro/dashboard` (o front já consome exatamente estes agregados,
produzidos hoje por `resumoFinanceiro`, `serieMensal` e `despesasPorCategoria`):

```json
{
  "receitasMes": 11650.0,
  "despesasMes": 991.65,
  "saldoProjetado": 10658.35,
  "contasEmAtraso": [{ "id": "…", "descricao": "…", "valor": 1500.0, "dataVencimento": "2026-05-30" }],
  "serieMensal": [{ "mes": "2026-01", "receitas": 7300.0, "despesas": 638.22 }],
  "despesasPorCategoria": [{ "categoria": "luz", "valor": 2809.8 }]
}
```

Estrutura sugerida (injeção de dependências por construtor, erros via middleware único):

```
src/
  modules/financeiro/
    financeiro.repository.ts   // Prisma, só acesso a dados
    financeiro.service.ts      // regras (validação tipo×categoria, agregados)
    financeiro.controller.ts   // HTTP ⇄ DTOs (zod), sem regra de negócio
    financeiro.routes.ts
  shared/errors.ts             // AppError + errorHandler (404, 422, 500)
```

## 3. Régua de cobrança (job diário)

Regras já espelhadas em: `src/lib/cobranca.ts` (seleção, mensagens e mocks
`enviarEmail`/`enviarWhatsApp`). No back-end, agendar com node-cron:

```ts
import cron from "node-cron";

// Todos os dias às 08:00 (America/Sao_Paulo)
cron.schedule("0 8 * * *", () => reguaCobranca.executar(), {
  timezone: "America/Sao_Paulo",
});
```

Consulta do job (mesma seleção do front):

```sql
SELECT * FROM transacao_financeira
WHERE tipo = 'receita'
  AND status = 'pendente'
  AND (data_vencimento = CURRENT_DATE + INTERVAL '3 days'   -- lembrete amigável
    OR data_vencimento = CURRENT_DATE - INTERVAL '1 day');  -- venceu ontem
```

Para cada linha: montar a mensagem (modelos em `montarMensagem`, `src/lib/cobranca.ts`) e
disparar e-mail (SMTP/SendGrid) + WhatsApp (Z-API/Twilio), registrando o envio em uma tabela
`log_cobranca (transacao_id, canal, destino, enviado_em)` para evitar reenvio no mesmo dia.

## 4. Geração de documentos e Portal do Cliente

- `POST /documentos` recebe `{ clienteId, tipo: "procuracao" | "contrato_honorarios" }`, busca o
  cliente, injeta os dados no template e devolve o buffer do PDF (pdfmake ou puppeteer). Os
  templates HTML já existem em `src/lib/documentos.ts`.
- Portal do Cliente: `POST /portal/login` com `{ doc, token }` devolve um JWT de escopo
  `portal:leitura`; `GET /portal/processos` e `GET /portal/cobrancas` filtram pelo cliente do
  token. O token de acesso por cliente já existe no mock (`Cliente.portalToken`).
