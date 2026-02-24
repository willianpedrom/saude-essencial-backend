-- ============================================================
--  SCHEMA: Saúde Essencial CRM
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Consultoras (usuárias do sistema)
CREATE TABLE IF NOT EXISTS consultoras (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        VARCHAR(200) NOT NULL,
  email       VARCHAR(200) UNIQUE NOT NULL,
  senha_hash  TEXT NOT NULL,
  telefone    VARCHAR(20),
  slug        VARCHAR(100) UNIQUE NOT NULL,  -- para URL pública da anamnese
  foto_url    TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultora_id       UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  plano               VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter | pro | premium
  status              VARCHAR(30) NOT NULL DEFAULT 'trial',   -- trial | active | cancelled | expired
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
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  tipo            VARCHAR(50) NOT NULL DEFAULT 'adulto', -- adulto | mulher | crianca | pet
  dados           JSONB NOT NULL DEFAULT '{}',
  protocolo       JSONB,
  token_publico   UUID UNIQUE DEFAULT uuid_generate_v4(), -- token para link de preenchimento
  preenchido      BOOLEAN DEFAULT FALSE,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  titulo          VARCHAR(200),
  data_hora       TIMESTAMPTZ NOT NULL,
  tipo            VARCHAR(50) DEFAULT 'consulta', -- consulta | followup
  status          VARCHAR(30) DEFAULT 'agendado', -- agendado | realizado | cancelado
  notas           TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_clientes_consultora ON clientes(consultora_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_consultora ON anamneses(consultora_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_token ON anamneses(token_publico);
CREATE INDEX IF NOT EXISTS idx_agendamentos_consultora ON agendamentos(consultora_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_consultora ON assinaturas(consultora_id);
