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

    // ── Óleos Únicos Adicionais ──────────────────────────────────────────
    'Melissa': { nameEn: 'Melissa', cat: 'single', fn: 'Antiviral, calmante profundo', uses: 'Herpes, ansiedade, depressão, antiviral', topical: 'Lábios, pescoço, solas dos pés', aromatic: 'Difusor' },
    'Rosa': { nameEn: 'Rose', cat: 'single', fn: 'Regenerador de pele, amor-próprio', uses: 'Pele madura, autoestima, cicatrizes, suporte emocional', topical: 'Rosto (diluído), peito, pulsos', aromatic: 'Difusor' },
    'Lime': { nameEn: 'Lime', cat: 'single', fn: 'Purificante, energizante, limpeza', uses: 'Foco mental, digestão, imunidade, limpeza', topical: 'Evitar exposição solar, água, difusor', aromatic: 'Difusor' },
    'Tangerina': { nameEn: 'Tangerine', cat: 'single', fn: 'Alegria, digestivo suave', uses: 'Humor, digestão, energia, frescor', topical: 'Pulsos, abdômen', aromatic: '3 gotas no difusor' },
    'Toranja': { nameEn: 'Grapefruit', cat: 'single', fn: 'Metabolismo, drenagem, humor', uses: 'Perda de peso, celulite, drenagem, humor', topical: 'Abdômen, coxas (diluído)', aromatic: 'Difusor matinal' },
    'Cúrcuma': { nameEn: 'Turmeric', cat: 'single', fn: 'Anti-inflamatório potente, imunidade', uses: 'Artrite, inflamação sistêmica, antioxidante', topical: 'Articulações (diluído), cápsula interna', aromatic: 'Difusor' },
    'Canela': { nameEn: 'Cinnamon', cat: 'single', fn: 'Circulação, antibacteriano', uses: 'Circulação, diabetes, infecções, digestão', topical: 'Sempre muito diluído (1:10), solas dos pés', aromatic: 'Difusor — aroma quente' },
    'Cravo': { nameEn: 'Clove', cat: 'single', fn: 'Analgésico, antioxidante', uses: 'Dor de dente, imunidade, antioxidante', topical: 'Diluído em solas dos pés, gengivas', aromatic: 'Difusor para purificação' },
    'Manjericão': { nameEn: 'Basil', cat: 'single', fn: 'Antiespasmódico, foco mental', uses: 'Dores musculares, foco, fadiga mental', topical: 'Têmporas, nuca, solas dos pés', aromatic: 'Inalação direta' },
    'Jasmine': { nameEn: 'Jasmine', cat: 'single', fn: 'Afrodisíaco, confiança', uses: 'Libido, autoconfiança, ansiedade leve', topical: 'Pulsos, pescoço', aromatic: 'Difusor' },
    'Neroli': { nameEn: 'Neroli', cat: 'single', fn: 'Ansiedade, pele, confiança', uses: 'Ansiedade, pele madura, autoestima, maternidade', topical: 'Rosto, pulsos, peito', aromatic: 'Difusor' },
    'Spearmint': { nameEn: 'Spearmint', cat: 'single', fn: 'Digestivo suave, respiratório', uses: 'Digestão, foco, frescor bucal, náusea', topical: 'Abdômen, têmporas', aromatic: 'Difusor' },
    'Hortelã-Pimenta': { nameEn: 'Peppermint Touch', cat: 'single', fn: 'Versão diluída do Peppermint para pele sensível', uses: 'Dor de cabeça, tensão muscular, foco', topical: 'Têmporas, nuca — pronto para usar sem diluição', aromatic: 'Inalação' },
    'Eucalipto Radiata': { nameEn: 'Eucalyptus Radiata', cat: 'single', fn: 'Suave, descongestivo respiratório', uses: 'Crianças, gripes, sinusite, pele sensível', topical: 'Peito, costas (pode usar mais diluído)', aromatic: 'Difusor para família' },
    'Arborvitae': { nameEn: 'Arborvitae', cat: 'single', fn: 'Purificante, repelente, grounding', uses: 'Aterramento, limpeza do ambiente, repelente', topical: 'Solas dos pés (diluído)', aromatic: 'Difusor' },
    'Cassia': { nameEn: 'Cassia', cat: 'single', fn: 'Aquecimento, circulação, imunidade', uses: 'Circulação, imunidade, glicemia', topical: 'Sempre muito diluído (1:10)', aromatic: 'Difusor — aroma quente' },
    'Coentro': { nameEn: 'Coriander', cat: 'single', fn: 'Digestivo, regulação glicêmica', uses: 'Digestão, diabetes, equilíbrio hormonal', topical: 'Abdômen (diluído)', aromatic: 'Difusor' },
    'Tomilho': { nameEn: 'Thyme Touch', cat: 'single', fn: 'Versão diluída do Tomilho', uses: 'Imunidade, infecções, queda de cabelo', topical: 'Solas dos pés, couro cabeludo', aromatic: 'Curto prazo' },
    'Pimenta Rosa': { nameEn: 'Pink Pepper', cat: 'single', fn: 'Circulação, antioxidante', uses: 'Dores musculares, circulação, energia', topical: 'Articulações, músculos (diluído)', aromatic: 'Difusor' },
    'Petitgrain': { nameEn: 'Petitgrain', cat: 'single', fn: 'Calmante, nervo vago, sono', uses: 'Ansiedade, insônia, sistema nervoso autônomo', topical: 'Nuca, peito (diluído)', aromatic: 'Difusor noturno' },
    'Douglas Fir': { nameEn: 'Douglas Fir', cat: 'single', fn: 'Respiratório, energia, pureza', uses: 'Congestão, purificação, energia, vitalidade', topical: 'Peito, pulsos', aromatic: 'Difusor' },
    'Spikenard': { nameEn: 'Spikenard', cat: 'single', fn: 'Calmante profundo, spiritual', uses: 'Meditação, insônia severa, estresse emocional', topical: 'Solas dos pés, nuca', aromatic: 'Difusor' },

    // ── Blends Adicionais ────────────────────────────────────────────────
    'Citrus Bliss': { nameEn: 'Citrus Bliss', cat: 'blend', fn: 'Alegria, energia, bom humor', uses: 'Depressão leve, energia matinal, ambiente positivo', topical: 'Pulsos, peito', aromatic: 'Difusor matinal' },
    'Cheer': { nameEn: 'Cheer', cat: 'blend', fn: 'Otimismo e positividade', uses: 'Baixo astral, falta de motivação, pensamentos negativos', topical: 'Pulsos, peito', aromatic: 'Difusor' },
    'Console': { nameEn: 'Console', cat: 'blend', fn: 'Suporte emocional em luto/perda', uses: 'Luto, tristeza profunda, perda emocional', topical: 'Peito, pulsos', aromatic: 'Difusor' },
    'Forgive': { nameEn: 'Forgive', cat: 'blend', fn: 'Perdão, liberação emocional', uses: 'Raiva reprimida, rancor, cicatrizes emocionais', topical: 'Peito, solas dos pés', aromatic: 'Difusor' },
    'Peace': { nameEn: 'Peace', cat: 'blend', fn: 'Paz, aceitação, calmante', uses: 'Ansiedade, aceitação, paz interior', topical: 'Nuca, pulsos, solas dos pés', aromatic: 'Difusor noturno' },
    'Purify': { nameEn: 'Purify', cat: 'blend', fn: 'Purificante, limpeza do ar', uses: 'Ambientes com odores, proteção viral, limpeza', topical: 'Pés (diluído)', aromatic: 'Difusor para limpeza' },
    'TerraShield': { nameEn: 'TerraShield', cat: 'blend', fn: 'Repelente natural, proteção externa', uses: 'Picadas de insetos, atividades ao ar livre', topical: 'Pele exposta (diluído)', aromatic: 'Difusor ao ar livre' },
    'DDR Prime': { nameEn: 'DDR Prime', cat: 'blend', fn: 'Suporte celular, antioxidante DNA', uses: 'Proteção celular, prevenção, antioxidante sistêmico', topical: 'Sublingual, solas dos pés, cápsulas', aromatic: 'Difusor' },
    'Slim & Sassy': { nameEn: 'Slim & Sassy', cat: 'blend', fn: 'Metabolismo, apetite, queima de gordura', uses: 'Perda de peso, controle do apetite, metabolismo lento', topical: 'Abdômen (diluído)', aromatic: 'Difusor, 1 gota em água' },
    'HD Clear': { nameEn: 'HD Clear', cat: 'blend', fn: 'Pele oleosa e com acne', uses: 'Acne, pele oleosa, pontos negros', topical: 'Aplicar diretamente nas áreas afetadas', aromatic: 'Não é a via principal' },
    'Salon Essentials': { nameEn: 'Stronger', cat: 'blend', fn: 'Unhas e cutículas fortes', uses: 'Unhas fracas, cutículas danificadas, fragilidade', topical: 'Aplicar nas unhas e cutículas', aromatic: 'Não aplicável' },
    'Immortelle': { nameEn: 'Immortelle', cat: 'blend', fn: 'Anti-aging, regeneração da pele', uses: 'Envelhecimento precoce, manchas, rugas, firmeza', topical: 'Rosto e pescoço (diluído)', aromatic: 'Não é a via principal' },
    'Calmer': { nameEn: 'Calmer', cat: 'blend', fn: 'Calma e sono para crianças', uses: 'Crianças agitadas, ansiedade infantil, sono,' , topical: 'Solas dos pés (diluído para crianças)', aromatic: 'Difusor noturno (crianças)' },
    'Steady': { nameEn: 'Steady', cat: 'blend', fn: 'Equilíbrio e aterramento para crianças', uses: 'TDAH infantil, hiperatividade, foco', topical: 'Solas dos pés (diluído)', aromatic: 'Difusor' },
    'Thinker': { nameEn: 'Thinker', cat: 'blend', fn: 'Foco e concentração para crianças', uses: 'Déficit de atenção, aprendizagem, foco escolar', topical: 'Nuca, solas dos pés', aromatic: 'Difusor' },

    // ── Óleos Nativos do Brasil e Exclusivos ────────────────────────────
    'Breu Branco': { nameEn: 'Breu Branco', cat: 'single', fn: 'Purificante, meditativo, anti-inflamatório', uses: 'Meditação, purificação, inflamação, ansiedade', topical: 'Solas dos pés, peito (diluído)', aromatic: 'Difusor — aroma amadeirado-cítrico' },
    'Erva Baleeira': { nameEn: 'Erva Baleeira', cat: 'single', fn: 'Anti-inflamatório, analgésico tópico', uses: 'Dores musculares, articulações, inflamação local', topical: 'Área afetada (diluído)', aromatic: 'Não é a via principal' },
    'Green Mandarin': { nameEn: 'Green Mandarin', cat: 'single', fn: 'Limpeza, vitalidade, suporte digestivo', uses: 'Digestão, energia, humor positivo, limpeza', topical: 'Abdômen, pulsos (fotossensível)', aromatic: '3 gotas no difusor' },
    'Guaiacwood': { nameEn: 'Guaiacwood', cat: 'single', fn: 'Aterramento, anti-inflamatório, meditativo', uses: 'Meditação profunda, inflamação, aterramento emocional', topical: 'Nuca, peito, solas dos pés (diluído)', aromatic: 'Difusor' },
    'Lemon Eucalyptus': { nameEn: 'Lemon Eucalyptus', cat: 'single', fn: 'Repelente natural, respiratório', uses: 'Repelente de insetos, congestão nasal', topical: 'Pele exposta (diluído)', aromatic: 'Difusor' },
    'Madagascar Vanilla': { nameEn: 'Madagascar Vanilla', cat: 'single', fn: 'Reconfortante, antioxidante', uses: 'Ansiedade, aconchego, suporte emocional', topical: 'Pulsos, peito', aromatic: 'Difusor — aroma cálido e doce' },
    'Magnolia': { nameEn: 'Magnolia', cat: 'single', fn: 'Equilíbrio emocional, redução do estresse', uses: 'Ansiedade, estresse situacional, bem-estar emocional', topical: 'Pulsos, pescoço, peito', aromatic: 'Difusor' },
    'Siberian Fir': { nameEn: 'Siberian Fir', cat: 'single', fn: 'Respiratório, energia, revitalizante', uses: 'Congestão, dores musculares, energia, frescor', topical: 'Peito, músculos (diluído)', aromatic: 'Difusor' },
    'Cilantro': { nameEn: 'Cilantro', cat: 'single', fn: 'Antioxidante, suporte digestivo e detox', uses: 'Detoxificação, digestão, ansiedade', topical: 'Abdômen (diluído)', aromatic: 'Difusor — levemente herbal' },
    'Citronela': { nameEn: 'Citronella', cat: 'single', fn: 'Repelente natural, purificante', uses: 'Repelente de insetos, purificação do ambiente', topical: 'Pele exposta (diluído)', aromatic: 'Difusor ao ar livre' },
    'Hawaiian Sandalwood': { nameEn: 'Hawaiian Sandalwood', cat: 'single', fn: 'Meditativo, hidratante, calmante', uses: 'Meditação, pele seca, foco, serenidade', topical: 'Rosto, peito, solas dos pés', aromatic: 'Difusor' },

    // ── Blends Adicionais do Catálogo Brasil ────────────────────────────
    'Air-X': { nameEn: 'Air-X', cat: 'blend', fn: 'Suporte respiratório e abertura das vias aéreas', uses: 'Congestão intensa, asma, bronquite, alergias respiratórias', topical: 'Peito, costas, sob o nariz', aromatic: 'Difusor ou inalação direta' },
    'AromaTouch': { nameEn: 'AromaTouch', cat: 'blend', fn: 'Relaxamento muscular, massagem terapêutica', uses: 'Tensão muscular, estresse, técnica AromaTouch', topical: 'Coluna vertebral, costas (diluído — via massagem)', aromatic: 'Difusor' },
    'Brave': { nameEn: 'Brave', cat: 'blend', fn: 'Coragem e força emocional para crianças', uses: 'Medos infantis, insegurança, ansiedade em crianças', topical: 'Solas dos pés, pulsos (diluído)', aromatic: 'Difusor' },
    'Forest Bathing': { nameEn: 'Forest Bathing', cat: 'blend', fn: 'Conexão com a natureza, relaxamento', uses: 'Estresse urbano, desconexão com a natureza, revitalização', topical: 'Peito, pulsos', aromatic: 'Difusor — aroma de floresta' },
    'Hope': { nameEn: 'Hope', cat: 'blend', fn: 'Esperança, suporte emocional em momentos difíceis', uses: 'Situações de perda, baixa esperança, tristeza', topical: 'Peito, pulsos (Touch)', aromatic: 'Difusor' },
    'Hygge': { nameEn: 'Hygge', cat: 'blend', fn: 'Aconchego, conforto e bem-estar emocional', uses: 'Ambiente acolhedor, conforto em casa, momentos de cuidado', topical: 'Pulsos, peito', aromatic: 'Difusor — aroma quente e aconchegante' },
    'Passion': { nameEn: 'Passion', cat: 'blend', fn: 'Paixão, criatividade, entusiasmo', uses: 'Falta de motivação, criatividade bloqueada, paixão pela vida', topical: 'Pulsos, pescoço', aromatic: 'Difusor' },
    'Rescuer': { nameEn: 'Rescuer', cat: 'blend', fn: 'Alívio de dores musculares e tensão', uses: 'Dores musculares, tensão, recuperação pós-exercício', topical: 'Área afetada (massagem, diluído)', aromatic: 'Não é a via principal' },
    'Smart & Sassy': { nameEn: 'Smart & Sassy', cat: 'blend', fn: 'Metabolismo, controle do apetite', uses: 'Perda de peso, controle de fome, metabolismo, energia', topical: 'Abdômen (diluído)', aromatic: 'Difusor, 1-2 gotas em água' },
    'Stronger': { nameEn: 'Stronger', cat: 'blend', fn: 'Proteção e força para crianças', uses: 'Imunidade infantil, proteção, saúde das crianças', topical: 'Solas dos pés (diluído)', aromatic: 'Difusor' },
    'Tamer': { nameEn: 'Tamer', cat: 'blend', fn: 'Suporte digestivo para crianças', uses: 'Dores de barriga infantil, náusea, cólica em crianças', topical: 'Abdômen (diluído)', aromatic: 'Difusor' },
    'Salubelle': { nameEn: 'Salubelle', cat: 'blend', fn: 'Anti-aging, regeneração profunda da pele', uses: 'Rugas, manchas, flacidez, pele madura', topical: 'Rosto e pescoço (diluído)', aromatic: 'Não é a via principal' },
    'Veráge': { nameEn: 'Veráge', cat: 'blend', fn: 'Cuidado tópico da pele, rejuvenescimento', uses: 'Pele envelhecida, manchas, hidratação, anti-aging', topical: 'Rosto e pescoço (Touch)', aromatic: 'Não aplicável' },
    'Citrus Bloom': { nameEn: 'Citrus Bloom', cat: 'blend', fn: 'Frescor, feminilidade, energia', uses: 'Bem-estar feminino, frescor, mood positivo', topical: 'Pulsos, pescoço (Touch)', aromatic: 'Difusor' },

    // ── Suplementos ────────────────────────────────────────────────
    'Beauty Power': { nameEn: 'Beauty Power Collagen Elixir', cat: 'supplement', fn: 'Colágeno VERISOL®, Coenzima Q10, Ácido Hialurônico', uses: 'Cabelo, pele, unhas, celulite, anti-aging interno', topical: 'Não aplicável — uso oral', aromatic: 'Não aplicável' },
    'VM Complex': { nameEn: 'Microplex VMz', cat: 'supplement', fn: 'Multivitamínico e minerais essenciais', uses: 'Nutrição celular, energia, sistema imunológico', topical: 'Uso oral (cápsulas)', aromatic: 'Não aplicável' },
    'xEO Mega': { nameEn: 'xEO Mega', cat: 'supplement', fn: 'Complexo de Ômegas e Óleos Essenciais', uses: 'Saúde cardiovascular, cerebral, articular', topical: 'Uso oral (cápsulas)', aromatic: 'Não aplicável' },
    'MetaPWR Advantage': { nameEn: 'MetaPWR Advantage', cat: 'supplement', fn: 'Colágeno + NMN', uses: 'Longevidade celular, metabolismo, anti-aging', topical: 'Uso oral (sachê)', aromatic: 'Não aplicável' },
    'MetaPWR FiberUP': { nameEn: 'MetaPWR FiberUP', cat: 'supplement', fn: 'Mix de Fibras Solúveis', uses: 'Saúde intestinal, saciedade, metabolismo', topical: 'Uso oral (sachê)', aromatic: 'Não aplicável' },
    'TrimShake Vanilla': { nameEn: 'TrimShake Vanilla', cat: 'supplement', fn: 'Shake Nutricional Baunilha', uses: 'Gestão de peso, substituidor de refeição', topical: 'Uso oral', aromatic: 'Não aplicável' },
    'TrimShake Chocolate': { nameEn: 'TrimShake Chocolate', cat: 'supplement', fn: 'Shake Nutricional Chocolate', uses: 'Gestão de peso, substituidor de refeição', topical: 'Uso oral', aromatic: 'Não aplicável' },

    // ── Cápsulas, Pastilhas e Balas ──────────────────────────────
    'Adaptiv Pastilhas': { nameEn: 'Adaptiv Capsules', cat: 'supplement', fn: 'Suporte ao estresse e ansiedade', uses: 'Ansiedade crônica, tensão mental, foco', topical: 'Uso oral (cápsula)', aromatic: 'Não aplicável' },
    'TriEase': { nameEn: 'TriEase Softgels', cat: 'supplement', fn: 'Suporte sazonal e respiratório', uses: 'Alergias sazonais, sensibilidades respiratórias', topical: 'Uso oral (cápsula)', aromatic: 'Não aplicável' },
    'DDR Prime Cápsulas': { nameEn: 'DDR Prime Softgels', cat: 'supplement', fn: 'Antioxidante e suporte do DNA', uses: 'Proteção celular, radicais livres, suporte sistêmico', topical: 'Uso oral (cápsula)', aromatic: 'Não aplicável' },
    'On Guard Pastilhas': { nameEn: 'On Guard Chewable', cat: 'supplement', fn: 'Suporte imunológico oral', uses: 'Imunidade, garganta irritada', topical: 'Chover / Mastigar', aromatic: 'Não aplicável' },
    'On Guard Beadlets': { nameEn: 'On Guard Beadlets', cat: 'supplement', fn: 'Hálito fresco e imunidade diária', uses: 'Proteção imunológica prática, hálito', topical: 'Ingerir ou estourar na boca', aromatic: 'Não aplicável' },
    'Peppermint Beadlets': { nameEn: 'Peppermint Beadlets', cat: 'supplement', fn: 'Frescor e energia', uses: 'Hálito fresco, energia rápida, digestão leve', topical: 'Ingerir ou estourar na boca', aromatic: 'Não aplicável' },
    'SuperMint Beadlets': { nameEn: 'SuperMint Beadlets', cat: 'supplement', fn: 'Mix de mentas para frescor e foco', uses: 'Respiração limpa, hálito, energia focal', topical: 'Ingerir ou estourar na boca', aromatic: 'Não aplicável' },
    'ZenGest Cápsulas': { nameEn: 'ZenGest Softgels', cat: 'supplement', fn: 'Suporte digestivo sistêmico', uses: 'Má digestão, azia, desconforto intestinal', topical: 'Uso oral (cápsula)', aromatic: 'Não aplicável' },
    'Cúrcuma Cápsulas': { nameEn: 'Turmeric Softgels', cat: 'supplement', fn: 'Anti-inflamatório sistêmico', uses: 'Dores articulares, inflamação celular, cognição', topical: 'Uso oral (cápsula)', aromatic: 'Não aplicável' },
    'Balas Breathe': { nameEn: 'Breathe Respiratory Drops', cat: 'other', fn: 'Alívio respiratório rápido', uses: 'Garganta irritada, tosse, vias congestionadas', topical: 'Uso oral (chupar)', aromatic: 'Não aplicável' },
    'Balas Ginger': { nameEn: 'Ginger Drops', cat: 'other', fn: 'Alívio digestivo e enjoo', uses: 'Náusea, digestão, viagens', topical: 'Uso oral (chupar)', aromatic: 'Não aplicável' },
    'Balas On Guard': { nameEn: 'On Guard Protecting Throat Drops', cat: 'other', fn: 'Defesa e alívio da garganta', uses: 'Garganta inflamada, proteção imunológica', topical: 'Uso oral (chupar)', aromatic: 'Não aplicável' },

    // ── Mais Óleos e Blends ────────────────────────────────────────
    'Blue Tansy': { nameEn: 'Blue Tansy', cat: 'single', fn: 'Calmante para pele, músculos, emoções', uses: 'Pele irritada, manchas, dores musculares', topical: 'Rosto, áreas afetadas (muita diluição)', aromatic: 'Difusor' },
    'Cinnamon Bark': { nameEn: 'Cinnamon Bark', cat: 'single', fn: 'Metabolismo, imunidade, aquecedor', uses: 'Metabolismo lento, imunidade baixa, circulação', topical: 'Solas dos pés (diluído)', aromatic: 'Difusor' },
    'Clary Sage': { nameEn: 'Clary Sage', cat: 'single', fn: 'Equilíbrio hormonal feminino', uses: 'TPM, menopausa, ondas de calor, estresse', topical: 'Baixo ventre, pulsos, nuca', aromatic: 'Difusor' },
    'ClaryCalm': { nameEn: 'ClaryCalm', cat: 'blend', fn: 'Mix Mensal da Mulher', uses: 'Cólicas, TPM, climatério, humor', topical: 'Baixo ventre, nuca, pulsos (Touch)', aromatic: 'Não é a via principal' },
    'Elevation': { nameEn: 'Elevation', cat: 'blend', fn: 'Mix de Alegria', uses: 'Tristeza profunda, falta de energia, humor baixo', topical: 'Pulsos, peito', aromatic: 'Difusor' },
    'InTune': { nameEn: 'InTune', cat: 'blend', fn: 'Mix de Foco', uses: 'Déficit de atenção, estudo, clareza mental', topical: 'Nuca, têmporas (Touch)', aromatic: 'Têmporas' },
    'Motivate': { nameEn: 'Motivate', cat: 'blend', fn: 'Mix de Motivação', uses: 'Procrastinação, cansaço mental, encorajamento', topical: 'Pulsos, nuca', aromatic: 'Difusor' },
    'PastTense': { nameEn: 'PastTense', cat: 'blend', fn: 'Mix de Relaxamento para Tensão', uses: 'Enxaqueca, tensão muscular profunda', topical: 'Nuca, ombros, têmporas (Touch)', aromatic: 'Não aplicável' },
    'Whisper': { nameEn: 'Whisper Touch', cat: 'blend', fn: 'Mix Feminino (Perfume)', uses: 'Perfume pessoal, relaxamento íntimo', topical: 'Pulsos, pescoço', aromatic: 'Pessoal' },
    'Yarrow|Pom': { nameEn: 'Yarrow|Pom', cat: 'blend', fn: 'Duo Nutritivo Ativo Botânico', uses: 'Anti-aging, manchas, inflamação, vitalidade', topical: 'Rosto e pescoço', aromatic: 'Não aplicável' },
    'Zendocrine': { nameEn: 'Zendocrine', cat: 'blend', fn: 'Mix de Limpeza (Detox)', uses: 'Detoxificação fígado/rins, limpeza sistêmica', topical: 'Solas dos pés, abdômen', aromatic: 'Difusor, Interno' },

    // ── Cuidados Pessoais e Skincare ──────────────────────────────
    'Deep Blue Rub': { nameEn: 'Deep Blue Rub', cat: 'personal_care', fn: 'Creme para alívio muscular e articular', uses: 'Dores crônicas, recuperação esportiva, tensão', topical: 'Massagem local profunda', aromatic: 'Não aplicável' },
    'Creme Dental On Guard': { nameEn: 'On Guard Toothpaste', cat: 'personal_care', fn: 'Creme dental clareador sem flúor', uses: 'Higiene bucal diária, gengivite', topical: 'Uso diário (escovação)', aromatic: 'Não aplicável' },
    'Enxaguante Bucal On Guard': { nameEn: 'On Guard Mouthwash', cat: 'personal_care', fn: 'Higiene e proteção oral', uses: 'Hálito fresco, saúde gengival', topical: 'Bochecho', aromatic: 'Não aplicável' },
    'Loção Spa Mãos e Corpo': { nameEn: 'Spa Hand & Body Lotion', cat: 'personal_care', fn: 'Hidratante carreador neutro', uses: 'Pele seca, ótimo para misturar com óleos', topical: 'Todo o corpo', aromatic: 'Não aplicável' },
    'Sabonete Líquido Spa': { nameEn: 'Spa Refreshing Body Wash', cat: 'personal_care', fn: 'Limpeza corporal revigorante', uses: 'Uso diário no banho', topical: 'Banho', aromatic: 'Aroma relaxante no banho' },
    'Veráge Kit Skincare': { nameEn: 'Veráge Skin Care Collection', cat: 'personal_care', fn: 'Sistema completo facial anti-aging', uses: 'Limpeza, tonificação e hidratação diária do rosto', topical: 'Rosto', aromatic: 'Não aplicável' },

    // ── Acessórios e Outros ──────────────────────────────────────
    'Difusor Petal 2.0': { nameEn: 'Petal Diffuser', cat: 'accessory', fn: 'Difusor ultrassônico com luz', uses: 'Aromatização de ambientes de até 30m²', topical: 'Não aplicável', aromatic: 'Ultrassônico' },
    'Difusor Pebble': { nameEn: 'Pebble Diffuser', cat: 'accessory', fn: 'Difusor portátil e ultrassônico', uses: 'Aromatização de espaços pequenos e viagens', topical: 'Não aplicável', aromatic: 'Ultrassônico' },
    'Umidificador Dawn': { nameEn: 'Dawn Aroma Humidifier', cat: 'accessory', fn: 'Umidificador de alta capacidade', uses: 'Umidificar e aromatizar ambientes amplos, uso noturno', topical: 'Não aplicável', aromatic: 'Umidificador' },
    'Caixa de Madeira': { nameEn: 'Wooden Box', cat: 'accessory', fn: 'Organizadora com 25 compartimentos', uses: 'Armazenamento seguro e estético para os óleos', topical: 'Não aplicável', aromatic: 'Não aplicável' },
    'Óleo de Coco Fracionado': { nameEn: 'Fractionated Coconut Oil', cat: 'accessory', fn: 'Óleo carreador premium', uses: 'Diluição de óleos essenciais para aplicação tópica segura e massagens', topical: 'Carreador Tópico', aromatic: 'Inodoro' },
};

