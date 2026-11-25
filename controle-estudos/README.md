# Controle de Estudos — protótipo

Protótipo funcional do ciclo diário de estudos de duas crianças em educação domiciliar (Rafael, 10 anos, e MF, 7 anos):

1. o app monta a folha do dia;
2. o adulto imprime;
3. o adulto registra os resultados pelo celular (QR code da folha);
4. o motor de caixas atualiza as datas de revisão;
5. a folha do dia seguinte já sai certa.

Todos os dados são **fictícios** e ficam no `localStorage` do navegador.

## Como rodar

Pré-requisito: Node 18 ou mais novo.

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm test           # testes do motor e do ciclo completo (Vitest)
npm run build      # gera a versão de produção em dist/
```

Na primeira execução o app carrega os dados de exemplo. Para recomeçar: **Obrigações e agenda → Restaurar dados de exemplo**.

### Testar o ciclo completo

1. Em **Hoje**, abra **🖨️ Folha** de uma criança e clique em **Imprimir** (ou só veja na tela).
2. Clique em **Registrar** e marque os itens. Ao concluir, o app mostra as mudanças de caixa (ex.: “caixa 2 → caixa 3 · volta em 24/11”).
3. Volte para **Hoje** e use **Avançar 1 dia →**. A folha do dia seguinte já reflete o registro.

A data do app pode ser simulada (campo **Data do app**) para testar sábados, sextas etc. **Voltar ao dia real** desfaz a simulação.

### Registro pelo celular (QR code)

O QR code aponta para `endereço-do-app/registro/<criança>/<data>`. Atenção: **o `localStorage` é separado por aparelho**. No protótipo, o celular só enxerga os dados se o app estiver rodando nele mesmo. Para testar o layout de celular, use a visão de celular das ferramentas do navegador. Para abrir no celular pela rede, use `npm run dev:rede` (o celular terá dados de exemplo próprios). Com o Supabase isso deixa de ser um problema.

## Estrutura

```
src/
  regras/        regras do método — funções puras, sem React e sem localStorage, com testes
    caixas.js        aplicarResultado (✅/🟡/❌), correção manual da caixa
    registroItem.js  como cada item muda no registro (inclui a sugestão de 🟡 por * e ?)
    montarFolha.js   escolhe e ordena os itens do dia (prioridade, limite, sábado, quiz)
    pendencias.js    dias sem registro / itens em branco
    recompensa.js    recompensa da semana (fórmula configurável)
    historico.js     aviso “talvez precise de nova aula”
    configuracao.js  constantes do método e valores configuráveis
    datas.js         datas 'AAAA-MM-DD' sem fuso
  data/          camada de dados — TODA leitura e escrita das telas passa por aqui
    armazenamento.js adaptador (localStorage ou memória, para testes)
    repositorio.js   API assíncrona usada pelas telas
    exemplo.js       dados de exemplo fictícios (datas relativas a hoje)
  paginas/       Hoje, Folha, Registro, Topicos, Cadastros (obrigações e agenda), Recompensa
  componentes/   folhas/ (Rafael, MF, Gabarito), QR code, utilitários
  estilos/       base.css (tela) e impressao.css (folhas e @media print)
