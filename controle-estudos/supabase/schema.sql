-- Proposta de schema para o Supabase (Postgres).
-- Espelha o modelo usado em src/data/ (localStorage). Nomes em snake_case.
-- Ainda NÃO usado pelo protótipo. Políticas de RLS ficam para quando houver login.

create extension if not exists "pgcrypto";

-- Crianças (não estava na lista pedida, mas as demais tabelas dependem dela)
create table if not exists criancas (
  id            text primary key,                 -- ex.: 'rafael', 'mf'
  nome          text not null,
  apelido       text not null,
  idade         int,
  layout        text not null default 'rafael' check (layout in ('rafael', 'mf')),
  usa_marcas    boolean not null default false,   -- mostra * e ? no registro
  bloco_revisoes jsonb                            -- {titulo, horario, dias:[0..6]}
);

-- Tópicos com o estado da revisão espaçada
create table if not exists topicos (
  id                uuid primary key default gen_random_uuid(),
  crianca_id        text not null references criancas(id) on delete cascade,
  materia           text not null,
  titulo            text not null,
  caixa             smallint not null default 1 check (caixa between 1 and 7),
  dominado          boolean not null default false,
  proxima_revisao   date,                          -- null quando dominado
  ultima_revisao    date,                          -- null = nunca praticado ("Nova")
  ultimo_resultado  text check (ultimo_resultado in ('acertou', 'parcial', 'errou')),
  criado_em         date not null default current_date
);
create index if not exists topicos_revisao_idx on topicos (crianca_id, proxima_revisao) where not dominado;

-- Perguntas de cada tópico (a folha usa a usada há mais tempo)
create table if not exists perguntas (
  id         uuid primary key default gen_random_uuid(),
  topico_id  uuid not null references topicos(id) on delete cascade,
  ordem      int not null default 1,
  tipo       text not null default 'curta' check (tipo in ('curta', 'aberta', 'ditado')),
  enunciado  text not null,
  resposta   text not null default '',
  palavras   text[] not null default '{}'          -- só para ditado
);

-- Folhas (uma por criança por dia). Não estava na lista pedida; guarda o que é do dia.
create table if not exists folhas (
  id              uuid primary key default gen_random_uuid(),
  crianca_id      text not null references criancas(id) on delete cascade,
  data            date not null,
  tipo_folha      text not null check (tipo_folha in ('reforco', 'revisao', 'quiz', 'sem_estudo')),
  elogio          text not null default '',
  bloco_autonomo  boolean not null default false,
  excedentes      jsonb not null default '[]',     -- [{topicoId, motivo}] que passaram do limite
  gerada_em       timestamptz,
  impressa_em     timestamptz,
  registrada_em   timestamptz,
  dispensada      boolean not null default false,  -- pendência que o adulto decidiu deixar
  desatualizada   boolean not null default false,
  unique (crianca_id, data)
);

-- Tarefas = itens da folha (estudo e obrigações), na ordem da folha e do registro
create table if not exists tarefas (
  id                uuid primary key default gen_random_uuid(),
  folha_id          uuid not null references folhas(id) on delete cascade,
  crianca_id        text not null references criancas(id) on delete cascade,
  data              date not null,
  ordem             int not null,
  secao             text not null check (secao in ('estudo', 'casa')),
  tipo              text not null check (tipo in ('Nova', 'Revisão', 'Leitura', 'Escrita', 'Instrumento', 'Casa', 'Animais', 'App')),
  titulo            text not null,
  materia           text,
  periodo           text check (periodo in ('manha', 'tarde', 'noite')),  -- null = sem horário
  topico_id         uuid references topicos(id) on delete set null,
  pergunta_id       uuid references perguntas(id) on delete set null,
  obrigacao_id      uuid,
  motivo            text,                          -- nova | erro | atrasado | vence_hoje | quiz
  caixa_na_folha    smallint,
  tipo_pergunta     text,
  enunciado         text,                          -- cópia do momento da impressão
  palavras          text[] not null default '{}',
  -- registro
  resultado         text check (resultado in ('acertou', 'parcial', 'errou', 'pendente')),
  status            text check (status in ('feito', 'nao_feito', 'nao_se_aplica')),
  marcas            text[] not null default '{}',  -- '*' e/ou '?'
  sugerido          boolean not null default false,
  observacao        text not null default '',
  caixa_manual      smallint check (caixa_manual between 1 and 7),
  estado_antes      jsonb,                         -- para desfazer/corrigir o registro
  conta_recompensa  boolean not null default true
);
create index if not exists tarefas_folha_idx on tarefas (folha_id, ordem);

-- Histórico de erros (🟡 e ❌), datado e com o texto literal
create table if not exists erros_topico (
  id         uuid primary key default gen_random_uuid(),
  topico_id  uuid not null references topicos(id) on delete cascade,
  data       date not null,
  resultado  text not null check (resultado in ('parcial', 'errou')),
  texto      text not null default '',
  marcas     text[] not null default '{}',
  tarefa_id  uuid references tarefas(id) on delete set null
);
create index if not exists erros_topico_idx on erros_topico (topico_id, data);

-- Obrigações fixas (casa, animais, apps, leitura, instrumento...)
create table if not exists obrigacoes (
  id                uuid primary key default gen_random_uuid(),
  crianca_id        text not null references criancas(id) on delete cascade,
  titulo            text not null,
  tipo              text not null check (tipo in ('Leitura', 'Escrita', 'Instrumento', 'Casa', 'Animais', 'App')),
  periodo           text check (periodo in ('manha', 'tarde', 'noite')),  -- App = null
  dias              smallint[] not null default '{0,1,2,3,4,5,6}',      -- 0 = domingo
  emoji             text,
  ordem             int not null default 0,
  conta_recompensa  boolean not null default true,
  ativa             boolean not null default true
);

-- Diário de aulas: cada aula cria um tópico na caixa 1
create table if not exists diario_aulas (
  id          uuid primary key default gen_random_uuid(),
  crianca_id  text not null references criancas(id) on delete cascade,
  data        date not null,
  materia     text not null,
  conteudo    text not null,
  topico_id   uuid references topicos(id) on delete set null
);

-- Agenda semanal: tipo de folha por criança e dia da semana
create table if not exists agenda (
  crianca_id  text not null references criancas(id) on delete cascade,
  dia_semana  smallint not null check (dia_semana between 0 and 6),
  tipo_folha  text not null check (tipo_folha in ('reforco', 'revisao', 'quiz', 'sem_estudo')),
  primary key (crianca_id, dia_semana)
);

-- Configurações do método (limites e fórmula da recompensa). Uma linha só.
create table if not exists configuracoes (
  id      int primary key default 1 check (id = 1),
  valores jsonb not null
);