/* ---- KIT BRASIL LIVING (12 produtos inclusívos) ---- */
// Estes são os óleos que compõem o dTERRA® Brasil Living Kit.
// Em protocolos, eles são exibidos como "Essencial" (a cliente já pode tê-los).
// Demais óleos aparecem como "Complementar" (próximos passos).
export const LIVING_KIT = new Set([
    'Deep Blue',      // dTERRA Deep Blue®
    'On Guard',       // dTERRA On Guard®
    'Lavanda',        // Lavender
    'Lemon',          // Lemon
    'Peppermint',     // Peppermint
    'Breathe',        // dTERRA Breathe®
    'Tea Tree',       // Melaleuca
    'Frankincense',   // Frankincense (Olíbano)
    'Tangerina',      // Tangerine
    'Copaiba',        // Copaiba
    'Balance',        // dTERRA Balance®
    'DigestZen',      // ZenGest® (DigestZen no Brasil)
]);



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
                // Sort oils: kit oils first (inKit: true), complementary after (inKit: false)
                const sortedOils = [...(PROTOCOLS[symptom].oils || [])]
                    .map(o => ({ ...o, inKit: LIVING_KIT.has(o.name) }))
                    .sort((a, b) => (b.inKit ? 1 : 0) - (a.inKit ? 1 : 0));
                protocols.push({ symptom, ...PROTOCOLS[symptom], oils: sortedOils });
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

