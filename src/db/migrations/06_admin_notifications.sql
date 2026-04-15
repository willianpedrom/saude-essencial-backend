-- ==========================================
--  SISTEMA DE NOTIFICAÇÕES ADMIN & INCENTIVO
-- ==========================================

-- Pool de mensagens motivacionais/incentivo para envio automático
CREATE TABLE IF NOT EXISTS admin_incentive_pool (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        VARCHAR(100),
  mensagem      TEXT NOT NULL,
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de disparos em massa (Broadcasts)
CREATE TABLE IF NOT EXISTS notification_broadcasts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID NOT NULL REFERENCES consultoras(id) ON DELETE SET NULL,
  titulo        VARCHAR(255) NOT NULL,
  mensagem      TEXT NOT NULL,
  tipo          VARCHAR(50) DEFAULT 'manual', -- manual, automatico
  destinatarios_qtd INT DEFAULT 0,
  cliques_qtd   INT DEFAULT 0,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

-- Registro individual de cliques (para métricas de taxa de leitura)
CREATE TABLE IF NOT EXISTS notification_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id  UUID NOT NULL REFERENCES notification_broadcasts(id) ON DELETE CASCADE,
  consultora_id UUID NOT NULL REFERENCES consultoras(id) ON DELETE CASCADE,
  clicado_em    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broadcast_id, consultora_id) -- Uma consultora conta apenas uma vez por broadcast
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notif_broadcast_admin ON notification_broadcasts(admin_id);
CREATE INDEX IF NOT EXISTS idx_notif_clicks_broadcast ON notification_clicks(broadcast_id);

-- Inserir algumas frases padrão de incentivo (Seed)
INSERT INTO admin_incentive_pool (titulo, mensagem) VALUES
('💧 Dica do Dia', 'Olá {nome}, você já conferiu se há novas anamneses no seu pipeline hoje?'),
('🚀 Foco total!', '{nome}, pequenos hábitos levam a grandes resultados. Entre no sistema para organizar seus atendimentos.'),
('✨ Sucesso!', 'Oi {nome}, o Gota App está pronto para te ajudar a brilhar hoje. Vamos conferir as pendências?'),
('🔔 Lembrete', 'Não esqueça de registrar seus novos contatos, {nome}. A organização é a chave do crescimento!')
ON CONFLICT DO NOTHING;
