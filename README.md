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

1. **Login** — acesso com CPF ou e-mail e senha, com logo do sistema.
2. **Criar conta** — cadastro do advogado (e-mail, nome, nascimento, OAB, áreas de atuação, telefone, UF e escritório opcional) com validação completa.
3. **Esqueci minha senha** — recuperação por CPF ou e-mail.
4. **Dashboard** — KPIs, termos críticos, notificações do usuário e exportação do painel em PDF.
5. **Listagem de Processos** — busca, filtros por urgência/status e paginação.
6. **Cadastro / Edição de Processo** — área do processo (Cível, Trabalhista, Penal, Tributária…), regras legais de contagem por peça/área (dias úteis ou corridos) com referência manual sempre disponível, validação do número CNJ e da vara.
7. **Detalhes do Processo** — linha do tempo e anexos com upload, pré-visualização (PDF/imagem) e exclusão.
8. **Clientes** — PF/PJ com CPF/CNPJ validados (dígito verificador), status social, domicílio e contatos.
9. **Configurações** — perfil com foto, tema claro/escuro, SMTP, Z-API (WhatsApp) e toggles de alertas.

## 🛠️ Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) (build e dev server)
- [Tailwind CSS](https://tailwindcss.com/) (design system navy + dourado)
- [React Router](https://reactrouter.com/) (navegação)
- [Framer Motion](https://www.framer.com/motion/) (animações) · [Lucide](https://lucide.dev/) (ícones)

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
