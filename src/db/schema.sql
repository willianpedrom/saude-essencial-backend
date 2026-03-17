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
  termos_aceitos BOOLEAN DEFAULT FALSE,
  termos_aceitos_em TIMESTAMPTZ,
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
  trial_fim           TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
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
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);

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
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS link_afiliada  TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS genero         VARCHAR(10) DEFAULT 'feminino';
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS tema_cor       VARCHAR(20) DEFAULT '#16a34a';
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS genero         VARCHAR(10) DEFAULT 'feminino';
-- Auto-promote the first registered consultora to admin
UPDATE consultoras SET role = 'admin'
  WHERE criado_em = (SELECT MIN(criado_em) FROM consultoras)
    AND (role IS NULL OR role = 'user');


ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS pipeline_stage  VARCHAR(40) DEFAULT 'lead_captado';
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS pipeline_notas  TEXT;
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS motivo_perda    TEXT;

-- Funil Paralelo de Recrutamento
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS recrutamento_stage  VARCHAR(40);
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS recrutamento_notas  TEXT;
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS motivo_perda_recrutamento TEXT;

-- Tipo de Cadastro Visual (Consultora VS Cliente Preferencial)
ALTER TABLE clientes    ADD COLUMN IF NOT EXISTS tipo_cadastro VARCHAR(30);

-- Links Personaliados da Consultora (Linktree)
CREATE TABLE IF NOT EXISTS consultora_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  titulo          VARCHAR(150) NOT NULL,
  url             TEXT NOT NULL,
  icone           VARCHAR(50) DEFAULT '🔗',
  is_public       BOOLEAN DEFAULT TRUE,
  ordem           INT DEFAULT 0,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultora_links_consultora ON consultora_links(consultora_id);

-- Etiquetas personalizadas por consultora
CREATE TABLE IF NOT EXISTS etiquetas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  cor           VARCHAR(20) DEFAULT '#3b82f6',
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Depoimentos (enviados por link público ou registrados manualmente)
CREATE TABLE IF NOT EXISTS depoimentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id   UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  cliente_nome    VARCHAR(200) NOT NULL,
  cliente_email   VARCHAR(200),
  cliente_telefone VARCHAR(30),
  texto           TEXT NOT NULL,
  nota            SMALLINT DEFAULT 10,
  aprovado        BOOLEAN DEFAULT FALSE,
  consentimento   BOOLEAN DEFAULT FALSE,
  origem          VARCHAR(20) DEFAULT 'manual',
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS consentimento BOOLEAN DEFAULT FALSE;
ALTER TABLE depoimentos ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(30);

-- Relação N:N entre depoimentos e etiquetas
CREATE TABLE IF NOT EXISTS depoimentos_etiquetas (
  depoimento_id UUID REFERENCES depoimentos(id) ON DELETE CASCADE,
  etiqueta_id   UUID REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (depoimento_id, etiqueta_id)
);