export const BUSINESS_STEPS = [
    { id: 'personal', label: 'Dados Pessoais', icon: '👤' },
    { id: 'profession', label: 'Momento Atual', icon: '💼' },
    { id: 'profile', label: 'Análise de Perfil', icon: '🧠' },
    { id: 'vision', label: 'Visão & Futuro', icon: '🚀' },
];

export const BUSINESS_QUESTIONS = {
    profession: {
        title: 'Momento Profissional', icon: '💼',
        sections: [
            { key: 'current_moment', label: 'Qual é o seu momento profissional hoje?', type: 'radio', required: true, options: ['Empregado CLT', 'Autônomo/Profissional Liberal', 'Dono de Negócio', 'Em transição/Buscando oportunidades'] },
            { key: 'sales_experience', label: 'Como você avalia sua relação com vendas ou liderança de pessoas?', type: 'radio', required: true, options: ['Tenho experiência e adoro me conectar e negociar.', 'Nunca vendi, mas estou disposto(a) a aprender um método.', 'Tenho um pouco de aversão e prefiro bastidores.'] },
            { key: 'satisfaction', label: 'De 0 a 10, qual o seu nível de satisfação profissional e financeira hoje?', type: 'scale', max: 10, required: true },
        ]
    },
    profile: {
        title: 'Análise de Perfil', icon: '🧠',
        sections: [
            {
                key: 'disc_profile', label: 'Se você precisasse resolver um problema complexo com um grupo de pessoas hoje, como você agiria naturalmente?', type: 'radio', required: true, options: [
                    'Assumo a liderança imediatamente, divido as tarefas e exijo resultados rápidos.',
                    'Motivo a equipe, foco em manter a energia alta e uso a comunicação para conectar todos.',
                    'Ouço a todos primeiro, organizo o ambiente e sigo um método seguro e passo a passo.',
                    'Analiso os dados detalhadamente, crio regras severas e foco na qualidade e zero erros.'
                ]
            },
            {
                key: 'inner_motor', label: 'Qual o seu maior motivador para construir um negócio livre nos próximos 5 anos?', type: 'radio', required: true, options: [
                    'Segurança absoluta e tempo inegociável com a minha família.',
                    'Liberdade geográfica extrema (trabalhar de qualquer lugar do mundo).',
                    'Status, reconhecimento e criar independência financeira real.',
                    'Propósito: Ajudar milhares de pessoas a melhorarem de vida.'
                ]
            },
            {
                key: 'main_pain', label: 'Qual destas opções mais te incomoda hoje no mercado de trabalho tradicional?', type: 'radio', required: true, options: [
                    'Falta de reconhecimento e estagnação de ganhos',
                    'Falta de liberdade de tempo e geográfica',
                    'Trabalhar muito para construir o sonho dos outros',
                    'Rotina engessada e falta de propósito'
                ]
            },
        ]
    },
    vision: {
        title: 'Visão & Futuro', icon: '🚀',
        sections: [
            {
                key: 'product_relation', label: 'Como é a sua relação com soluções naturais e óleos essenciais hoje?', type: 'radio', required: true, options: [
                    'Já sou um usuário apaixonado, os produtos fazem parte da minha rotina.',
                    'Acho incrível a filosofia, mas ainda não tenho conhecimento profundo, quero aprender.',
                    'Uso muitos remédios tradicionais hoje, mas sinto extrema necessidade de mudar de vida.'
                ]
            },
            {
                key: 'network_radar', label: 'Se olharmos para o seu círculo social ou contatos no WhatsApp hoje, como você se descreve?', type: 'radio', required: true, options: [
                    'Sou ativo e comunicativo, conheço muitas pessoas e costumam pedir meus conselhos.',
                    'Tenho uma rede de contatos boa, mas mais restrita ao meu trabalho e família.',
                    'Sou reservado, meu foco inicial seria aprender estratégias digitais para não depender de contatos.'
                ]
            },
            {
                key: 'time_availability', label: 'Acredita ter disponibilidade de tempo semanal para construir um negócio paralelo?', type: 'radio', required: true, options: [
                    '2 a 5 horas/semana', '6 a 12 horas/semana', '12 a 20 horas/semana', 'Integralmente'
                ]
            },
            {
                key: 'financial_goal', label: 'Que rentabilidade extra resolveria sua vida hoje (6 a 12 meses)?', type: 'radio', required: true, options: [
                    'R$ 1.500 a R$ 3.000', 'R$ 3.000 a R$ 8.000', 'Mais de R$ 10.000'
                ]
            },
            {
                key: 'investment_posture', label: 'Todo negócio estruturado requer ferramentas. Se encontrasse o modelo ideal hoje, como viabilizaria seu início?', type: 'radio', required: true, options: [
                    'Tenho margem e estou pronto para investir em algo seguro amanhã.',
                    'Precisaria de algumas semanas para me planejar financeiramente e separar o investimento.',
                    'Meu orçamento está no limite, precisaria começar com o fluxo mínimo possível.'
                ]
            },
            {
                key: 'readiness', label: 'Se você tivesse em mãos o plano perfeito, testado e com mentoria, qual seria a sua atitude hoje?', type: 'radio', required: true, options: [
                    'Começaria imediatamente, estou com muita sede de mudança.',
                    'Começaria nas próximas 4 semanas, estou me organizando.',
                    'Preciso de alguns meses para pensar se é meu momento.'
                ]
            }
        ]
    },
    personal: {
        title: 'Dados Pessoais', icon: '👤',
        fields: [
            { name: 'full_name', label: 'Nome completo', type: 'text', required: true },
            { name: 'email', label: 'E-mail', type: 'email', required: true },
            { name: 'phone', label: 'WhatsApp', type: 'tel', required: true },
            { name: 'birthdate', label: 'Data de nascimento', type: 'date', required: true },
            { name: 'gender', label: 'Gênero', type: 'select', required: true, options: ['Feminino', 'Masculino'] },
            { name: 'city', label: 'Cidade / Estado', type: 'text' },
            { name: 'profession', label: 'Profissão', type: 'text' }
        ]
    }
};

