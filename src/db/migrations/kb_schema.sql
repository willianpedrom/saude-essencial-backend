-- Base de Conhecimento: Óleos e Protocolos
CREATE TABLE IF NOT EXISTS kb_oils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(100),
    category VARCHAR(50), -- single, blend, supplement
    function TEXT,
    uses TEXT,
    apply_topical TEXT,
    apply_aromatic TEXT,
    apply_internal TEXT,
    safety_warnings TEXT,
    prices JSONB, -- Array de tamanhos e preços
    is_kit_living BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kb_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom VARCHAR(100) UNIQUE NOT NULL,
    focus VARCHAR(100),
    icon VARCHAR(10),
    therapeutic_objective TEXT,
    routine JSONB, -- { morning: [], afternoon: [], night: [] }
    expected_results TEXT,
    affirmation TEXT,
    safety_filter JSONB, -- { avoid_pregnant: bool, avoid_kids: bool, etc }
    safety_alert TEXT, -- Alerta específico de segurança a ser exibido no laudo
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de ligação: quais óleos são recomendados para qual sintoma
CREATE TABLE IF NOT EXISTS kb_protocol_oils (
    protocol_id UUID REFERENCES kb_protocols(id) ON DELETE CASCADE,
    oil_name VARCHAR(100), -- Usamos nome direto para facilitar integração com o banco de óleos
    PRIMARY KEY (protocol_id, oil_name)
);