CREATE INDEX IF NOT EXISTS idx_depoimentos_consultora ON depoimentos(consultora_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_consultora   ON etiquetas(consultora_id);

-- ── Planos do sistema (configuráveis pelo admin) ─────────────────────────────
CREATE TABLE IF NOT EXISTS planos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(50) UNIQUE NOT NULL,   -- ex: 'starter', 'pro', 'enterprise'
  nome                VARCHAR(100) NOT NULL,
  preco_mensal        NUMERIC(10,2) DEFAULT 0,
  clientes_max        INT,                           -- NULL = ilimitado
  anamneses_mes_max   INT,                           -- NULL = ilimitado
  tem_integracoes     BOOLEAN DEFAULT FALSE,         -- Meta Pixel, GA4, Clarity etc.
  tem_pipeline        BOOLEAN DEFAULT TRUE,
  tem_multiusuario    BOOLEAN DEFAULT FALSE,
  tem_relatorios      BOOLEAN DEFAULT TRUE,
  hotmart_offer_id    TEXT,                          -- ID da oferta na Hotmart
  ativo               BOOLEAN DEFAULT TRUE,
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planos_slug ON planos(slug);

-- Seed dos planos padrão (idempotente)
INSERT INTO planos (slug, nome, preco_mensal, clientes_max, anamneses_mes_max, tem_integracoes, tem_pipeline, tem_multiusuario)
VALUES
  ('starter',    'Starter',    49.00,  30,   5,    false, true,  false),
  ('pro',        'Pro',        97.00,  NULL, NULL, true,  true,  false),
  ('enterprise', 'Enterprise', 197.00, NULL, NULL, true,  true,  true)
ON CONFLICT (slug) DO NOTHING;

-- Migrations novas em assinaturas
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS hotmart_offer_id       TEXT;
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS trial_fim_estendido    TIMESTAMPTZ;
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS observacoes            TEXT;

-- Compras registradas no sistema (histórico de pagamentos)
CREATE TABLE IF NOT EXISTS pagamentos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id       UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  gateway             VARCHAR(20) DEFAULT 'hotmart',
  evento              VARCHAR(60),                   -- ex: PURCHASE_COMPLETE
  transaction_id      TEXT,
  subscription_id     TEXT,
  plano               VARCHAR(50),
  valor               NUMERIC(10,2),
  status              VARCHAR(30),
  payload             JSONB,
  criado_em           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_consultora ON pagamentos(consultora_id);

-- ── Índices para dashboard: COUNT por stage (evita full scan) ────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_pipeline     ON clientes(consultora_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_clientes_recrutamento ON clientes(consultora_id, recrutamento_stage);


-- ── Recuperação de senha ────────────────────────────────────────────────────
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS reset_token       TEXT;
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;

-- ── JWT Token Versioning (revoke tokens on password change / logout) ─────────
ALTER TABLE consultoras ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;


-- ── Trial de 7 dias (era 14) ────────────────────────────────────────────────
ALTER TABLE assinaturas ALTER COLUMN trial_fim SET DEFAULT (NOW() + INTERVAL '7 days');
-- ==========================================
-- CENTRAL DE AVISOS DO SISTEMA
-- ==========================================

-- Avisos criados pelo Admin
CREATE TABLE IF NOT EXISTS avisos_sistema (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        VARCHAR(255) NOT NULL,
  mensagem      TEXT NOT NULL,
  tipo          VARCHAR(50) DEFAULT 'info', -- info, success, warning, danger
  exibicao      VARCHAR(50) DEFAULT 'ambos', -- modal, banner, ambos
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Controle de avisos já lidos pelas consultoras (para não exibir modais repetidos)
CREATE TABLE IF NOT EXISTS avisos_lidos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aviso_id      UUID NOT NULL REFERENCES avisos_sistema(id) ON DELETE CASCADE,
  consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  lido_em       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(aviso_id, consultora_id)
);

CREATE INDEX IF NOT EXISTS idx_avisos_lidos_consultora ON avisos_lidos(consultora_id);
CREATE INDEX IF NOT EXISTS idx_avisos_lidos_aviso ON avisos_lidos(aviso_id);

-- ==========================================
-- FOLLOW-UPS DE PÓS-VENDA
-- ==========================================

CREATE TABLE IF NOT EXISTS followups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  cliente_id    UUID REFERENCES clientes(id) ON DELETE SET NULL,
  nota          TEXT NOT NULL,
  due_date_time TIMESTAMPTZ,
  status        VARCHAR(20) DEFAULT 'pending',  -- pending, done
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_consultora ON followups(consultora_id);
CREATE INDEX IF NOT EXISTS idx_followups_cliente    ON followups(cliente_id);
CREATE INDEX IF NOT EXISTS idx_followups_status     ON followups(status);

-- ── Trigger: auto-set atualizado_em on every UPDATE ─────────────────────────
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'consultoras', 'clientes', 'anamneses', 'agendamentos',
    'depoimentos', 'assinaturas', 'avisos_sistema', 'followups'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_atualizado_em ON %I; '
      'CREATE TRIGGER trg_atualizado_em BEFORE UPDATE ON %I '
      'FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();',
      t, t
    );
  END LOOP;
END $$;
