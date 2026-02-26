/* ============================================================
   ANAMNESIS DATA – Perguntas detalhadas e banco de óleos
   Sistema Saúde Essencial CRM
   ============================================================ */

export const ANAMNESIS_STEPS = [
    { id: 'personal', label: 'Dados Pessoais', icon: '👤' },
    { id: 'health', label: 'Saúde Geral', icon: '🫀' },
    { id: 'emotional', label: 'Emocional & Sono', icon: '🧠' },
    { id: 'body', label: 'Corpo & Hábitos', icon: '✨' },
    { id: 'goals', label: 'Objetivos', icon: '🎯' },
];


export const ANAMNESIS_QUESTIONS = {
    personal: {
        title: 'Dados Pessoais', icon: '👤',
        fields: [
            { name: 'full_name', label: 'Nome completo', type: 'text', required: true },
            { name: 'email', label: 'E-mail', type: 'email', required: true },
            { name: 'phone', label: 'WhatsApp', type: 'tel', required: true },
            { name: 'birthdate', label: 'Data de nascimento', type: 'date', required: true },
            { name: 'gender', label: 'Gênero', type: 'select', required: true, options: ['Feminino', 'Masculino'] },
            { name: 'city', label: 'Cidade / Estado', type: 'text' },
            { name: 'occupation', label: 'Profissão', type: 'text' },
        ]
    },
    health: {
        title: 'Saúde Geral', icon: '🫀',
        sections: [
            { label: 'Medicamentos ou suplementos em uso contínuo?', key: 'medications', type: 'textarea', placeholder: 'Liste medicamentos e suplementos (ou deixe em branco)' },
            {
                label: 'Sintomas físicos frequentes', key: 'general_symptoms', type: 'checkbox', options: [
                    'Dores de cabeça frequentes', 'Enxaqueca', 'Dores musculares', 'Dores nas articulações',
                    'Dor nas costas', 'Pressão alta', 'Pressão baixa', 'Falta de ar',
                    'Sinusite / Rinite', 'Alergias frequentes', 'Gripes frequentes',
                    'Queda de cabelo', 'Unhas fracas', 'Infecções frequentes', 'Inchaço nas pernas',
                ]
            },
            {
                label: 'Problemas digestivos', key: 'digestive_symptoms', type: 'checkbox', options: [
                    'Refluxo / Azia', 'Gastrite', 'Inchaço abdominal', 'Gases excessivos',
                    'Constipação', 'Diarreia frequente', 'Intestino irritável',
                    'Náuseas', 'Intolerância à lactose', 'Sensibilidade ao glúten',
                    'Fígado sobrecarregado', 'Compulsão alimentar',
                ]
            },
            {
                label: 'Saúde hormonal', key: 'hormonal_female', type: 'checkbox', options: [
                    'Cólicas menstruais intensas', 'Ciclo irregular', 'TPM intensa',
                    'Endometriose', 'SOP', 'Menopausa em curso', 'Fogachos / Calores',
                    'Baixa libido', 'Dificuldade para engravidar',
                    'Hipotireoidismo', 'Hipertireoidismo', 'Resistência à insulina',
                ]
            },
            {
                label: 'Condições crônicas diagnosticadas', key: 'chronic_conditions', type: 'checkbox', options: [
                    'Diabetes', 'Hipertensão', 'Colesterol alto', 'Artrite / Artrose',
                    'Fibromialgia', 'Asma', 'Doença celíaca', 'Nenhuma',
                ]
            },
            { label: 'Frequência da dor', key: 'pain_frequency', type: 'scale', scaleLabel: ['Raramente', 'Às vezes', 'Frequente', 'Sempre'], max: 5 },
        ]
    },
    emotional: {
        title: 'Emocional & Sono', icon: '🧠',
        sections: [
            { label: 'Conte como está se sentindo emocionalmente', key: 'emotional_open', type: 'textarea', placeholder: 'Descreva sua situação emocional atual...' },
            {
                label: 'Sintomas emocionais', key: 'emotional_symptoms', type: 'checkbox', options: [
                    'Ansiedade', 'Ataques de pânico', 'Estresse crônico',
                    'Esgotamento emocional (burnout)', 'Depressão', 'Tristeza frequente',
                    'Irritabilidade', 'Dificuldade de concentração', 'Esquecimento',
                    'Confusão mental', 'Baixa autoestima', 'Pensamentos acelerados',
                    'Dificuldade para relaxar', 'Raiva reprimida', 'Sensação de vazio',
                ]
            },
            {
                label: 'Problemas de sono', key: 'sleep_symptoms', type: 'checkbox', options: [
                    'Insônia (dificuldade de adormecer)', 'Acorda no meio da noite',
                    'Sono leve', 'Bruxismo', 'Apneia do sono',
                    'Acorda sem disposição', 'Sonolência durante o dia',
                    'Dependência de remédio para dormir',
                ]
            },
            {
                label: 'Fadiga e baixa energia', key: 'low_energy_symptoms', type: 'checkbox', options: [
                    'Fadiga crônica / cansaço constante', 'Esgotamento após pequenos esforços',
                    'Falta de motivação', 'Procrastinação excessiva', 'Dependência de cafeína',
                ]
            },
            { label: 'Nível de estresse (1=baixo, 10=extremo)', key: 'stress_level', type: 'scale', max: 10 },
            { label: 'Nível de energia (1=exausto, 10=disposto)', key: 'energy_level', type: 'scale', max: 10 },
            { label: 'Horas de sono por noite', key: 'sleep_hours', type: 'radio', options: ['Menos de 5h', '5 a 6h', '6 a 7h', '7 a 8h', 'Mais de 8h'] },
        ]
    },
    body: {
        title: 'Corpo & Hábitos', icon: '✨',
        sections: [
            {
                label: 'Condições de pele', key: 'skin_symptoms', type: 'checkbox', options: [
                    'Acne / Espinhas frequentes', 'Pele oleosa', 'Pele muito seca',
                    'Eczema / Dermatite', 'Psoríase', 'Manchas na pele',
                    'Rugas precoces', 'Flacidez', 'Celulite', 'Pele opaca / sem brilho',
                ]
            },
            {
                label: 'Condições do cabelo', key: 'hair_symptoms', type: 'checkbox', options: [
                    'Queda excessiva', 'Cabelo fraco e quebradiço',
                    'Couro cabeludo oleoso', 'Caspa', 'Cabelo sem brilho', 'Alopecia / Calvície',
                ]
            },
            { label: 'Tipo de pele', key: 'skin_type', type: 'radio', options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível'] },
            { label: 'Atividade física', key: 'exercise_freq', type: 'radio', options: ['Sedentário', '1-2x por semana', '3-4x por semana', 'Todos os dias'] },
            { label: 'Alimentação predominante', key: 'diet_type', type: 'radio', options: ['Saudável', 'Moderada', 'Industrializada', 'Vegetariana / Vegana', 'Low carb'] },
            { label: 'Água por dia', key: 'water_intake', type: 'radio', options: ['Menos de 1L', '1 a 1,5L', '1,5 a 2L', 'Mais de 2L'] },
            { label: 'Consome com frequência', key: 'bad_habits_food', type: 'checkbox', options: ['Álcool', 'Café em excesso', 'Refrigerantes', 'Açúcar refinado', 'Cigarro'] },
        ]
    },
    goals: {
        title: 'Objetivos & Expectativas', icon: '🎯',
        sections: [
            { label: 'Qual é sua maior queixa de saúde HOJE?', key: 'main_complaint', type: 'textarea', placeholder: 'Descreva o principal problema que quer resolver...' },
            {
                label: 'O que busca com óleos essenciais?', key: 'goals', type: 'checkbox', options: [
                    'Reduzir estresse e ansiedade', 'Melhorar o sono', 'Aliviar dores',
                    'Melhorar a digestão', 'Fortalecer a imunidade', 'Equilibrar hormônios',
                    'Emagrecer / metabolismo', 'Melhorar pele e cabelo',
                    'Aumentar energia', 'Desintoxicar o organismo',
                    'Prevenir doenças naturalmente', 'Cuidado emocional profundo',
                    'Apoio à menopausa', 'Saúde para a família',
                ]
            },
            { label: 'Já usou óleos essenciais?', key: 'previous_experience', type: 'radio', options: ['Nunca usei', 'Usei e gostei', 'Usei mas não tive resultado', 'Uso regularmente'] },
            { label: 'Comprometimento com mudança de hábitos', key: 'commitment_level', type: 'scale', max: 5, scaleLabel: ['Baixo', '', 'Médio', '', 'Alto'] },
        ]
    }
};

/* ---- OILS DATABASE ---- */
export const OILS_DATABASE = {
    'Lavanda': { nameEn: 'Lavender', cat: 'single', fn: 'Calmante, relaxante, anti-inflamatório', uses: 'Ansiedade, insônia, queimaduras, irritação na pele', topical: 'Pulsos, nuca, solas dos pés', aromatic: '3-4 gotas no difusor' },
    'Peppermint': { nameEn: 'Peppermint', cat: 'single', fn: 'Estimulante, digestivo, analgésico', uses: 'Dor de cabeça, náusea, fadiga, congestão', topical: 'Têmporas, nuca (diluído 1:3)', aromatic: 'Inalação direta' },
    'Tea Tree': { nameEn: 'Melaleuca', cat: 'single', fn: 'Antisséptico, antifúngico, purificante', uses: 'Acne, infecções, caspa, feridas', topical: 'Aplicar diluído nas áreas afetadas', aromatic: 'Difusor para purificação do ar' },
    'Lemon': { nameEn: 'Lemon', cat: 'single', fn: 'Detox, energizante, purificante', uses: 'Detox hepático, limpeza, energia matinal', topical: 'Evitar exposição solar após uso tópico', aromatic: '2-3 gotas no difusor ou em água' },
    'Frankincense': { nameEn: 'Frankincense', cat: 'single', fn: 'Regeneração celular, suporte neuroimune', uses: 'Anti-aging, meditação, inflamação, imunidade', topical: 'Topo da cabeça, peito, solas dos pés', aromatic: 'Difusor para meditação' },
    'Wild Orange': { nameEn: 'Wild Orange', cat: 'single', fn: 'Elevação do humor, energizante', uses: 'Depressão, ansiedade, falta de motivação', topical: 'Pulsos, difusor, em água', aromatic: '3 gotas no difusor' },
    'Copaiba': { nameEn: 'Copaiba', cat: 'single', fn: 'Anti-inflamatório sistêmico, modulação imunológica', uses: 'Dores, inflamação, ansiedade, suporte imunológico', topical: 'Sublingual (1 gota) ou tópico diluído', aromatic: 'Difusor para calma' },
    'Eucalyptus': { nameEn: 'Eucalyptus', cat: 'single', fn: 'Descongestionante, expectorante', uses: 'Sinusite, rinite, gripes, congestão', topical: 'Peito e costas (diluído)', aromatic: 'Difusor ou inalação com vapor' },
    'Rosemary': { nameEn: 'Rosemary', cat: 'single', fn: 'Estimulante capilar, circulação', uses: 'Queda de cabelo, concentração, memória', topical: 'Couro cabeludo (diluído), uso controlado', aromatic: 'Difusor para foco' },
    'Oregano': { nameEn: 'Oregano', cat: 'single', fn: 'Antibacteriano potente, imunidade', uses: 'Infecções, imunidade baixa, parasitas', topical: 'Sempre diluído 1:4, solas dos pés', aromatic: 'Curto prazo no difusor' },
    'Clary Sage': { nameEn: 'Clary Sage', cat: 'single', fn: 'Equilíbrio hormonal feminino', uses: 'TPM, cólicas, menopausa, regulação hormonal', topical: 'Abdômen inferior, pulsos', aromatic: 'Difusor noturno' },
    'Ylang Ylang': { nameEn: 'Ylang Ylang', cat: 'single', fn: 'Relaxante, afrodisíaco natural', uses: 'Baixa libido, ansiedade, hipertensão', topical: 'Pescoço, pulsos', aromatic: 'Difusor para ambiente sensorial' },
    'Bergamota': { nameEn: 'Bergamot', cat: 'single', fn: 'Antidepressivo, equilibrante emocional', uses: 'Depressão, ansiedade, autoestima', topical: 'Pulsos, plexo solar (fotossensível)', aromatic: '3 gotas no difusor' },
    'Cedarwood': { nameEn: 'Cedarwood', cat: 'single', fn: 'Calmante, suporte capilar', uses: 'Queda de cabelo, insônia, concentração', topical: 'Couro cabeludo, solas dos pés', aromatic: 'Difusor noturno' },
    'Vetiver': { nameEn: 'Vetiver', cat: 'single', fn: 'Ancoragem emocional, foco', uses: 'TDAH, ansiedade, insônia, aterramento', topical: 'Solas dos pés, nuca, pulsos', aromatic: 'Difusor (combina com Lavanda)' },
    'Ginger': { nameEn: 'Ginger', cat: 'single', fn: 'Digestivo, aquecimento, anti-náusea', uses: 'Náuseas, digestão lenta, dores musculares', topical: 'Abdômen (diluído)', aromatic: 'Inalação para náusea' },
    'Fennel': { nameEn: 'Fennel', cat: 'single', fn: 'Digestivo, hormonal', uses: 'Gases, inchaço abdominal, metabolismo', topical: 'Abdômen (diluído em circular)', aromatic: 'Difusor' },
    'Geranium': { nameEn: 'Geranium', cat: 'single', fn: 'Equilíbrio hormonal, rejuvenescedor', uses: 'Pele, equilíbrio emocional, cicatrização', topical: 'Rosto (diluído), pulsos', aromatic: 'Difusor' },
    'Helichrysum': { nameEn: 'Helichrysum', cat: 'single', fn: 'Regenerador celular, cicatrizante', uses: 'Cicatrizes, manchas, anti-aging, hematomas', topical: 'Aplicar diluído na área afetada', aromatic: 'Difusor' },
    'Myrrh': { nameEn: 'Myrrh', cat: 'single', fn: 'Antisséptico, anti-aging', uses: 'Pele madura, gengivas, meditação', topical: 'Rosto, gengivas (diluído)', aromatic: 'Difusor para meditação' },
    'Patchouli': { nameEn: 'Patchouli', cat: 'single', fn: 'Aterramento, anti-inflamatório cutâneo', uses: 'Dermatite, ansiedade, menopausa', topical: 'Pele (diluído), pulsos', aromatic: 'Difusor' },
    'Roman Chamomile': { nameEn: 'Roman Chamomile', cat: 'single', fn: 'Calmante suave, anti-alérgico', uses: 'Insônia, irritação na pele, cólicas infantis', topical: 'Solas dos pés, abdômen', aromatic: 'Difusor noturno' },
    'Sandalwood': { nameEn: 'Sandalwood', cat: 'single', fn: 'Meditativo, hidratante', uses: 'Meditação, pele seca, foco', topical: 'Rosto, peito, solas dos pés', aromatic: 'Difusor' },
    'Thyme': { nameEn: 'Thyme', cat: 'single', fn: 'Antimicrobiano, estimulante imunológico', uses: 'Imunidade, infecções, queda de cabelo', topical: 'Sempre muito diluído, solas dos pés', aromatic: 'Curto prazo' },
    'Wintergreen': { nameEn: 'Wintergreen', cat: 'single', fn: 'Analgésico tópico', uses: 'Dores musculares, articulações', topical: 'Áreas doloridas (diluído)', aromatic: 'Não recomendado' },
    'Black Pepper': { nameEn: 'Black Pepper', cat: 'single', fn: 'Circulação, aquecimento', uses: 'Dores musculares, digestão, vícios', topical: 'Diluído nas áreas afetadas', aromatic: 'Difusor (combina com cítricos)' },
    'Cardamom': { nameEn: 'Cardamom', cat: 'single', fn: 'Digestivo suave', uses: 'Indigestão, gases, respiração', topical: 'Abdômen (diluído)', aromatic: 'Inalação' },
    'Cypress': { nameEn: 'Cypress', cat: 'single', fn: 'Circulação, drenagem', uses: 'Varizes, inchaço, retenção de líquidos', topical: 'Pernas (diluído, massagem ascendente)', aromatic: 'Difusor' },
    'Juniper Berry': { nameEn: 'Juniper Berry', cat: 'single', fn: 'Detox, drenagem linfática', uses: 'Desintoxicação, pele oleosa, celulite', topical: 'Massagem (diluído)', aromatic: 'Difusor' },
    'Marjoram': { nameEn: 'Marjoram', cat: 'single', fn: 'Relaxante muscular', uses: 'Tensão muscular, cólicas, hipertensão', topical: 'Músculos tensionados (diluído)', aromatic: 'Difusor noturno' },
    'Lemongrass': { nameEn: 'Lemongrass', cat: 'single', fn: 'Anti-inflamatório, digestivo', uses: 'Dores articulares, digestão, repelente', topical: 'Articulações (diluído)', aromatic: 'Difusor (repelente natural)' },
    'DigestZen': { nameEn: 'DigestZen', cat: 'blend', fn: 'Suporte digestivo completo', uses: 'Gases, inchaço, azia, náuseas, intestino irritável', topical: 'Massagem abdominal circular (diluído)', aromatic: 'Inalação para náusea' },
    'Balance': { nameEn: 'Balance', cat: 'blend', fn: 'Estabilização emocional, aterramento', uses: 'Ansiedade, estresse, desequilíbrio emocional', topical: 'Solas dos pés, pulsos, nuca', aromatic: 'Difusor' },
    'Serenity': { nameEn: 'Serenity', cat: 'blend', fn: 'Sono e relaxamento profundo', uses: 'Insônia, agitação, ansiedade noturna', topical: 'Solas dos pés, peito, travesseiro', aromatic: 'Difusor no quarto (30min antes)' },
    'Deep Blue': { nameEn: 'Deep Blue', cat: 'blend', fn: 'Alívio de dores musculares e articulares', uses: 'Dores musculares, artrite, fibromialgia, lesões', topical: 'Áreas doloridas (massagem)', aromatic: 'Não recomendado' },
    'On Guard': { nameEn: 'On Guard', cat: 'blend', fn: 'Proteção imunológica', uses: 'Prevenção de gripes, imunidade baixa, limpeza', topical: 'Solas dos pés, difusor, cápsula', aromatic: 'Difusor para proteção' },
    'Breathe': { nameEn: 'Breathe', cat: 'blend', fn: 'Suporte respiratório', uses: 'Congestão, sinusite, rinite, asma', topical: 'Peito, costas, sob o nariz', aromatic: 'Difusor ou inalação' },
    'ClaryCalm': { nameEn: 'ClaryCalm', cat: 'blend', fn: 'Equilíbrio hormonal feminino', uses: 'TPM, cólicas, menopausa, fogachos', topical: 'Abdômen inferior, solas dos pés, pulsos', aromatic: 'Não é a principal via' },
    'Elevation': { nameEn: 'Elevation', cat: 'blend', fn: 'Elevação do humor', uses: 'Depressão, tristeza, falta de motivação', topical: 'Peito, pulsos, nuca', aromatic: 'Difusor matinal' },
    'PastTense': { nameEn: 'PastTense', cat: 'blend', fn: 'Alívio de tensão e dor de cabeça', uses: 'Enxaqueca, cefaleia tensional, tensão no pescoço', topical: 'Têmporas, testa, nuca (roll-on)', aromatic: 'Inalação direta' },
    'Adaptiv': { nameEn: 'Adaptiv', cat: 'blend', fn: 'Adaptação ao estresse', uses: 'Estresse, ansiedade situacional, burnout', topical: 'Pulsos, nuca, peito', aromatic: 'Difusor' },
    'InTune': { nameEn: 'InTune', cat: 'blend', fn: 'Foco e concentração', uses: 'TDAH, falta de foco, confusão mental', topical: 'Nuca, pulsos, solas dos pés', aromatic: 'Inalação direta' },
    'Zendocrine': { nameEn: 'Zendocrine', cat: 'blend', fn: 'Desintoxicação e suporte hepático', uses: 'Detox, fígado sobrecarregado, pele com toxinas', topical: 'Abdômen, solas dos pés', aromatic: 'Difusor' },
    'Whisper': { nameEn: 'Whisper', cat: 'blend', fn: 'Blend feminino sensorial', uses: 'Autoestima, libido, reconexão corporal', topical: 'Pescoço, atrás das orelhas, pulsos', aromatic: 'Difusor' },
    'Motive': { nameEn: 'Motivate', cat: 'blend', fn: 'Motivação e coragem', uses: 'Procrastinação, falta de motivação, baixa energia', topical: 'Peito, pulsos', aromatic: 'Difusor matinal' },
};

/* ---- PROFESSIONAL PROTOCOLS ---- */
export const PROTOCOLS = {
    'Ansiedade': {
        focus: 'Eixo Emocional', icon: '🧘',
        therapeuticObjective: 'Modular resposta ao estresse, reduzir ativação simpática e promover equilíbrio do sistema nervoso autônomo.',
        oils: [
            { name: 'Lavanda', fn: 'Redução do estresse e equilíbrio do sistema nervoso' },
            { name: 'Vetiver', fn: 'Ancoragem emocional e foco' },
            { name: 'Balance', fn: 'Estabilização emocional e redução de cortisol' },
            { name: 'Copaiba', fn: 'Modulação inflamatória e suporte neuroimune' },
        ],
        routine: {
            morning: ['1 gota de Wild Orange em água', 'Balance na planta dos pés'],
            afternoon: ['Lavanda nos pulsos (se necessário)', 'Copaiba sublingual'],
            night: ['Serenity no difusor', 'Lavanda na nuca', 'Vetiver nas solas dos pés'],
        },
        expectedResults: 'Redução progressiva da ansiedade, melhora da qualidade do sono, maior estabilidade emocional e sensação de calma ao longo do dia.',
        affirmation: 'Você merece paz. Seu sistema nervoso pode aprender a se regular.',
    },
    'Ataques de pânico': {
        focus: 'Eixo Emocional', icon: '🌊',
        therapeuticObjective: 'Oferecer suporte imediato em crises e prevenção contínua com ancoragem emocional.',
        oils: [
            { name: 'Balance', fn: 'Aterramento e estabilização emocional' },
            { name: 'Vetiver', fn: 'Ancoragem profunda' },
            { name: 'Lavanda', fn: 'Calma imediata' },
            { name: 'Frankincense', fn: 'Suporte neuroimune e meditativo' },
        ],
        routine: {
            morning: ['Balance na planta dos pés', 'Frankincense no topo da cabeça'],
            afternoon: ['Aromaterapia palmitar com Lavanda em momentos de crise'],
            night: ['Vetiver nas solas dos pés', 'Serenity no difusor'],
        },
        expectedResults: 'Redução na frequência e intensidade das crises, maior sensação de controle e segurança emocional.',
        affirmation: 'Sua mente pode descansar. Você está seguro agora.',
    },
    'Estresse crônico': {
        focus: 'Eixo Adrenal', icon: '💆',
        therapeuticObjective: 'Restaurar eixo HPA (hipotálamo-hipófise-adrenal), reduzir cortisol e promover adaptação ao estresse.',
        oils: [
            { name: 'Adaptiv', fn: 'Adaptação ao estresse e equilíbrio emocional' },
            { name: 'Balance', fn: 'Estabilização do sistema nervoso' },
            { name: 'Lavanda', fn: 'Redução do cortisol' },
            { name: 'Wild Orange', fn: 'Elevação do humor' },
            { name: 'Frankincense', fn: 'Suporte neuroimune profundo' },
        ],
        routine: {
            morning: ['Adaptiv nos pulsos e nuca', 'Wild Orange em água'],
            afternoon: ['Balance na planta dos pés', 'Pausa de aromaterapia 5min'],
            night: ['Lavanda no difusor', 'Frankincense sublingual', 'Banho com 5 gotas de Lavanda'],
        },
        expectedResults: 'Diminuição da tensão muscular, melhora do humor, regulação do sono e maior resiliência frente ao estresse.',
        affirmation: 'Você é capaz de atravessar isso. Seu corpo sabe se restaurar.',
    },
    'Esgotamento emocional (burnout)': {
        focus: 'Eixo Adrenal', icon: '🔋',
        therapeuticObjective: 'Restauração energética profunda, suporte adrenal e recuperação emocional.',
        oils: [
            { name: 'Frankincense', fn: 'Regeneração celular e suporte neuroimune' },
            { name: 'Copaiba', fn: 'Anti-inflamatório sistêmico' },
            { name: 'Balance', fn: 'Aterramento e estabilização' },
            { name: 'Sandalwood', fn: 'Meditação e calma profunda' },
        ],
        routine: {
            morning: ['Motive no peito e pulsos', 'Frankincense sublingual'],
            afternoon: ['Copaiba sublingual', 'Balance nos pés'],
            night: ['Sandalwood no difusor', 'Massagem nas costas com Lavanda diluída'],
        },
        expectedResults: 'Recuperação gradual da energia vital, melhora na motivação e reconexão com propósito.',
        affirmation: 'Você fez muito. Agora é hora de receber. Permita-se ser restaurado.',
    },
    'Depressão': {
        focus: 'Eixo Emocional', icon: '🌻',
        therapeuticObjective: 'Elevação do humor, suporte à produção de serotonina e reconexão com vitalidade.',
        oils: [
            { name: 'Wild Orange', fn: 'Elevação do humor e energia' },
            { name: 'Elevation', fn: 'Blend de alegria e motivação' },
            { name: 'Bergamota', fn: 'Antidepressivo natural' },
            { name: 'Frankincense', fn: 'Suporte neuroimune' },
        ],
        routine: {
            morning: ['Wild Orange + Elevation no difusor', 'Bergamota nos pulsos'],
            afternoon: ['Frankincense na nuca', 'Aromaterapia palmitar com Wild Orange'],
            night: ['Lavanda no difusor', 'Copaiba sublingual'],
        },
        expectedResults: 'Melhora progressiva do humor, maior disposição, reconexão com atividades prazerosas.',
        affirmation: 'A luz existe dentro de você. Este protocolo abre o caminho para ela emergir.',
    },
    'Tristeza frequente': {
        focus: 'Eixo Emocional', icon: '💛',
        therapeuticObjective: 'Suporte emocional para elevação do humor e processamento emocional.',
        oils: [
            { name: 'Elevation', fn: 'Elevação do humor' },
            { name: 'Wild Orange', fn: 'Alegria e energia' },
            { name: 'Bergamota', fn: 'Equilíbrio emocional' },
        ],
        routine: {
            morning: ['Elevation no peito e pulsos', 'Wild Orange no difusor'],
            afternoon: ['Bergamota nos pulsos'],
            night: ['Lavanda no difusor'],
        },
        expectedResults: 'Maior leveza emocional, disposição e reconexão com momentos de alegria.',
        affirmation: 'Você merece dias mais leves. A alegria está a caminho.',
    },
    'Insônia (dificuldade de adormecer)': {
        focus: 'Eixo Sono', icon: '🌙',
        therapeuticObjective: 'Preparar corpo e mente para sono profundo, regular ritmo circadiano.',
        oils: [
            { name: 'Serenity', fn: 'Relaxamento e indução do sono' },
            { name: 'Lavanda', fn: 'Calma e redução do cortisol noturno' },
            { name: 'Vetiver', fn: 'Ancoragem e profundidade do sono' },
            { name: 'Roman Chamomile', fn: 'Calmante suave' },
        ],
        routine: {
            morning: ['Wild Orange para regular ciclo circadiano'],
            afternoon: ['Evitar cafeína após 14h'],
            night: ['Serenity no difusor 30min antes', 'Lavanda nas solas dos pés', 'Vetiver na nuca'],
        },
        expectedResults: 'Adormecer mais rápido, sono mais profundo e contínuo, despertar com mais disposição.',
        affirmation: 'O repouso é sagrado. Você pode soltar o dia e descansar.',
    },
    'Acorda no meio da noite': {
        focus: 'Eixo Sono', icon: '🌙',
        therapeuticObjective: 'Manutenção do sono profundo e regulação do sistema nervoso noturno.',
        oils: [
            { name: 'Vetiver', fn: 'Profundidade e manutenção do sono' },
            { name: 'Serenity', fn: 'Relaxamento contínuo' },
            { name: 'Copaiba', fn: 'Anti-inflamatório e modulação nervosa' },
        ],
        routine: {
            morning: ['Balance nos pés ao acordar'],
            afternoon: [],
            night: ['Vetiver nas solas dos pés', 'Serenity no difusor', 'Copaiba sublingual antes de deitar'],
        },
        expectedResults: 'Menos despertares noturnos, sono mais contínuo e reparador.',
        affirmation: 'Seu corpo pode descansar a noite toda.',
    },
    'Dores de cabeça frequentes': {
        focus: 'Eixo Dor', icon: '🤕',
        therapeuticObjective: 'Alívio de cefaleias tensionais e prevenção de episódios recorrentes.',
        oils: [
            { name: 'Peppermint', fn: 'Analgésico e refrescante' },
            { name: 'PastTense', fn: 'Blend específico para tensão' },
            { name: 'Lavanda', fn: 'Relaxante e anti-inflamatório' },
            { name: 'Copaiba', fn: 'Modulação da dor' },
        ],
        routine: {
            morning: ['Peppermint na nuca (preventivo)'],
            afternoon: ['PastTense nas têmporas ao primeiro sinal de dor'],
            night: ['Lavanda no difusor', 'Copaiba sublingual'],
        },
        expectedResults: 'Redução na frequência e intensidade das dores de cabeça, menos dependência de analgésicos.',
        affirmation: 'Seu corpo busca equilíbrio. Esta tensão pode ser liberada.',
    },
    'Enxaqueca': {
        focus: 'Eixo Dor', icon: '⚡',
        therapeuticObjective: 'Prevenção de crises e alívio imediato durante episódios.',
        oils: [
            { name: 'PastTense', fn: 'Alívio específico de enxaqueca' },
            { name: 'Peppermint', fn: 'Vasoconstricção e analgesia' },
            { name: 'Lavanda', fn: 'Relaxamento e anti-inflamatório' },
            { name: 'Copaiba', fn: 'Modulação da dor sistêmica' },
        ],
        routine: {
            morning: ['Copaiba sublingual (preventivo)'],
            afternoon: ['Ao primeiro sinal: PastTense nas têmporas + Peppermint inalado'],
            night: ['Lavanda no difusor', 'Ambiente escuro e silencioso'],
        },
        expectedResults: 'Menor frequência de crises, alívio mais rápido durante episódios.',
        affirmation: 'Sua dor merece cuidado. Suporte natural faz a diferença.',
    },
    'Dores musculares': {
        focus: 'Eixo Musculoesquelético', icon: '💪',
        therapeuticObjective: 'Alívio da dor muscular, redução da inflamação e recuperação.',
        oils: [
            { name: 'Deep Blue', fn: 'Alívio de dores musculares e articulares' },
            { name: 'Copaiba', fn: 'Anti-inflamatório sistêmico' },
            { name: 'Marjoram', fn: 'Relaxante muscular' },
            { name: 'Wintergreen', fn: 'Analgésico tópico' },
        ],
        routine: {
            morning: ['Deep Blue nas áreas doloridas (diluído)'],
            afternoon: ['Copaiba sublingual'],
            night: ['Marjoram na região afetada', 'Banho quente com Lavanda'],
        },
        expectedResults: 'Alívio da tensão muscular, menos dor e maior mobilidade.',
        affirmation: 'Seu corpo pode relaxar e se recuperar.',
    },
    'Dores nas articulações': {
        focus: 'Eixo Musculoesquelético', icon: '🦴',
        therapeuticObjective: 'Redução da inflamação articular e suporte à mobilidade.',
        oils: [
            { name: 'Deep Blue', fn: 'Alívio localizado de dor articular' },
            { name: 'Copaiba', fn: 'Anti-inflamatório potente' },
            { name: 'Frankincense', fn: 'Regeneração e suporte imunológico' },
            { name: 'Lemongrass', fn: 'Anti-inflamatório articular' },
        ],
        routine: {
            morning: ['Deep Blue na articulação afetada', 'Copaiba sublingual'],
            afternoon: ['Lemongrass diluído na região'],
            night: ['Frankincense sublingual', 'Compressa quente com Lavanda'],
        },
        expectedResults: 'Redução do inchaço e dor articular, maior amplitude de movimento.',
        affirmation: 'Cada dia seu corpo se fortalece um pouco mais.',
    },
    'Refluxo / Azia': {
        focus: 'Eixo Digestivo', icon: '🌿',
        therapeuticObjective: 'Redução da inflamação gástrica e suporte à motilidade digestiva.',
        oils: [
            { name: 'DigestZen', fn: 'Suporte digestivo completo' },
            { name: 'Ginger', fn: 'Anti-náusea e digestivo' },
            { name: 'Peppermint', fn: 'Alívio gástrico' },
        ],
        routine: {
            morning: ['1 gota de Lemon em água (detox suave)'],
            afternoon: ['DigestZen no abdômen após refeição (diluído)'],
            night: ['Ginger em cápsula ou chá'],
        },
        expectedResults: 'Redução do refluxo e azia, melhora na digestão e conforto gástrico.',
        affirmation: 'Seu sistema digestivo pode encontrar equilíbrio.',
    },
    'Inchaço abdominal': {
        focus: 'Eixo Digestivo', icon: '🫁',
        therapeuticObjective: 'Alívio do desconforto abdominal e reequilíbrio da flora intestinal.',
        oils: [
            { name: 'DigestZen', fn: 'Suporte digestivo e alívio de gases' },
            { name: 'Fennel', fn: 'Redução de gases e inchaço' },
            { name: 'Ginger', fn: 'Motilidade gástrica' },
        ],
        routine: {
            morning: ['Lemon em água morna'],
            afternoon: ['DigestZen massagem abdominal circular após almoço'],
            night: ['Fennel no abdômen (diluído)'],
        },
        expectedResults: 'Redução do inchaço, melhor evacuação e conforto abdominal.',
        affirmation: 'Seu abdômen pode relaxar e encontrar seu ritmo natural.',
    },
    'Gastrite': {
        focus: 'Eixo Digestivo', icon: '🌿',
        therapeuticObjective: 'Redução da inflamação gástrica e proteção da mucosa.',
        oils: [
            { name: 'DigestZen', fn: 'Suporte digestivo' },
            { name: 'Copaiba', fn: 'Anti-inflamatório da mucosa' },
            { name: 'Frankincense', fn: 'Regeneração celular' },
        ],
        routine: {
            morning: ['Copaiba sublingual em jejum'],
            afternoon: ['DigestZen no abdômen após refeições'],
            night: ['Frankincense sublingual'],
        },
        expectedResults: 'Redução da inflamação gástrica e alívio dos sintomas.',
        affirmation: 'Seu estômago merece cuidado e atenção.',
    },
    'Constipação': {
        focus: 'Eixo Digestivo', icon: '🌿',
        therapeuticObjective: 'Estimular motilidade intestinal de forma natural.',
        oils: [
            { name: 'DigestZen', fn: 'Ativação da motilidade' },
            { name: 'Ginger', fn: 'Aquecimento e estimulação digestiva' },
            { name: 'Lemon', fn: 'Detox e estimulação intestinal' },
        ],
        routine: {
            morning: ['1 gota de Lemon em água morna ao acordar', 'DigestZen no abdômen'],
            afternoon: ['Ginger após almoço (diluído no abdômen)'],
            night: ['Massagem abdominal circular com DigestZen'],
        },
        expectedResults: 'Regularização do trânsito intestinal e maior conforto.',
        affirmation: 'Seu intestino pode funcionar naturalmente.',
    },
    'Acne / Espinhas frequentes': {
        focus: 'Eixo Pele', icon: '🌱',
        therapeuticObjective: 'Equilíbrio da microbiota cutânea e controle da inflamação.',
        oils: [
            { name: 'Tea Tree', fn: 'Antisséptico e antibacteriano' },
            { name: 'Lavanda', fn: 'Anti-inflamatório e cicatrizante' },
            { name: 'Copaiba', fn: 'Modulação inflamatória' },
        ],
        routine: {
            morning: ['Tea Tree ponto a ponto nas áreas afetadas'],
            afternoon: ['Manter pele limpa e hidratada'],
            night: ['Lavanda + Copaiba diluídos em gel base neutro'],
        },
        expectedResults: 'Redução das espinhas e inflamação, pele mais equilibrada.',
        affirmation: 'Sua pele reflete equilíbrio interno. Cuidar de dentro transforma o fora.',
    },
    'Queda de cabelo': {
        focus: 'Eixo Capilar', icon: '💆',
        therapeuticObjective: 'Estimulação circulatória do couro cabeludo e nutrição folicular.',
        oils: [
            { name: 'Cedarwood', fn: 'Estimulação capilar e equilíbrio do couro' },
            { name: 'Rosemary', fn: 'Estimulação da microcirculação capilar' },
            { name: 'Lavanda', fn: 'Anti-inflamatório e calmante' },
            { name: 'Frankincense', fn: 'Regeneração celular' },
        ],
        routine: {
            morning: [],
            afternoon: [],
            night: ['Frankincense no peito ou topo da cabeça', 'Lavanda na nuca'],
        },
        specificProtocol: {
            title: 'PROTOCOLO CAPILAR (3x por semana)',
            instructions: [
                'Base: 10ml óleo vegetal carreador',
                '3 gotas Cedarwood', '2 gotas Rosemary', '2 gotas Lavanda', '1 gota Frankincense',
                'Massagem no couro cabeludo por 5min', 'Deixar agir 30min antes de lavar',
            ],
        },
        expectedResults: 'Redução da queda, fios mais fortes e couro cabeludo saudável.',
        affirmation: 'Seus fios podem crescer fortes e saudáveis.',
    },
    'Queda excessiva': {
        focus: 'Eixo Capilar', icon: '💆',
        therapeuticObjective: 'Estimulação circulatória do couro cabeludo e nutrição folicular.',
        oils: [
            { name: 'Cedarwood', fn: 'Estimulação capilar' },
            { name: 'Rosemary', fn: 'Microcirculação capilar' },
            { name: 'Lavanda', fn: 'Anti-inflamatório' },
            { name: 'Frankincense', fn: 'Regeneração celular' },
        ],
        routine: {
            morning: [],
            afternoon: [],
            night: ['Frankincense no topo da cabeça', 'Lavanda na nuca'],
        },
        specificProtocol: {
            title: 'PROTOCOLO CAPILAR (3x por semana)',
            instructions: [
                'Base: 10ml óleo vegetal carreador',
                '3 gotas Cedarwood', '2 gotas Rosemary', '2 gotas Lavanda', '1 gota Frankincense',
                'Massagem no couro cabeludo por 5min', 'Deixar agir 30min antes de lavar',
            ],
        },
        expectedResults: 'Redução da queda, fortalecimento dos fios.',
        affirmation: 'Seus fios podem crescer fortes e saudáveis.',
    },
    'Cólicas menstruais intensas': {
        focus: 'Eixo Hormonal', icon: '🌸',
        therapeuticObjective: 'Alívio das cólicas e equilíbrio hormonal feminino.',
        oils: [
            { name: 'ClaryCalm', fn: 'Equilíbrio hormonal feminino' },
            { name: 'Lavanda', fn: 'Relaxante e antiespasmódico' },
            { name: 'Copaiba', fn: 'Anti-inflamatório' },
            { name: 'Clary Sage', fn: 'Regulação hormonal' },
        ],
        routine: {
            morning: ['ClaryCalm nos pulsos'],
            afternoon: ['Lavanda nos pulsos se necessário'],
            night: ['Copaiba sublingual', 'ClaryCalm no abdômen inferior (diluído)'],
        },
        expectedResults: 'Alívio das cólicas, ciclo mais confortável.',
        affirmation: 'Seu ciclo é sagrado. Seu corpo merece conforto.',
    },
    'Menopausa em curso': {
        focus: 'Eixo Hormonal', icon: '🦋',
        therapeuticObjective: 'Suporte hormonal natural para amenizar os sintomas da transição.',
        oils: [
            { name: 'ClaryCalm', fn: 'Equilíbrio hormonal' },
            { name: 'Copaiba', fn: 'Anti-inflamatório sistêmico' },
            { name: 'Patchouli', fn: 'Aterramento e equilíbrio' },
            { name: 'Clary Sage', fn: 'Regulação estrogênica natural' },
        ],
        routine: {
            morning: ['ClaryCalm nos pulsos e nuca'],
            afternoon: ['Patchouli nos pulsos'],
            night: ['Copaiba sublingual', 'Clary Sage no difusor', 'ClaryCalm no interno das coxas'],
        },
        expectedResults: 'Redução dos fogachos, melhora do humor e sono mais tranquilo.',
        affirmation: 'Esta transição é uma nova fase de florescimento.',
    },
    'Baixa libido': {
        focus: 'Eixo Hormonal', icon: '🌹',
        therapeuticObjective: 'Equilíbrio hormonal e reconexão emocional com o corpo.',
        oils: [
            { name: 'Whisper', fn: 'Blend feminino sensorial' },
            { name: 'Ylang Ylang', fn: 'Afrodisíaco natural e relaxante' },
            { name: 'ClaryCalm', fn: 'Equilíbrio hormonal' },
            { name: 'Sandalwood', fn: 'Conexão e meditação' },
        ],
        routine: {
            morning: ['ClaryCalm nos pulsos'],
            afternoon: [],
            night: ['Whisper no pescoço e pulsos', 'Ylang Ylang no difusor', 'Banho sensorial'],
        },
        expectedResults: 'Maior conexão com o corpo, despertar do desejo e equilíbrio hormonal.',
        affirmation: 'Seu corpo é um santuário de prazer. Reconecte-se.',
    },
    'Fadiga crônica / cansaço constante': {
        focus: 'Eixo Energético', icon: '⚡',
        therapeuticObjective: 'Suporte mitocondrial e adrenal para restauração da energia vital.',
        oils: [
            { name: 'Wild Orange', fn: 'Estimulante natural e elevação do humor' },
            { name: 'Peppermint', fn: 'Clareza mental e energia' },
            { name: 'Motive', fn: 'Motivação e disposição' },
            { name: 'Frankincense', fn: 'Suporte celular profundo' },
        ],
        routine: {
            morning: ['Wild Orange + Peppermint no difusor', 'Motive no peito e pulsos'],
            afternoon: ['Peppermint inalado para energia'],
            night: ['Frankincense sublingual', 'Descanso adequado'],
        },
        expectedResults: 'Mais energia e disposição ao longo do dia, menos dependência de estimulantes.',
        affirmation: 'Energia é seu estado natural. Vamos restaurar esse equilíbrio.',
    },
    'Sinusite / Rinite': {
        focus: 'Eixo Respiratório', icon: '🌬️',
        therapeuticObjective: 'Descongestionamento, suporte imunológico e alívio respiratório.',
        oils: [
            { name: 'Breathe', fn: 'Suporte respiratório completo' },
            { name: 'Eucalyptus', fn: 'Descongestionante e expectorante' },
            { name: 'Peppermint', fn: 'Abertura das vias aéreas' },
            { name: 'On Guard', fn: 'Proteção imunológica' },
        ],
        routine: {
            morning: ['Breathe no peito e costas', 'On Guard nas solas dos pés'],
            afternoon: ['Eucalyptus inalação com vapor (tigela com água quente)'],
            night: ['Breathe no difusor', 'Peppermint sob o nariz'],
        },
        expectedResults: 'Melhora respiratória, menos congestão e crises alérgicas.',
        affirmation: 'Cada respiração traz mais saúde e equilíbrio.',
    },
    'Alergias frequentes': {
        focus: 'Eixo Imunológico', icon: '🛡️',
        therapeuticObjective: 'Modulação da resposta imunológica e redução da reatividade alérgica.',
        oils: [
            { name: 'Lavanda', fn: 'Anti-histamínico natural' },
            { name: 'Lemon', fn: 'Purificante e anti-alérgico' },
            { name: 'Peppermint', fn: 'Descongestionante' },
        ],
        routine: {
            morning: ['TriEase: 1 gota de cada (Lavanda+Lemon+Peppermint) em cápsula'],
            afternoon: ['Repetir se necessário'],
            night: ['Lavanda no difusor'],
        },
        expectedResults: 'Redução das crises alérgicas, menos coriza e espirros.',
        affirmation: 'Seu sistema imunológico pode aprender a se equilibrar.',
    },
    'Gripes frequentes': {
        focus: 'Eixo Imunológico', icon: '🛡️',
        therapeuticObjective: 'Fortalecimento do sistema imunológico e proteção contra patógenos.',
        oils: [
            { name: 'On Guard', fn: 'Proteção imunológica potente' },
            { name: 'Oregano', fn: 'Antibacteriano e antiviral' },
            { name: 'Frankincense', fn: 'Suporte imunológico profundo' },
        ],
        routine: {
            morning: ['On Guard nas solas dos pés diariamente'],
            afternoon: ['Oregano em cápsula (ciclos de 10 dias)'],
            night: ['Frankincense sublingual', 'On Guard no difusor'],
        },
        expectedResults: 'Menos episódios de gripes e resfriados, recuperação mais rápida.',
        affirmation: 'Seu corpo tem a capacidade natural de se defender.',
    },
    'Dor nas costas': {
        focus: 'Eixo Musculoesquelético', icon: '🦴',
        therapeuticObjective: 'Alívio da dor, relaxamento muscular e redução da inflamação.',
        oils: [
            { name: 'Deep Blue', fn: 'Alívio localizado da dor' },
            { name: 'Copaiba', fn: 'Anti-inflamatório sistêmico' },
            { name: 'Marjoram', fn: 'Relaxante muscular' },
        ],
        routine: {
            morning: ['Deep Blue na região lombar ou cervical (diluído)'],
            afternoon: ['Copaiba sublingual'],
            night: ['Marjoram na região afetada', 'Banho quente com Lavanda'],
        },
        expectedResults: 'Redução da dor e tensão, maior mobilidade e conforto.',
        affirmation: 'Seu corpo pode relaxar e liberar a tensão acumulada.',
    },
    'Pele oleosa': {
        focus: 'Eixo Pele', icon: '✨',
        therapeuticObjective: 'Regulação da produção de sebo e equilíbrio da microbiota cutânea.',
        oils: [
            { name: 'Tea Tree', fn: 'Controle da oleosidade e antisséptico' },
            { name: 'Geranium', fn: 'Equilíbrio da produção de sebo' },
            { name: 'Lavanda', fn: 'Anti-inflamatório suave' },
        ],
        routine: {
            morning: ['Geranium diluído em gel hidratante facial'],
            afternoon: [],
            night: ['Tea Tree + Lavanda em gel base neutro'],
        },
        expectedResults: 'Pele mais equilibrada, menos brilho e oleosidade.',
        affirmation: 'Sua pele encontra equilíbrio quando cuidada com carinho.',
    },
    'Manchas na pele': {
        focus: 'Eixo Pele', icon: '✨',
        therapeuticObjective: 'Clareamento e regeneração celular da pele.',
        oils: [
            { name: 'Frankincense', fn: 'Regeneração celular profunda' },
            { name: 'Helichrysum', fn: 'Clareamento e cicatrização' },
            { name: 'Lavanda', fn: 'Anti-inflamatório e regenerador' },
        ],
        routine: {
            morning: ['Usar protetor solar (essencial!)'],
            afternoon: [],
            night: ['Frankincense + Helichrysum diluídos em óleo de rosa mosqueta nas manchas'],
        },
        expectedResults: 'Clareamento gradual das manchas e pele mais uniforme.',
        affirmation: 'Sua pele se renova a cada dia.',
    },
    'TPM intensa': {
        focus: 'Eixo Hormonal', icon: '🌸',
        therapeuticObjective: 'Equilíbrio hormonal e alívio dos sintomas pré-menstruais.',
        oils: [
            { name: 'ClaryCalm', fn: 'Equilíbrio hormonal feminino' },
            { name: 'Geranium', fn: 'Estabilização emocional' },
            { name: 'Lavanda', fn: 'Calma e relaxamento' },
        ],
        routine: {
            morning: ['ClaryCalm nos pulsos (iniciar 7 dias antes do ciclo)'],
            afternoon: ['Geranium nos pulsos se irritabilidade'],
            night: ['Lavanda no difusor', 'ClaryCalm no abdômen inferior'],
        },
        expectedResults: 'Redução dos sintomas de TPM, humor mais estável.',
        affirmation: 'Seu corpo feminino merece cuidado em cada fase.',
    },
    'Irritabilidade': {
        focus: 'Eixo Emocional', icon: '🧘',
        therapeuticObjective: 'Regulação emocional e redução da reatividade.',
        oils: [
            { name: 'Balance', fn: 'Equilíbrio emocional' },
            { name: 'Lavanda', fn: 'Calma e relaxamento' },
            { name: 'Bergamota', fn: 'Estabilização do humor' },
        ],
        routine: {
            morning: ['Balance nas solas dos pés'],
            afternoon: ['Bergamota nos pulsos'],
            night: ['Lavanda no difusor'],
        },
        expectedResults: 'Maior paciência e equilíbrio emocional ao longo do dia.',
        affirmation: 'Você pode responder com calma. A paz é sua escolha.',
    },
    'Dificuldade de concentração': {
        focus: 'Eixo Cognitivo', icon: '🧠',
        therapeuticObjective: 'Estimulação cognitiva e melhora do foco mental.',
        oils: [
            { name: 'InTune', fn: 'Foco e concentração' },
            { name: 'Peppermint', fn: 'Clareza mental' },
            { name: 'Rosemary', fn: 'Estimulação da memória' },
        ],
        routine: {
            morning: ['InTune na nuca e pulsos antes do trabalho'],
            afternoon: ['Peppermint inalação direta para foco'],
            night: ['Rosemary no difusor durante estudo'],
        },
        expectedResults: 'Melhora na capacidade de concentração e produtividade.',
        affirmation: 'Sua mente é poderosa e pode focar com clareza.',
    },
    'Confusão mental': {
        focus: 'Eixo Cognitivo', icon: '🧠',
        therapeuticObjective: 'Eliminar brain fog e restaurar clareza mental.',
        oils: [
            { name: 'InTune', fn: 'Foco e concentração' },
            { name: 'Frankincense', fn: 'Suporte neuroimune' },
            { name: 'Peppermint', fn: 'Clareza e alerta' },
        ],
        routine: {
            morning: ['InTune nuca e pulsos', 'Frankincense sublingual'],
            afternoon: ['Peppermint inalação'],
            night: ['Frankincense sublingual'],
        },
        expectedResults: 'Clareza mental, melhor tomada de decisão.',
        affirmation: 'Sua mente pode funcionar com clareza e paz.',
    },
    'Baixa autoestima': {
        focus: 'Eixo Emocional', icon: '💛',
        therapeuticObjective: 'Reconexão com valor próprio e elevação da autoconfiança.',
        oils: [
            { name: 'Bergamota', fn: 'Autoestima e aceitação' },
            { name: 'Wild Orange', fn: 'Alegria e positividade' },
            { name: 'Whisper', fn: 'Feminilidade e autoconfiança' },
        ],
        routine: {
            morning: ['Bergamota nos pulsos', 'Wild Orange no difusor'],
            afternoon: ['Whisper no pescoço'],
            night: ['Lavanda no difusor'],
        },
        expectedResults: 'Maior autoconfiança e conexão consigo mesma.',
        affirmation: 'Você é valiosa exatamente como é.',
    },
    'Fígado sobrecarregado': {
        focus: 'Eixo Detox', icon: '🌿',
        therapeuticObjective: 'Desintoxicação hepática e suporte ao metabolismo.',
        oils: [
            { name: 'Zendocrine', fn: 'Desintoxicação sistêmica' },
            { name: 'Lemon', fn: 'Suporte hepático e detox' },
            { name: 'Geranium', fn: 'Suporte à função hepática' },
        ],
        routine: {
            morning: ['1 gota de Lemon em água ao acordar', 'Zendocrine no abdômen (diluído)'],
            afternoon: [],
            night: ['Geranium nos pés'],
        },
        expectedResults: 'Melhora na disposição, pele mais limpa e digestão mais leve.',
        affirmation: 'Seu corpo tem capacidade natural de se desintoxicar.',
    },
    'Celulite': {
        focus: 'Eixo Estético', icon: '✨',
        therapeuticObjective: 'Estimulação da circulação e drenagem linfática.',
        oils: [
            { name: 'Cypress', fn: 'Circulação e drenagem' },
            { name: 'Juniper Berry', fn: 'Drenagem linfática' },
            { name: 'Lemongrass', fn: 'Anti-inflamatório e circulatório' },
        ],
        routine: {
            morning: [],
            afternoon: ['Massagem nas áreas afetadas com blend diluído'],
            night: ['Cypress + Juniper Berry em óleo de coco (massagem ascendente)'],
        },
        expectedResults: 'Melhora gradual da aparência da pele, redução do inchaço.',
        affirmation: 'Cuidar do seu corpo é um ato de amor.',
    },
    'Inchaço nas pernas': {
        focus: 'Eixo Circulatório', icon: '🦵',
        therapeuticObjective: 'Estimulação da circulação e drenagem de líquidos.',
        oils: [
            { name: 'Cypress', fn: 'Circulação e retorno venoso' },
            { name: 'Lemongrass', fn: 'Anti-inflamatório' },
            { name: 'Juniper Berry', fn: 'Drenagem linfática' },
        ],
        routine: {
            morning: ['Cypress nas pernas (massagem ascendente)'],
            afternoon: ['Elevar as pernas por 15min'],
            night: ['Juniper Berry + Lemongrass diluídos nas pernas'],
        },
        expectedResults: 'Redução do inchaço, pernas mais leves.',
        affirmation: 'Seu corpo pode drenar o que não precisa mais.',
    },
};

export function analyzeAnamnesis(answers) {
    const problems = [];
    const protocols = [];

    const allSymptoms = [
        ...(answers.general_symptoms || []),
        ...(answers.emotional_symptoms || []),
        ...(answers.digestive_symptoms || []),
        ...(answers.skin_symptoms || []),
        ...(answers.hair_symptoms || []),
        ...(answers.low_energy_symptoms || []),
        ...(answers.sleep_symptoms || []),
        ...(answers.hormonal_female || []),
    ];

    allSymptoms.forEach(symptom => {
        if (PROTOCOLS[symptom]) {
            if (!protocols.find(p => p.symptom === symptom)) {
                protocols.push({ symptom, ...PROTOCOLS[symptom] });
            }
        }
    });

    const energyLevel = answers.energy_level || 5;
    if (energyLevel <= 4) {
        problems.push({ severity: 'high', label: 'Baixa Energia / Fadiga' });
    }

    const stressLevel = answers.stress_level || 0;
    if (stressLevel >= 7) {
        problems.push({ severity: 'high', label: 'Estresse Elevado' });
    }

    // Determine the primary therapeutic axis
    const axisCounts = {};
    protocols.forEach(p => {
        const axis = p.focus || 'Geral';
        axisCounts[axis] = (axisCounts[axis] || 0) + 1;
    });
    const primaryAxis = Object.entries(axisCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Saúde Integral';

    const goals = answers.goals || [];
    return {
        mainSymptoms: allSymptoms.slice(0, 8),
        protocols: protocols.slice(0, 6),
        problems,
        goals,
        stressLevel,
        energyLevel,
        mainComplaint: answers.main_complaint || '',
        primaryAxis,
    };
}
