-- ============================================================
--  SCHEMA: Saúde Essencial CRM
--  Uses gen_random_uuid() (built-in since PostgreSQL 13)
--  No extensions required
-- ============================================================

-- Consultoras (usuárias do sistema)
CREATE TABLE IF NOT EXISTS consultoras (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(200) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  senha_hash    TEXT NOT NULL,
  telefone      VARCHAR(20),
  slug          VARCHAR(100) UNIQUE NOT NULL,
  foto_url      TEXT,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id       UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  plano               VARCHAR(50) NOT NULL DEFAULT 'starter',
  status              VARCHAR(30) NOT NULL DEFAULT 'trial',
  stripe_customer_id  TEXT,
  stripe_sub_id       TEXT,
  periodo_inicio      TIMESTAMPTZ,
  periodo_fim         TIMESTAMPTZ,
  trial_fim           TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes das consultoras
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  nome            VARCHAR(200) NOT NULL,
  email           VARCHAR(200),
  telefone        VARCHAR(30),
  cpf             VARCHAR(20),
  data_nascimento DATE,
  genero          VARCHAR(30),
  cidade          VARCHAR(100),
  notas           TEXT,
  ativo           BOOLEAN DEFAULT TRUE,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Anamneses
CREATE TABLE IF NOT EXISTS anamneses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  tipo            VARCHAR(50) NOT NULL DEFAULT 'adulto',
  dados           JSONB NOT NULL DEFAULT '{}',
  protocolo       JSONB,
  token_publico   UUID UNIQUE DEFAULT gen_random_uuid(),
  preenchido      BOOLEAN DEFAULT FALSE,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  titulo          VARCHAR(200),
  data_hora       TIMESTAMPTZ NOT NULL,
  tipo            VARCHAR(50) DEFAULT 'consulta',
  status          VARCHAR(30) DEFAULT 'agendado',
  notas           TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_clientes_consultora    ON clientes(consultora_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_consultora   ON anamneses(consultora_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_token        ON anamneses(token_publico);
CREATE INDEX IF NOT EXISTS idx_agendamentos_consultora ON agendamentos(consultora_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_consultora ON assinaturas(consultora_id);

-- Migrations (idempotent — safe to run multiple times)
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS status         VARCHAR(30) DEFAULT 'active';
ALTER TABLE anamneses   ADD COLUMN IF NOT EXISTS subtipo        VARCHAR(20) DEFAULT 'pessoal';
ALTER TABLE anamneses   ADD COLUMN IF NOT EXISTS nome_link      TEXT;
ALTER TABLE anamneses   ADD COLUMN IF NOT EXISTS acessos        INT         DEFAULT 0;
ALTER TABLE anamneses   ADD COLUMN IF NOT EXISTS link_origem_id UUID        REFERENCES anamneses(id) ON DELETE SET NULL;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS endereco       TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS bio            TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS instagram      TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS youtube        TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS facebook       TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS linkedin       TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS role           VARCHAR(20) DEFAULT 'user';
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS genero         VARCHAR(10) DEFAULT 'feminino';
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS genero         VARCHAR(10) DEFAULT 'feminino';
-- Auto-promote the first registered consultora to admin
UPDATE consultoras SET role = 'admin'
  WHERE criado_em = (SELECT MIN(criado_em) FROM consultoras)
    AND (role IS NULL OR role = 'user');

