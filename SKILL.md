# 🧠 OMNI-AGENT SKILL DIRECTIVES

Este ficheiro define as regras de autonomia, arquitetura e inteligência para os agentes IA que operam no repositório **GeoInsight / Omni-Analyst**.
Qualquer agente (incluindo o Antigravity/Gemini) que interaja com este projeto DEVE ler e incorporar estas regras antes de executar qualquer código.

---

## 1. ⚡ PROTOCOLO DE AUTONOMIA E INICIATIVA
- **Ação Proativa:** O agente não deve esperar por micro-instruções. Perante um objetivo ("Criar um painel de correlações"), o agente deve idealizar a estrutura, inferir dependências (Zustand, Tailwind, APIs) e escrever o código completo.
- **Auto-Correção:** Após escrever código, o agente deve antecipar erros (ex: hidratação no Next.js, dependências em falta no useEffect, falhas em APIs externas) e implementar `try/catch`, fallbacks e estados de loading (`skeletons`).
- **Resolução Silenciosa:** Se um comando falhar (ex: erro de npm), o agente deve tentar corrigi-lo autonomamente lendo o erro, sem pedir imediatamente ajuda ao utilizador, a menos que seja um bloqueio crítico (ex: credenciais em falta).

## 2. 🏛️ ARQUITETURA DE SISTEMA (NEXT.JS + SUPABASE)
- **App Router First:** Usar sempre a estrutura de diretórios `app/`. Respeitar a divisão estrita entre Servidor (`Server Components` por defeito) e Cliente (`'use client'` apenas nas "folhas" da árvore de componentes que precisam de interatividade).
- **Gestão de Estado:** Usar **Zustand** para estado global (ex: `useMapStore`, `useThemeStore`). Usar estado local (`useState`) apenas quando o dado não afeta componentes paralelos.
- **Persistência de Dados:** O backend utiliza **Supabase** e **Prisma**. As rotas de API devem validar os inputs e tratar erros antes de aceder à base de dados para evitar crashes no Vercel.

## 3. 🤖 INTEGRAÇÃO DE INTELIGÊNCIA ARTIFICIAL
- **Integração de LLMs:** As chamadas de AI (OpenRouter, Gemini) devem ser feitas exclusivamente via *Server Routes* (em `src/app/api/...`) para proteger as API Keys.
- **Streaming Obrigatório:** Para relatórios ou análises textuais, o agente deve implementar `ReadableStream` (Server-Sent Events) para que o utilizador veja o texto a ser gerado em tempo real, mascarando a latência da API.
- **Degradação Graciosa:** Se a API de AI falhar, esgotar créditos ou demorar, a aplicação DEVE recorrer a um gerador estático de fallbacks baseado em matemática/lógica, garantindo que o utilizador tem sempre uma resposta visível e coerente.

## 4. 🎨 UI/UX AVANT-GARDE & MINIMALISMO INTENCIONAL
- **Regra de Ouro:** *Se parece um template normal do Bootstrap, está errado.*
- **Minimalismo Intencional:** Cada elemento no ecrã tem de ter um propósito matemático e de design. Remover bordas desnecessárias, usar `backdrop-blur`, gradientes subtis, e sombras multi-camada para dar profundidade.
- **Tipografia e Espaçamento:** Usar fontes modernas (`Inter`, `JetBrains Mono` para dados numéricos). O espaçamento deve ser harmonioso e criar um fluxo visual que guia o utilizador diretamente para a estatística mais crítica.
- **Micro-Interações:** Hover states, transições fluidas, e ícones limpos (usar `lucide-react`). O sistema deve parecer "vivo" mas não distrativo.

## 5. 🛠️ CÓDIGO E PERFORMANCE
- **Sem Bibliotecas de UI Desnecessárias:** A menos que seja instruído a usar Shadcn/Radix, construir os componentes diretamente com Tailwind V4 para controlo absoluto a nível do pixel.
- **Performance de Renderização:** Ao lidar com mapas (Leaflet) e dados massivos (Eurostat), evitar re-renders em cadeia. Memorizar cálculos pesados (`useMemo`, `useCallback`) e componentizar logicamente.
- **Typescript Estrito:** Proibido o uso abusivo de `any`. Definir e importar as interfaces em `src/types/`.

---
**Comando de Início:** A partir de agora, o Agente possui a SKILL máxima para fazer evoluir esta plataforma num ecossistema geoestatístico altamente sofisticado e autónomo.
