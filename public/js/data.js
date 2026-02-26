/* ============================================================
   ANAMNESIS DATA – Perguntas detalhadas e banco de óleos
   Sistema Saúde Essencial CRM
   ============================================================ */

export const ANAMNESIS_STEPS = [
    { id: 'personal', label: 'Dados Pessoais', icon: '👤' },
    { id: 'general', label: 'Saúde Geral', icon: '🫀' },
    { id: 'emotional', label: 'Saúde Emocional', icon: '🧠' },
    { id: 'digestive', label: 'Sistema Digestivo', icon: '🌿' },
    { id: 'hormonal', label: 'Hormonal & Feminino', icon: '🌸' },
    { id: 'sleep', label: 'Sono & Energia', icon: '🌙' },
    { id: 'skin', label: 'Pele & Beleza', icon: '✨' },
    { id: 'lifestyle', label: 'Estilo de Vida', icon: '🏃' },
    { id: 'goals', label: 'Objetivos', icon: '🎯' },
];

export const ANAMNESIS_QUESTIONS = {
    personal: {
        title: 'Dados Pessoais',
        icon: '👤',
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

    general: {
        title: 'Saúde Geral',
        icon: '🫀',
        sections: [
            {
                label: 'Quais sintomas você sente com frequência? (marque todos que se aplicam)',
                key: 'general_symptoms',
                type: 'checkbox',
                options: [
                    'Dores de cabeça frequentes', 'Enxaqueca', 'Dores musculares', 'Dores nas articulações',
                    'Dor nas costas (cervical)', 'Dor nas costas (lombar)', 'Pressão alta', 'Pressão baixa',
                    'Palpitações cardíacas', 'Falta de ar', 'Tosse recorrente', 'Sinusite / Rinite',
                    'Alergias frequentes', 'Gripes e resfriados frequentes', 'Febre recorrente',
                    'Vista cansada / seca', 'Zumbido nos ouvidos', 'Formigamento nas mãos ou pés',
                    'Inchaço nas pernas', 'Varizes', 'Queda de cabelo', 'Unhas fracas',
                    'Cicatrização lenta', 'Infecções frequentes',
                ]
            },
            {
                label: 'Com que frequência sente dor?',
                key: 'pain_frequency',
                type: 'scale',
                scaleLabel: ['Raramente', 'Às vezes', 'Quase sempre', 'Sempre'],
                max: 5
            },
            {
                label: 'Você possui diagnóstico de alguma condição crônica?',
                key: 'chronic_conditions',
                type: 'checkbox',
                options: [
                    'Diabetes', 'Hipotireoidismo', 'Hipertireoidismo', 'Hipertensão', 'Colesterol alto',
                    'Artrite / Artrose', 'Fibromialgia', 'Lúpus', 'Doença celíaca', 'Doença de Crohn',
                    'Asma', 'DPOC', 'Enxaqueca crônica', 'Nenhuma', 'Outra',
                ]
            },
            {
                label: 'Uso de medicamentos contínuos?',
                key: 'medications',
                type: 'textarea',
                placeholder: 'Liste os medicamentos que usa diariamente (ou deixe em branco)'
            }
        ]
    },

    emotional: {
        title: 'Saúde Emocional & Mental',
        icon: '🧠',
        sections: [
            {
                label: 'Como está sua saúde emocional? (marque o que se aplica)',
                key: 'emotional_symptoms',
                type: 'checkbox',
                options: [
                    'Ansiedade', 'Ansiedade generalizada', 'Ataques de pânico', 'Estresse crônico',
                    'Esgotamento emocional (burnout)', 'Depressão', 'Tristeza frequente', 'Irritabilidade',
                    'Dificuldade de concentração', 'Esquecimento / Memória fraca', 'Confusão mental (brain fog)',
                    'Baixa autoestima', 'Insegurança', 'Medo excessivo', 'Pensamentos acelerados',
                    'Dificuldade para relaxar', 'Choro fácil', 'Raiva reprimida', 'Sensação de vazio',
                    'Fobia social', 'Dificuldade nos relacionamentos', 'Sentimento de solidão',
                    'Luto não processado', 'Trauma não tratado',
                ]
            },
            {
                label: 'Nível de estresse atual (0 = sem estresse, 10 = extremamente estressado)',
                key: 'stress_level',
                type: 'scale',
                max: 10
            },
            {
                label: 'Com que frequência se sente feliz e motivado?',
                key: 'happiness_freq',
                type: 'radio',
                options: ['Raramente', 'Às vezes', 'Na maioria do tempo', 'Quase sempre']
            },
            {
                label: 'Você tem suporte emocional (família, amigos, terapia)?',
                key: 'emotional_support',
                type: 'radio',
                options: ['Sim, tenho bom suporte', 'Parcialmente', 'Quase nenhum suporte']
            },
            {
                label: 'Conte um pouco sobre como se sente emocionalmente hoje',
                key: 'emotional_open',
                type: 'textarea',
                placeholder: 'Descreva sua situação emocional atual. Isso nos ajuda a personalizar seu protocolo...'
            }
        ]
    },

    digestive: {
        title: 'Sistema Digestivo & Nutrição',
        icon: '🌿',
        sections: [
            {
                label: 'Problemas digestivos que você enfrenta:',
                key: 'digestive_symptoms',
                type: 'checkbox',
                options: [
                    'Refluxo / Azia', 'Gastrite', 'Úlcera gástrica', 'Inchaço abdominal frequente',
                    'Gases excessivos', 'Constipação (prisão de ventre)', 'Diarreia frequente',
                    'Intestino irritável (SII)', 'Náuseas frequentes', 'Intolerância à lactose',
                    'Intolerância ao glúten / Sensibilidade', 'Candidíase intestinal', 'Parasitoses',
                    'Fígado sobrecarregado', 'Vesícula removida', 'Má absorção de nutrientes',
                    'Perda de apetite', 'Compulsão alimentar', 'Fome emocional',
                ]
            },
            {
                label: 'Como é sua alimentação predominante?',
                key: 'diet_type',
                type: 'radio',
                options: [
                    'Muito saudável (poucos industrializados)',
                    'Moderada (equilíbrio entre natural e industrializado)',
                    'Industrializada (fast food, processados)',
                    'Vegetariana / Vegana',
                    'Cetogênica / Low carb'
                ]
            },
            {
                label: 'Quantos litros de água bebe por dia?',
                key: 'water_intake',
                type: 'radio',
                options: ['Menos de 1L', '1 a 1,5L', '1,5 a 2L', 'Mais de 2L']
            },
            {
                label: 'Consome com frequência:',
                key: 'bad_habits_food',
                type: 'checkbox',
                options: ['Álcool', 'Café em excesso', 'Refrigerantes', 'Açúcar refinado', 'Gordura trans', 'Cigarro / Tabaco']
            }
        ]
    },

    hormonal: {
        title: 'Saúde Hormonal & Feminina',
        icon: '🌸',
        sections: [
            {
                label: 'Aplica-se a você? (Saúde da Mulher)',
                key: 'hormonal_female',
                type: 'checkbox',
                options: [
                    'Cólicas menstruais intensas', 'Ciclo irregular', 'TPM intensa (humor, inchaço, dor)',
                    'Fluxo muito intenso', 'Fluxo muito fraco / ausente', 'Endometriose',
                    'SOP (Síndrome dos Ovários Policísticos)', 'Mioma uterino', 'Menopausa em curso',
                    'Peri-menopausa', 'Fogachos / Calores', 'Ressecamento vaginal',
                    'Baixa libido', 'Infecções vaginais recorrentes', 'Gravidez atual',
                    'Amamentando', 'Dificuldade para engravidar', 'Pós-parto',
                ]
            },
            {
                label: 'Desequilíbrios hormonais conhecidos:',
                key: 'hormonal_issues',
                type: 'checkbox',
                options: [
                    'Hipotireoidismo', 'Hipertireoidismo', 'Resistência à insulina', 'Excesso de cortisol (estresse crônico)',
                    'Baixo estrogênio', 'Excesso de estrogênio (dominância)', 'Baixa progesterona',
                    'Testosterona baixa', 'Prolactina elevada', 'Nenhum diagnóstico',
                ]
            },
            {
                label: 'Como avalia sua libido atualmente?',
                key: 'libido',
                type: 'scale',
                max: 5,
                scaleLabel: ['Muito baixa', '', '', '', 'Muito alta']
            }
        ]
    },

    sleep: {
        title: 'Sono & Níveis de Energia',
        icon: '🌙',
        sections: [
            {
                label: 'Como é seu sono?',
                key: 'sleep_symptoms',
                type: 'checkbox',
                options: [
                    'Insônia (dificuldade de adormecer)', 'Acorda no meio da noite', 'Sono leve / sensível ao barulho',
                    'Bruxismo (ranger dentes)', 'Ronco', 'Apneia do sono confirmada',
                    'Pesadelos frequentes', 'Sonambulismo', 'Acorda sem disposição',
                    'Sonolência excessiva durante o dia', 'Dependência de remédio para dormir',
                ]
            },
            {
                label: 'Quantas horas dorme por noite em média?',
                key: 'sleep_hours',
                type: 'radio',
                options: ['Menos de 5h', '5 a 6h', '6 a 7h', '7 a 8h', 'Mais de 8h']
            },
            {
                label: 'Nível de energia durante o dia (1 = exausto, 10 = muito disposto)',
                key: 'energy_level',
                type: 'scale',
                max: 10
            },
            {
                label: 'Sintomas de baixa energia:',
                key: 'low_energy_symptoms',
                type: 'checkbox',
                options: [
                    'Fadiga crônica / cansaço constante', 'Esgotamento após pequenos esforços',
                    'Falta de motivação', 'Dificuldade de concentração no trabalho',
                    'Procrastinação excessiva', 'Necessidade de cochilos',
                    'Dependência de cafeína para funcionar',
                ]
            }
        ]
    },

    skin: {
        title: 'Pele, Cabelo & Beleza',
        icon: '✨',
        sections: [
            {
                label: 'Condições de pele que enfrenta:',
                key: 'skin_symptoms',
                type: 'checkbox',
                options: [
                    'Acne / Espinhas frequentes', 'Pele oleosa', 'Pele muito seca', 'Pele mista',
                    'Eczema / Dermatite', 'Psoríase', 'Rosácea', 'Manchas na pele',
                    'Melasma', 'Rugas precoces', 'Flacidez', 'Celulite',
                    'Estrias', 'Sensibilidade a cosméticos', 'Urticária frequente',
                    'Pele opaca / sem brilho', 'Poros dilatados',
                ]
            },
            {
                label: 'Condições do cabelo:',
                key: 'hair_symptoms',
                type: 'checkbox',
                options: [
                    'Queda excessiva', 'Cabelo fraco e quebradiço', 'Couro cabeludo oleoso',
                    'Couro cabeludo seco / caspa', 'Cabelo sem brilho', 'Crescimento lento',
                    'Alopecia / Calvície', 'Cabelo ressecado por processos químicos',
                ]
            },
            {
                label: 'Tipo de pele:',
                key: 'skin_type',
                type: 'radio',
                options: ['Normal', 'Oleosa', 'Seca', 'Mista', 'Sensível']
            },
            {
                label: 'Rotina de skincare atual:',
                key: 'skincare_routine',
                type: 'radio',
                options: ['Nenhuma rotina', 'Rotina básica', 'Rotina completa', 'Uso de produtos naturais']
            }
        ]
    },

    lifestyle: {
        title: 'Estilo de Vida',
        icon: '🏃',
        sections: [
            {
                label: 'Atividade física:',
                key: 'exercise_freq',
                type: 'radio',
                options: ['Sedentário', '1-2x por semana', '3-4x por semana', 'Todos os dias']
            },
            {
                label: 'Tipo de atividade física praticada:',
                key: 'exercise_type',
                type: 'checkbox',
                options: [
                    'Caminhada', 'Corrida', 'Musculação', 'Yoga / Pilates', 'Natação',
                    'Ciclismo', 'Dança', 'Esportes coletivos', 'Artes marciais', 'Nenhuma',
                ]
            },
            {
                label: 'Nível de atividade no trabalho:',
                key: 'work_activity',
                type: 'radio',
                options: ['Trabalho sentado (> 8h)', 'Alternado (sentado e em pé)', 'Trabalho em pé / físico']
            },
            {
                label: 'Como está seu ambiente de trabalho?',
                key: 'work_environment',
                type: 'checkbox',
                options: [
                    'Muito estressante', 'Relacionamentos difíceis', 'Excesso de responsabilidade',
                    'Medo de perder o emprego', 'Trabalho que não me realiza', 'Satisfeito com o trabalho'
                ]
            },
            {
                label: 'Hobbies e práticas de bem-estar:',
                key: 'wellbeing_practices',
                type: 'checkbox',
                options: [
                    'Meditação', 'Oração / Espiritualidade', 'Leitura', 'Jardinagem',
                    'Arte / Música', 'Natureza', 'Viagens', 'Culinária saudável',
                    'Autocuidado (banhos, massagem)', 'Nenhuma prática de relaxamento',
                ]
            }
        ]
    },

    goals: {
        title: 'Objetivos & Expectativas',
        icon: '🎯',
        sections: [
            {
                label: 'O que você busca com o uso de óleos essenciais?',
                key: 'goals',
                type: 'checkbox',
                options: [
                    'Reduzir o estresse e a ansiedade', 'Melhorar a qualidade do sono', 'Aliviar dores',
                    'Melhorar a digestão', 'Fortalecer a imunidade', 'Equilibrar hormônios',
                    'Emagrecer / controlar o metabolismo', 'Melhorar a pele e o cabelo',
                    'Aumentar a energia e disposição', 'Desintoxicar o organismo',
                    'Prevenir doenças naturalmente', 'Reduzir inflamações',
                    'Melhorar o desempenho cognitivo', 'Cuidado emocional profundo',
                    'Apoio à menopausa', 'Saúde para filhos / família',
                ]
            },
            {
                label: 'Qual é sua maior queixa de saúde HOJE?',
                key: 'main_complaint',
                type: 'textarea',
                placeholder: 'Descreva em suas palavras o principal problema que deseja resolver...'
            },
            {
                label: 'Como você ficou sabendo sobre terapias naturais / óleos essenciais?',
                key: 'referral_source',
                type: 'radio',
                options: ['Indicação de amiga', 'Redes sociais', 'Internet / YouTube', 'Médico / Terapeuta', 'Outra forma']
            },
            {
                label: 'Você já usou óleos essenciais antes?',
                key: 'previous_experience',
                type: 'radio',
                options: ['Nunca usei', 'Usei e gostei', 'Usei mas não tive resultado', 'Uso regularmente']
            },
            {
                label: 'Em uma escala de 1 a 5, seu comprometimento com a mudança de hábitos:',
                key: 'commitment_level',
                type: 'scale',
                max: 5,
                scaleLabel: ['Baixo', '', 'Médio', '', 'Alto']
            }
        ]
    }
};

/* ---- PROTOCOLS DATABASE ---- */
export const PROTOCOLS = {
    'Ansiedade': {
        icon: '🧘',
        description: 'Suporte emocional para equilibrar o sistema nervoso e promover calma profunda.',
        oils: ['Lavanda', 'Vetiver', 'Balance', 'Serenity', 'Bergamota'],
        application: 'Difusor (3 gotas) + tópico nas solas dos pés e pulsos. Use nos momentos de crise e ao deitar.',
        affirmation: 'Você merece paz. Seu sistema nervoso pode aprender a se regular.'
    },
    'Ansiedade generalizada': {
        icon: '🌊',
        description: 'Protocolo contínuo para manutenção da calma ao longo do dia.',
        oils: ['Serenity', 'Vetiver', 'Balance', 'Frankincense'],
        application: 'Difusor manhã e noite + tópico na nuca (diluído) + aromaterapia palmitar durante ataques.',
        affirmation: 'Sua mente pode descansar. Você está seguro agora.'
    },
    'Insônia (dificuldade de adormecer)': {
        icon: '🌙',
        description: 'Protocolo de relaxamento profundo para preparar o corpo e a mente para o sono.',
        oils: ['Lavanda', 'Serenity', 'Vetiver', 'Roman Chamomile'],
        application: 'Difusor no quarto 30min antes de dormir (4 gotas) + tópico nas plantas dos pés.',
        affirmation: 'O repouso é sagrado. Você pode soltar o dia e descansar profundamente.'
    },
    'Estresse crônico': {
        icon: '💆',
        description: 'Suporte para adaptação ao estresse e restauração do sistema adrenal.',
        oils: ['Adaptiv', 'Balance', 'Lavanda', 'Wild Orange', 'Frankincense'],
        application: 'Difusor contínuo + tópico no plexo solar + banho com 5 gotas de Lavanda.',
        affirmation: 'Você é capaz de atravessar isso. Seu corpo sabe se restaurar.'
    },
    'Esgotamento emocional (burnout)': {
        icon: '🔋',
        description: 'Restauração energética física e emocional. Protocolo de recuperação.',
        oils: ['Frankincense', 'Sandalwood', 'Balance', 'Copaiba'],
        application: 'Massagem nas costas (diluído em óleo carreador) + difusor Frankincense + banho quente.',
        affirmation: 'Você fez muito. Agora é hora de receber. Permita-se ser restaurada.'
    },
    'Depressão': {
        icon: '🌻',
        description: 'Suporte emocional e nutricional para elevação do humor e vitalidade.',
        oils: ['Wild Orange', 'Elevation', 'Bergamota', 'Frankincense', 'InTune'],
        application: 'Difusor + aromaterapia palmitar + tópico nos pontos de pulso. Pela manhã ao acordar.',
        affirmation: 'A luz existe dentro de você. Este protocolo abre o caminho para ela emergir.'
    },
    'Dores de cabeça frequentes': {
        icon: '🤕',
        description: 'Alívio natural e rápido de cefaleias tensionais e de origem digestiva.',
        oils: ['Peppermint', 'Lavanda', 'Deep Blue', 'PastTense'],
        application: 'Tópico nas têmporas e na nuca (SEMPRE diluído 1:3). Compress fria na testa com Lavanda.',
        affirmation: 'Seu corpo busca equilíbrio. Esta tensão pode ser liberada.'
    },
    'Enxaqueca': {
        icon: '⚡',
        description: 'Protocolo de prevenção e alívio para crises de enxaqueca.',
        oils: ['PastTense', 'Peppermint', 'Lavanda', 'Copaiba'],
        application: 'Ao primeiro sinal: PastTense na têmporas + Peppermint inalado + deitar em ambiente escuro.',
        affirmation: 'Sua dor merece cuidado. Suporte natural pode fazer a diferença.'
    },
    'Acne / Espinhas frequentes': {
        icon: '🌱',
        description: 'Equilíbrio da microbiota da pele e controle da inflamação.',
        oils: ['Tea Tree', 'Lavanda', 'Copaiba', 'Melaleuca', 'Zendocrine'],
        application: 'Tópico (ponto a ponto) nas áreas afetadas. Diluir 1 gota em gel ou creme base neutro.',
        affirmation: 'Sua pele reflete o equilíbrio interno. Cuidar de dentro transforma o fora.'
    },
    'Fadiga crônica / cansaço constante': {
        icon: '⚡',
        description: 'Suporte mitocondrial e adrenal para restauração da energia vital.',
        oils: ['Wild Orange', 'Peppermint', 'Motive', 'Frankincense', 'Copaiba'],
        application: 'Difusor pela manhã (estimulante) + tópico nas solas dos pés + aromaterpia energizante.',
        affirmation: 'Energia é seu estado natural. Vamos restaurar esse equilíbrio juntos.'
    },
    'Refluxo / Azia': {
        icon: '🌿',
        description: 'Suporte ao sistema digestivo e redução da inflamação gástrica.',
        oils: ['DigestZen', 'Ginger', 'Peppermint', 'Fennel'],
        application: 'Tópico no epigástrio (diluído) + cápsula DigestZen + difusor Ginger.',
        affirmation: 'Seu sistema digestivo pode encontrar equilíbrio e conforto.'
    },
    'Inchaço abdominal frequente': {
        icon: '🫁',
        description: 'Alívio do desconforto abdominal e reequilíbrio da flora intestinal.',
        oils: ['DigestZen', 'Fennel', 'Ginger', 'Cardamom'],
        application: 'Massagem abdominal circular (sentido horário) com DigestZen diluído + uso interno (cápsula).',
        affirmation: 'Seu abdômen pode relaxar e encontrar seu ritmo natural.'
    },
    'Queda de cabelo': {
        icon: '💆',
        description: 'Estimulação circulatória e nutricional para fortalecer os fios.',
        oils: ['Cedarwood', 'Lavanda', 'Rosemary', 'Thyme'],
        application: 'Massagem no couro cabeludo com 5 gotas de cada em 30ml de óleo de jojoba. 3x por semana.',
        affirmation: 'Seus fios podem crescer fortes e saudáveis. Nutra-se por dentro e por fora.'
    },
    'Cólicas menstruais intensas': {
        icon: '🌸',
        description: 'Alívio das cólicas e equilibrio hormonal feminino.',
        oils: ['ClaryCalm', 'Lavanda', 'Copaiba', 'Whisper'],
        application: 'Tópico no abdômen inferior (diluído 1:4) + massagem circular + compress quente.',
        affirmation: 'Seu ciclo é sagrado. Seu corpo merece conforto e cuidado neste momento.'
    },
    'Menopausa em curso': {
        icon: '🦋',
        description: 'Suporte hormonal natural para amenizar os sintomas da menopausa.',
        oils: ['ClaryCalm', 'Phytoestrogen', 'Copaiba', 'Patchouli', 'Clary Sage'],
        application: 'Tópico nos pontos de pulso e interno das coxas + difusor noturno + banho com Patchouli.',
        affirmation: 'Esta transição é uma nova fase de florescimento. Você está se transformando.'
    },
    'Baixa libido': {
        icon: '🌹',
        description: 'Equilíbrio hormonal e reconexão emocional com o corpo.',
        oils: ['Whisper', 'Ylang Ylang', 'ClaryCalm', 'Sandalwood'],
        application: 'Tópico nos pulsos e pescoço + difusor íntimo + banho sensorial com Ylang Ylang.',
        affirmation: 'Seu corpo é um santuário de prazer. Reconecte-se com esse poder.'
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

    // Energy level analysis
    const energyLevel = answers.energy_level || 5;
    if (energyLevel <= 4) {
        problems.push({ severity: 'high', label: 'Baixa Energia / Fadiga' });
    }

    const stressLevel = answers.stress_level || 0;
    if (stressLevel >= 7) {
        problems.push({ severity: 'high', label: 'Estresse Elevado' });
    }

    const goals = answers.goals || [];
    return {
        mainSymptoms: allSymptoms.slice(0, 8),
        protocols: protocols.slice(0, 6),
        problems,
        goals,
        stressLevel,
        energyLevel,
        mainComplaint: answers.main_complaint || '',
    };
}