supabase/schema.sql  proposta de tabelas
```

**Para trocar por Supabase:** reimplemente as funções de `src/data/repositorio.js` com as mesmas assinaturas (todas já devolvem `Promise`). As telas e as regras não mudam.

## O que foi feito

- **Motor de caixas** (1 → 1 dia, 2 → 3, 3 → 7, 4 → 30, 5 → 90, 6 → 180, 7 → 360), com testes de todos os critérios de aceite.
- **Montagem da folha:** prioridade ❌ → atrasados → vencem no dia; limite por bloco configurável (maior na sexta e no domingo); revisão de sábado vai para domingo; quiz de sexta com tudo que ficou 🟡/❌ na semana; obrigações por frequência e período (apps sem horário). A pergunta de cada tópico é a usada há mais tempo.
- **Folha para imprimir** em três versões (Rafael, MF e Gabarito), todas com a faixa amarela, o espaço do elogio e o QR code.
  - Rafael: estudo em quantas páginas precisar; casa, animais e apps em página separada; pergunta aberta com 3 linhas; ditado com 2 linhas ou mais.
  - MF: letra grande, maiúsculas, emoji por item, ditado com 5 palavras por linha.
  - Gabarito: resposta e histórico de erros datado e literal de cada item, e lista do que ficou para a próxima folha.
- **Registro rápido** para celular: um toque por item, `*` e `?`, observação curta, correção manual da caixa, atalho “tudo ✓” e rascunho. Ao concluir, mostra as mudanças de caixa. Registrar de novo desfaz o registro anterior e aplica o novo.
- **Folhas futuras se atualizam sozinhas:** registrar um dia refaz as folhas seguintes que ainda não foram impressas. As já impressas ficam marcadas como “desatualizada”.
- **Hoje:** resumo por criança, pendências com “Registrar agora” ou “Deixar como está”, atalhos e simulação de data.
- **Tópicos:** filtros por criança, matéria e caixa; histórico de erros; aviso de nova aula; perguntas; correção manual da caixa; diário de aulas (nova aula vira tópico na caixa 1).
- **Obrigações e agenda:** cadastro de obrigações, agenda semanal, configurações do método e restauração dos dados de exemplo.
- **Recompensa da semana:** por criança, com cada tarefa e o motivo de ter contado ou não.
- **Testes:** 54 testes (Vitest), incluindo o ciclo completo folha → impressão → registro → folha seguinte com os dados de exemplo.

## Suposições

Regras ambíguas foram resolvidas pela opção mais simples e, quando possível, deixadas configuráveis.

| # | Suposição | Onde mudar |
|---|---|---|
| 1 | A próxima revisão conta a partir da **data da folha**, não do dia em que o adulto registrou. | `regras/caixas.js` |
| 2 | “Bloco” = **uma matéria** da folha. Limite padrão: 6 revisões por bloco; 10 na sexta e no domingo. A faixa “4 a 6” não vira mínimo, porque puxar itens antes da data quebraria a regra de que a data é um mínimo. | Obrigações e agenda → Configurações |
| 3 | Itens novos (nunca praticados) entram **só na folha de Reforço** e não contam no limite. A folha de Revisão traz só as revisões vencidas. | `regras/montarFolha.js` |
| 4 | Quiz de sexta = revisões vencidas + tópicos com 🟡/❌ nos **últimos 7 dias**. O resultado do quiz move as caixas normalmente. | Configurações (janela) |
| 5 | A **caixa fica no tópico**. A folha mostra a pergunta do tópico usada há mais tempo. | `regras/montarFolha.js` |
| 6 | Correção manual da caixa: próxima revisão = data base + intervalo da caixa escolhida. | `regras/caixas.js` |
| 7 | A observação de um 🟡/❌ vira o **texto literal** do histórico de erros. | `data/repositorio.js` |
| 8 | Aviso “talvez precise de nova aula” = **3 ou mais ❌** no histórico do tópico. | `regras/historico.js` |
| 9 | `*` e `?` aparecem só para crianças com marcas habilitadas (Rafael). | cadastro da criança (`usaMarcas`) |
| 10 | Ao **concluir** o registro, tarefa sem marca vira “Não feito”. Item de estudo em branco continua **pendente** e aparece em Hoje. | `data/repositorio.js` |
| 11 | Pendência pode ser **dispensada** (“Deixar como está”): nada muda de caixa e ela sai da lista. Os tópicos continuam vencidos e voltam nas próximas folhas. | Hoje |
| 12 | **Recompensa (suposição):** semana de segunda a domingo; fórmula padrão = teto × feitas ÷ tarefas que contam. Alternativa: valor fixo por tarefa, até o teto. Item de estudo conta como feito quando tem qualquer resultado (esforço, não acerto). | Configurações |
| 13 | Bloco autônomo = só um aviso na folha e na tela Hoje; não muda regras. | `componentes/folhas/CabecalhoFolha.jsx` |
| 14 | Leitura, Escrita e Instrumento ficam junto do estudo (seção “Rotina”). Casa, Animais e App vão para a página separada. | `regras/configuracao.js` |
| 15 | “Revisões do dia (13h às 14h)” do Rafael é o título do bloco de estudo, nos dias configurados (todos menos sábado). | dados da criança (`blocoRevisoes`) |
| 16 | O app só gera sozinho folhas de hoje em diante, para não criar folhas antigas que virariam pendências. | `paginas/Folha.jsx` |

## O que falta para a primeira versão real

- **Supabase:** implementar `repositorio.js` sobre as tabelas de `supabase/schema.sql` (de preferência com as operações de registro numa função `rpc` transacional), migrar os dados e configurar RLS.
- **Login do adulto** e acesso das crianças (fora do escopo do protótipo).
- **Registro no celular com os dados compartilhados**, que depende do Supabase; hoje o `localStorage` é por aparelho.
- **Confirmar com a família:** a fórmula da recompensa, o tamanho do bloco, o que muda no bloco autônomo e as suposições acima.
- Editar e excluir tópicos e perguntas (hoje só é possível criar e corrigir a caixa).
- Cadastro de crianças pela interface (hoje vêm dos dados de exemplo).
- Corrigir um registro antigo depois que folhas mais novas já foram registradas: hoje o app desfaz só o efeito daquele registro, o que pode bagunçar a caixa se o tópico foi revisado depois.
- Testes de interface (ex.: Playwright) e acessibilidade.
- Publicação (Vercel/Netlify) com fallback de rotas para o `BrowserRouter`.
# controle_estudos
