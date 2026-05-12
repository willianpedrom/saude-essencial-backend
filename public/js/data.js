/* ============================================================
   ANAMNESIS DATA – Perguntas detalhadas
   Sistema Saúde Essencial CRM
   ============================================================ */

export const ANAMNESIS_STEPS = [
    { id: 'personal', label: 'Início Rápido', icon: '👋' },
    { id: 'health', label: 'Saúde Física', icon: '🫀' },
    { id: 'emotional', label: 'Emocional & Sono', icon: '🧠' },
    { id: 'body', label: 'Corpo & Hábitos', icon: '✨' },
    { id: 'goals', label: 'Quase lá!', icon: '🎯' },
];

export const ANAMNESIS_QUESTIONS = {
    personal: {
        title: 'Olá! Como podemos te chamar?', icon: '👋',
        fields: [
            { name: 'target', label: 'Para quem é esta anamnese?', type: 'radio', options: ['Para mim', 'Para meu filho(a)'], onChangeSubmit: true, required: true },
            { name: 'full_name', label: 'Seu Nome ou Apelido', type: 'text', required: true, placeholder: 'Ex: Ana Maria', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)' },
            { name: 'child_name', label: 'Nome da Criança', type: 'text', required: true, placeholder: 'Ex: João', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)' },
            { name: 'guardian_name', label: 'Seu Nome (Responsável)', type: 'text', required: true, placeholder: 'Ex: Ana Maria', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)' },
            { name: 'child_age', label: 'Idade da Criança (ex: 3 anos e 8 meses)', type: 'text', required: true, placeholder: 'Idade exata', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)' },
            { name: 'child_weight', label: 'Peso Aproximado (kg)', type: 'text', required: true, placeholder: 'Ex: 15kg', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)' },
            { name: 'phone', label: 'Seu melhor WhatsApp', type: 'tel', required: true, placeholder: '(11) 99999-9999' }
        ]
    },
    health: {
        title: 'Ótimo começo, {nome}! Como está a sua Saúde Física?', icon: '🫀',
        sections: [
            {
                label: 'Atenção especial: O uso será para alguém com alguma destas condições?', key: 'special_conditions', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Gestante',
                    'Lactante',
                    'Criança (menor de 3 anos)',
                    'Criança (entre 3 e 12 anos)',
                    'Epilepsia',
                    'Hipertensão (Pressão Alta)',
                    'Nenhuma destas'
                ]
            },
            {
                label: 'Imunidade e Saúde Física da Criança', key: 'child_health_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', options: [
                    'Resfriados frequentes', 'Viroses de repetição', 'Alergias respiratórias (rinite/asma)',
                    'Dermatite / Assaduras', 'Cólicas (bebês)', 'Constipação / Intestino preso', 'Refluxo', 'Febre frequente'
                ]
            },
            { label: 'Medicamentos ou suplementos em uso contínuo?', key: 'medications', type: 'textarea', placeholder: 'Liste medicamentos e suplementos (ou deixe em branco)' },
            {
                label: 'Sintomas físicos frequentes', key: 'general_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Dores de cabeça frequentes', 'Enxaqueca', 'Dores musculares', 'Dores nas articulações',
                    'Dor nas costas', 'Pressão alta', 'Pressão baixa', 'Falta de ar',
                    'Sinusite / Rinite', 'Alergias frequentes', 'Gripes frequentes',
                    'Queda de cabelo', 'Unhas fracas', 'Infecções frequentes', 'Inchaço nas pernas',
                ]
            },
            {
                label: 'Problemas digestivos', key: 'digestive_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Refluxo / Azia', 'Gastrite', 'Inchaço abdominal', 'Gases excessivos',
                    'Constipação', 'Diarreia frequente', 'Intestino irritável',
                    'Náuseas', 'Intolerância à lactose', 'Sensibilidade ao glúten',
                    'Fígado sobrecarregado', 'Compulsão alimentar / Vontade de doces',
                ]
            },
            {
                label: 'Saúde hormonal', key: 'hormonal_female', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Cólicas menstruais intensas', 'Ciclo irregular', 'TPM intensa',
                    'Endometriose', 'SOP', 'Menopausa em curso', 'Fogachos / Calores',
                    'Baixa libido', 'Dificuldade para engravidar',
                    'Hipotireoidismo', 'Hipertireoidismo', 'Resistência à insulina',
                ]
            },
            {
                label: 'Condições crônicas diagnosticadas', key: 'chronic_conditions', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Diabetes', 'Hipertensão', 'Colesterol alto', 'Artrite / Artrose',
                    'Fibromialgia', 'Asma', 'Doença celíaca', 'Nenhuma',
                ]
            },
            { label: 'Frequência da dor', key: 'pain_frequency', type: 'scale', scaleLabel: ['Raramente', 'Às vezes', 'Frequente', 'Sempre'], max: 5, showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)' },
        ]
    },
    emotional: {
        title: 'Isso aí, {nome}! Conta pra gente sobre suas Emoções e Sono', icon: '🧠',
        sections: [
            { label: 'Conte como está se sentindo emocionalmente', key: 'emotional_open', type: 'textarea', placeholder: 'Descreva sua situação emocional atual...', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)' },
            {
                label: 'Sintomas emocionais', key: 'emotional_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Ansiedade', 'Ataques de pânico', 'Estresse crônico',
                    'Esgotamento emocional (burnout)', 'Depressão', 'Tristeza frequente',
                    'Irritabilidade', 'Dificuldade de concentração', 'Esquecimento',
                    'Confusão mental', 'Baixa autoestima', 'Pensamentos acelerados',
                    'Dificuldade para relaxar', 'Raiva reprimida', 'Sensação de vazio',
                ]
            },
            {
                label: 'Comportamento e Sono da Criança', key: 'child_emotional_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', options: [
                    'Agitação noturna', 'Dificuldade para pegar no sono', 'Acorda muito de madrugada / Terror noturno',
                    'Birras extremas / Irritabilidade', 'Ansiedade de separação', 'Adaptação escolar difícil',
                    'Hiperatividade / Dificuldade de foco', 'Espectro autista / TDAH'
                ]
            },
            {
                label: 'Problemas de sono', key: 'sleep_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Insônia (dificuldade de adormecer)', 'Acorda no meio da noite',
                    'Sono leve', 'Bruxismo', 'Apneia do sono',
                    'Acorda sem disposição', 'Sonolência durante o dia',
                    'Dependência de remédio para dormir',
                ]
            },
            {
                label: 'Fadiga e baixa energia', key: 'low_energy_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Fadiga crônica / cansaço constante', 'Esgotamento após pequenos esforços',
                    'Falta de motivação', 'Procrastinação excessiva', 'Dependência de cafeína',
                    'Falta de força/energia para exercícios',
                ]
            },
            { label: 'Nível de estresse (1=baixo, 10=extremo)', key: 'stress_level', type: 'scale', max: 10, showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)' },
            { label: 'Nível de energia (1=exausto, 10=disposto)', key: 'energy_level', type: 'scale', max: 10, showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)' },
            { label: 'Horas de sono por noite', key: 'sleep_hours', type: 'radio', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Menos de 5h', '5 a 6h', '6 a 7h', '7 a 8h', 'Mais de 8h'] },
        ]
    },
    body: {
        title: 'Estamos quase lá, {nome}! Como são seus Hábitos Diários?', icon: '✨',
        sections: [
            {
                label: 'Condições de pele', key: 'skin_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Acne / Espinhas frequentes', 'Pele oleosa', 'Pele muito seca',
                    'Eczema / Dermatite', 'Psoríase', 'Manchas na pele',
                    'Rugas precoces', 'Flacidez', 'Celulite', 'Pele opaca / sem brilho',
                ]
            },
            {
                label: 'Condições do cabelo', key: 'hair_symptoms', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Queda excessiva', 'Cabelo fraco e quebradiço',
                    'Couro cabeludo oleoso', 'Caspa', 'Cabelo sem brilho', 'Alopecia / Calvície',
                ]
            },
            {
                label: 'Rotina e Ambiente', key: 'child_routine', type: 'checkbox', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', options: [
                    'Frequenta creche ou escola', 'Aceita bem cheiros e toques (massagem)',
                    'Possui sensibilidade sensorial', 'Tem restrição alimentar', 'Nasceu prematuro'
                ]
            },
            { label: 'Já usou óleos essenciais na criança antes? Houve alguma reação?', key: 'child_experience', type: 'textarea', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', placeholder: 'Conte um pouco...' },
            {
                label: 'Via de Uso Preferida', key: 'child_preference', type: 'checkbox', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', options: [
                    'No difusor de ambiente', 'Uso tópico (Roll-on nos pés/coluna)', 'Banhos aromáticos'
                ]
            },
            { label: 'Tipo de pele', key: 'skin_type', type: 'radio', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível'] },
            { label: 'Atividade física', key: 'exercise_freq', type: 'radio', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Sedentário', '1-2x por semana', '3-4x por semana', 'Todos os dias'] },
            { label: 'Alimentação predominante', key: 'diet_type', type: 'radio', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Saudável', 'Moderada', 'Industrializada', 'Vegetariana / Vegana', 'Low carb'] },
            { label: 'Água por dia', key: 'water_intake', type: 'radio', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Menos de 1L', '1 a 1,5L', '1,5 a 2L', 'Mais de 2L'] },
            { label: 'Consome com frequência', key: 'bad_habits_food', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Álcool', 'Café em excesso', 'Refrigerantes', 'Açúcar refinado', 'Cigarro'] },
        ]
    },
    goals: {
        title: 'Excelente, {nome}! Seu protocolo está quase pronto.', icon: '🎯',
        fields: [
            { name: 'email', label: 'Para qual e-mail enviamos seu Protocolo?', type: 'email', required: true, placeholder: 'seu@email.com' },
            { name: 'birthdate', label: 'Sua data de nascimento', type: 'birthdate', required: true, showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)' },
            { name: 'gender', label: 'Qual é o seu Gênero?', type: 'select', required: true, showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Feminino', 'Masculino'] },
            { name: 'child_gender', label: 'Qual é o gênero da criança?', type: 'select', required: true, showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', options: ['Feminino', 'Masculino'] },
            { name: 'city', label: 'Cidade e Estado', type: 'text', placeholder: 'Ex: São Paulo, SP' }
        ],
        sections: [
            { label: 'Qual é sua maior queixa de saúde HOJE?', key: 'main_complaint', type: 'textarea', placeholder: 'Descreva o principal problema que quer resolver...' },
            {
                label: 'O que busca com óleos essenciais?', key: 'goals', type: 'checkbox', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: [
                    'Reduzir estresse e ansiedade', 'Melhorar o sono', 'Aliviar dores',
                    'Melhorar a digestão', 'Fortalecer a imunidade', 'Equilibrar hormônios',
                    'Emagrecer / metabolismo', 'Melhorar pele e cabelo',
                    'Aumentar energia', 'Aumentar performance física', 'Acelerar recuperação muscular',
                    'Desintoxicar o organismo', 'Prevenir doenças naturalmente', 
                    'Cuidado emocional profundo', 'Apoio à menopausa', 'Saúde para a família',
                ]
            },
            {
                label: 'O que busca com os óleos para a criança?', key: 'child_goals', type: 'checkbox', showIf: (ans) => ans.personal?.target === 'Para meu filho(a)', options: [
                    'Aumentar a imunidade (prevenir doenças)', 'Melhorar a qualidade do sono',
                    'Acalmar agitação e ansiedade', 'Aliviar problemas respiratórios',
                    'Melhorar a digestão / aliviar cólicas', 'Cuidar da pele naturalmente',
                    'Apoio emocional e comportamental'
                ]
            },
            { label: 'Já usou óleos essenciais?', key: 'previous_experience', type: 'radio', showIf: (ans) => ans.personal?.target !== 'Para meu filho(a)', options: ['Nunca usei', 'Usei e gostei', 'Usei mas não tive resultado', 'Uso regularmente'] },
            { label: 'Comprometimento com mudança de hábitos', key: 'commitment_level', type: 'scale', max: 5, scaleLabel: ['Baixo', '', 'Médio', '', 'Alto'] },
        ]
    }
};

export const BUSINESS_STEPS = [
    { id: 'personal', label: 'Dados Pessoais', icon: '👤' },
    { id: 'profession', label: 'Momento Atual', icon: '💼' },
    { id: 'profile', label: 'Análise de Perfil', icon: '🧠' },
    { id: 'vision', label: 'Visão & Futuro', icon: '🚀' },
];

export const BUSINESS_QUESTIONS = {
    personal: {
        title: 'Dados Pessoais', icon: '👤',
        fields: [
            { name: 'full_name', label: 'Nome completo', type: 'text', required: true },
            { name: 'email', label: 'E-mail', type: 'email', required: true },
            { name: 'phone', label: 'WhatsApp', type: 'tel', required: true },
            { name: 'birthdate', label: 'Data de nascimento', type: 'birthdate', required: true },
            { name: 'gender', label: 'Gênero', type: 'select', required: true, options: ['Feminino', 'Masculino'] },
            { name: 'city', label: 'Cidade / Estado', type: 'text' },
            { name: 'profession', label: 'Profissão atual', type: 'text' }
        ]
    },
    profession: {
        title: 'Seu Momento Atual', icon: '💼',
        sections: [
            { key: 'current_moment', label: 'Qual é o seu momento profissional hoje?', type: 'radio', required: true, options: ['Empregado CLT', 'Autônomo/Profissional Liberal', 'Dono de Negócio', 'Em transição/Buscando oportunidades'] },
            { key: 'financial_goal', label: 'Que rentabilidade extra resolveria sua vida hoje (6 a 12 meses)?', type: 'radio', required: true, options: ['R$ 1.500 a R$ 3.000', 'R$ 3.000 a R$ 8.000', 'Mais de R$ 10.000'] },
            { key: 'time_availability', label: 'Quanto tempo semanal você tem para construir seu negócio?', type: 'radio', required: true, options: ['2 a 5 horas', '6 a 12 horas', '12 a 20 horas', 'Integralmente'] },
        ]
    },
    profile: {
        title: 'Análise de Perfil Profissional', icon: '🧠',
        sections: [
            {
                key: 'disc_action', label: 'Pilar 1: Em uma situação de pressão ou desafio, você costuma:', type: 'radio', required: true, options: [
                    'Focar no objetivo principal e decidir rápido para resolver logo.',
                    'Manter o entusiasmo da equipe e usar a comunicação para engajar.',
                    'Manter a calma, ouvir a todos e seguir um passo a passo seguro.',
                    'Analisar todos os riscos e fatos antes de dar qualquer passo.'
                ]
            },
            {
                key: 'jung_energy', label: 'Pilar 2: Após um dia intenso de interações, como você recarrega sua energia?', type: 'radio', required: true, options: [
                    'Estando com pessoas, conversando e compartilhando o dia.',
                    'Ficando em silêncio, lendo ou descansando no meu próprio espaço.'
                ]
            },
            {
                key: 'jung_decisions', label: 'Pilar 3: Na hora de tomar uma decisão importante para o negócio, o que pesa mais?', type: 'radio', required: true, options: [
                    'A lógica fria, os fatos e o que é mais justo/eficiente.',
                    'O impacto nas pessoas, nos meus valores e na harmonia do grupo.'
                ]
            },
            {
                key: 'archetype_drive', label: 'Pilar 4: O que mais te motiva a ser um empreendedor de sucesso?', type: 'radio', required: true, options: [
                    'Superar meus próprios limites, vencer desafios e ser reconhecido.',
                    'Ensinar, compartilhar sabedoria e ajudar outros a crescerem.',
                    'Proteger e cuidar da liberdade e segurança da minha família.',
                    'Ter liberdade total para criar, inovar e fazer do meu jeito.'
                ]
            },
        ]
    },
    vision: {
        title: 'Visão de Liderança', icon: '🚀',
        sections: [
            {
                key: 'leadership_posture', label: 'Como você se sente liderando um grupo de pessoas?', type: 'radio', required: true, options: [
                    'Me sinto muito confortável, costumo assumir a frente naturalmente.',
                    'Gosto de liderar pelo exemplo e pelo suporte aos outros.',
                    'Prefiro não liderar diretamente, gosto mais de executar ou planejar.',
                    'Ainda não tive experiência, mas quero aprender a ser um líder.'
                ]
            },
            {
                key: 'investment_posture', label: 'Qual sua postura em relação a investir tempo e recursos em um novo negócio?', type: 'radio', required: true, options: [
                    'Sou decidido e invisto no que acredito para ter retorno rápido.',
                    'Sou cauteloso, prefiro investir aos poucos conforme vejo resultados.',
                    'Estou em um momento de escassez, preciso de um modelo de baixo investimento.'
                ]
            },
            {
                key: 'readiness', label: 'Se você tivesse o método perfeito hoje, quando começaria?', type: 'radio', required: true, options: [
                    'Imediatamente, estou com muita sede de mudança.',
                    'Nas próximas semanas, após organizar minha agenda.',
                    'Preciso de alguns meses para amadurecer a ideia.'
                ]
            }
        ]
    }
};

// Re-export analysis from analysis.js if needed, but better to import directly where used.
// For backward compatibility during migration, we can export them as empty for now or re-import them.
// But we want to STOP loading them in PublicAnamnesis.js, so we leave them out.