export function analyzeBusinessProfile(answers) {
    const profileText = answers.disc_profile || answers.profile?.disc_profile || '';
    const readinessText = answers.readiness || answers.vision?.readiness || '';
    const motorText = answers.inner_motor || answers.profile?.inner_motor || '';

    let archetype = { name: 'Empreendedor Versátil', desc: 'Adaptabilidade e foco em múltiplas frentes.', type: 'Geral' };

    if (profileText.includes('liderança imediatamente')) {
        archetype = { name: 'O Trator Realizador', desc: 'Foco absurdo, velocidade na tomada de decisão e orientação a resultados imediatos. Você é uma máquina de fazer acontecer.', type: 'Dominante' };
    } else if (profileText.includes('Motivo a equipe')) {
        archetype = { name: 'O Conector Carismático', desc: 'Poder de influência natural, facilidade de abrir portas e criar uma rede sólida através de relacionamentos de confiança.', type: 'Influente' };
    } else if (profileText.includes('Ouço a todos')) {
        archetype = { name: 'O Construtor Consistente', desc: 'Visão de longo prazo, lealdade aos propósitos e alta capacidade de retenção de clientes por causa do seu perfil acolhedor e metódico.', type: 'Estável' };
    } else if (profileText.includes('Analiso os dados')) {
        archetype = { name: 'O Estrategista Analítico', desc: 'Gestão impecável, facilidade com métodos, organização estrutural do negócio e baixíssima margem de erro na execução.', type: 'Conforme' };
    }

    let urgency = 'Neutro';
    if (readinessText.includes('imediatamente')) urgency = '🔥 Altíssima (Longo Prazo/Urgente)';
    if (readinessText.includes('semanas')) urgency = '🟡 Moderada (Em planejamento)';
    if (readinessText.includes('meses')) urgency = '❄️ Fria (Longo Prazo)';

    let motor = 'Mudança de Vida';
    if (motorText.includes('Segurança')) motor = 'Segurança Familiar';
    if (motorText.includes('Liberdade gráfica')) motor = 'Liberdade Geográfica';
    if (motorText.includes('Status')) motor = 'Independência Financeira e Reconhecimento';
    if (motorText.includes('Propósito')) motor = 'Impacto e Propósito Causa';

    const pain = answers.main_pain || answers.profile?.main_pain || 'Falta de oportunidades';
    const goal = answers.financial_goal || answers.vision?.financial_goal || 'Uma renda a mais';
    const hours = answers.time_availability || answers.vision?.time_availability || 'Algumas horas por semana';

    return { archetype, pain, goal, hours, urgency, motor };
}
