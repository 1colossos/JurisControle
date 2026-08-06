# JurisControle

> Sistema web de controle e notificação de prazos processuais para advogados autônomos de São Luís e Itapecuru-Mirim/MA.

JurisControle centraliza processos, clientes e prazos em um único ambiente, com **contagem automática em dias úteis**, **sinalização cromática de urgência** e **notificações automatizadas** por e-mail e WhatsApp — reduzindo o risco de perda de prazos.

Projeto desenvolvido para a disciplina de **Desenvolvimento Web** do curso de Análise e Desenvolvimento de Sistemas (UEMA — Campus Itapecuru-Mirim).

## ✨ Diferenciais

- **Motor de prazos em dias úteis** ([`src/lib/businessDays.ts`](src/lib/businessDays.ts)) — desconsidera fins de semana, feriados nacionais (incluindo móveis como Carnaval e Corpus Christi, via algoritmo de Meeus/Butcher), feriados regionais do Maranhão e suspensões forenses cadastradas.
- **Urgência derivada em tempo real** — a cor (crítico/alto/médio/baixo) não é fixa: é recalculada a partir dos dias úteis restantes.
- **SPA reativa** com transições de tela, modais animados e _toasts_.
- **Cadastro com prévia de prazo ao vivo** — escolha o termo inicial e a regra de contagem e veja o vencimento e a urgência se atualizarem instantaneamente.

## 🖥️ Telas (9)

1. **Login e Autenticação** — acesso seguro + modo demonstração.
2. **Dashboard** — KPIs, termos críticos, legenda de urgência e painel de notificações.
3. **Listagem de Processos** — busca, filtros por urgência/status e paginação.
4. **Cadastro / Edição** — contagem de prazos em dias úteis com prévia e lembretes.
5. **Detalhes do Processo** — cabeçalho, linha do tempo, arquivos e exclusão.
6. **Clientes** — tabela, filtro por tipo e formulário flutuante (criar/editar).
7. **Calendário Interativo** — grade dinâmica com feriados/suspensões e detalhes do dia.
8. **Relatórios e Exportação** — filtros de período, gráficos e pré-visualização.
9. **Configurações e Integrações** — perfil, SMTP, Z-API (WhatsApp) e toggles de alertas.

## 🛠️ Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build e dev server)
- [Tailwind CSS](https://tailwindcss.com/) (design system navy + dourado)
- [React Router](https://reactrouter.com/) (navegação)
- [Recharts](https://recharts.org/) (gráficos) · [Framer Motion](https://www.framer.com/motion/) (animações) · [Lucide](https://lucide.dev/) (ícones)

## 🚀 Como executar

```bash
npm install      # instala as dependências
npm run dev      # ambiente de desenvolvimento (http://localhost:5173)
npm run build    # build de produção em dist/
npm run preview  # pré-visualiza o build
```

## 📦 Deploy

O deploy para o **GitHub Pages** é automático via GitHub Actions a cada push na `main`
(ver [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)). A aplicação fica
disponível em `https://1colossos.github.io/JurisControle/`.

> Os dados são fictícios (camada _mock_ em [`src/data/seed.ts`](src/data/seed.ts)) e servem
> para demonstrar a interface; em produção, viriam de uma API/back-end.

## 👥 Autores

- Afonso Gabriel
`https://github.com/1colossos`
- Andrey de Sousa
`https://github.com/AndreyNicollas`
- Adrian Raul
  `https://github.com/adrianRaulDev`

Orientação: Prof. Wesley Batista Dominices de Araujo.
