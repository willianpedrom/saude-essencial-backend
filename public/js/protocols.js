/* ============================================================
   THERAPEUTIC PROTOCOLS
   Protocolos de uso de óleos essenciais por sintoma
   ============================================================ */

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
            { name: 'ZenGest', fn: 'Suporte digestivo completo' },
            { name: 'Ginger', fn: 'Anti-náusea e digestivo' },
            { name: 'Peppermint', fn: 'Alívio gástrico' },
        ],
        routine: {
            morning: ['1 gota de Lemon em água (detox suave)'],
            afternoon: ['ZenGest no abdômen após refeição (diluído)'],
            night: ['Ginger em cápsula ou chá'],
        },
        expectedResults: 'Redução do refluxo e azia, melhora na digestão e conforto gástrico.',
        affirmation: 'Seu sistema digestivo pode encontrar equilíbrio.',
    },
    'Inchaço abdominal': {
        focus: 'Eixo Digestivo', icon: '🫁',
        therapeuticObjective: 'Alívio do desconforto abdominal e reequilíbrio da flora intestinal.',
        oils: [
            { name: 'ZenGest', fn: 'Suporte digestivo e alívio de gases' },
            { name: 'Fennel', fn: 'Redução de gases e inchaço' },
            { name: 'Ginger', fn: 'Motilidade gástrica' },
        ],
        routine: {
            morning: ['Lemon em água morna'],
            afternoon: ['ZenGest massagem abdominal circular após almoço'],
            night: ['Fennel no abdômen (diluído)'],
        },
        expectedResults: 'Redução do inchaço, melhor evacuação e conforto abdominal.',
        affirmation: 'Seu abdômen pode relaxar e encontrar seu ritmo natural.',
    },
    'Gastrite': {
        focus: 'Eixo Digestivo', icon: '🌿',
        therapeuticObjective: 'Redução da inflamação gástrica e proteção da mucosa.',
        oils: [
            { name: 'ZenGest', fn: 'Suporte digestivo' },
            { name: 'Copaiba', fn: 'Anti-inflamatório da mucosa' },
            { name: 'Frankincense', fn: 'Regeneração celular' },
        ],
        routine: {
            morning: ['Copaiba sublingual em jejum'],
            afternoon: ['ZenGest no abdômen após refeições'],
            night: ['Frankincense sublingual'],
        },
        expectedResults: 'Redução da inflamação gástrica e alívio dos sintomas.',
        affirmation: 'Seu estômago merece cuidado e atenção.',
    },
    'Constipação': {
        focus: 'Eixo Digestivo', icon: '🌿',
        therapeuticObjective: 'Estimular motilidade intestinal de forma natural.',
        oils: [
            { name: 'ZenGest', fn: 'Ativação da motilidade' },
            { name: 'Ginger', fn: 'Aquecimento e estimulação digestiva' },
            { name: 'Lemon', fn: 'Detox e estimulação intestinal' },
        ],
        routine: {
            morning: ['1 gota de Lemon em água morna ao acordar', 'ZenGest no abdômen'],
            afternoon: ['Ginger após almoço (diluído no abdômen)'],
            night: ['Massagem abdominal circular com ZenGest'],
        },
        expectedResults: 'Regularização do trânsito intestinal e maior conforto.',
        affirmation: 'Seu intestino pode funcionar naturalmente.',
    },
    'Emagrecer / metabolismo': {
        focus: 'Eixo Metabólico', icon: '⚖️',
        therapeuticObjective: 'Desintoxicação sistêmica, controle da compulsão alimentar e aceleração do metabolismo basal.',
        oils: [
            { name: 'MetaPWR', fn: 'Apoio metabólico e controle de apetite' },
            { name: 'Toranja', fn: 'Drenagem linfática e redução de compulsão' },
            { name: 'Lemon', fn: 'Detox corporal profundo' },
            { name: 'Peppermint', fn: 'Energia e redução da vontade de doces' },
        ],
        routine: {
            morning: ['2 gotas de Lemon em jejum com água', '2 gotas de MetaPWR antes do café da manhã'],
            afternoon: ['Peppermint inalado para barrar desejos por doce', 'Toranja diluída em óleo de coco massageada no abdômen'],
            night: ['Evitar estimulantes, manter hidratação apenas'],
        },
        expectedResults: 'Aceleração da queima metabólica, diminuição visível do inchaço e retenção de líquidos, e redução natural na vontade de comer doces.',
        affirmation: 'Seu corpo responde a cada bom hábito. Você está no controle das suas escolhas.',
    },
    'Acne / Espinhas frequentes': {
        focus: 'Eixo Pele', icon: '🌱',
        therapeuticObjective: 'Equilíbrio da microbiota cutânea e controle da inflamação.',
        oils: [
            { name: 'Melaleuca', fn: 'Antisséptico e antibacteriano' },
            { name: 'Lavanda', fn: 'Anti-inflamatório e cicatrizante' },
            { name: 'Copaiba', fn: 'Modulação inflamatória' },
        ],
        routine: {
            morning: ['Melaleuca ponto a ponto nas áreas afetadas'],
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
    'Aumentar performance física': {
        focus: 'Eixo Energético e Performance', icon: '🚀',
        therapeuticObjective: 'Aumento expressivo da disposição física e mental, fortalecimento da imunidade e rápida recuperação celular e muscular.',
        oils: [
            { name: 'VM Complex', fn: 'Preenche lacunas nutricionais e estimula metabolismo' },
            { name: 'Creatina Lifepower', fn: 'Aumento de força e energia celular (ATP)' },
            { name: 'Copaíba Pastilha', fn: 'Controle inflamatório e antioxidante sistêmico' },
        ],
        routine: {
            morning: ['2 cápsulas de VM Complex com o café da manhã (absorção com gorduras boas)'],
            afternoon: ['1 porção de Creatina Lifepower (3,5g em água) como bebida revigorante ou pré-treino'],
            night: ['1 a 2 pastilhas de Copaíba Pastilha no meio da tarde ou pós-treino para recuperação muscular'],
        },
        expectedResults: 'Disposição sustentada ao longo do dia, melhor recuperação pós-esforço e modulação do estresse.',
        affirmation: 'A verdadeira performance vem de nutrir o corpo com o que ele precisa. Você é imparável.',
    },
    'Acelerar recuperação muscular': {
        focus: 'Eixo Energético e Performance', icon: '🚀',
        therapeuticObjective: 'Aumento expressivo da disposição física e mental, fortalecimento da imunidade e rápida recuperação celular e muscular.',
        oils: [
            { name: 'VM Complex', fn: 'Preenche lacunas nutricionais e estimula metabolismo' },
            { name: 'Creatina Lifepower', fn: 'Aumento de força e energia celular (ATP)' },
            { name: 'Copaíba Pastilha', fn: 'Controle inflamatório e antioxidante sistêmico' },
        ],
        routine: {
            morning: ['2 cápsulas de VM Complex com o café da manhã (absorção com gorduras boas)'],
            afternoon: ['1 porção de Creatina Lifepower (3,5g em água) como bebida revigorante ou pré-treino'],
            night: ['1 a 2 pastilhas de Copaíba Pastilha no meio da tarde ou pós-treino para recuperação muscular'],
        },
        expectedResults: 'Disposição sustentada ao longo do dia, melhor recuperação pós-esforço e modulação do estresse.',
        affirmation: 'A verdadeira performance vem de nutrir o corpo com o que ele precisa. Você é imparável.',
    },
    'Falta de força/energia para exercícios': {
        focus: 'Eixo Energético e Performance', icon: '🚀',
        therapeuticObjective: 'Aumento expressivo da disposição física e mental, fortalecimento da imunidade e rápida recuperação celular e muscular.',
        oils: [
            { name: 'VM Complex', fn: 'Preenche lacunas nutricionais e estimula metabolismo' },
            { name: 'Creatina Lifepower', fn: 'Aumento de força e energia celular (ATP)' },
            { name: 'Copaíba Pastilha', fn: 'Controle inflamatório e antioxidante sistêmico' },
        ],
        routine: {
            morning: ['2 cápsulas de VM Complex com o café da manhã (absorção com gorduras boas)'],
            afternoon: ['1 porção de Creatina Lifepower (3,5g em água) como bebida revigorante ou pré-treino'],
            night: ['1 a 2 pastilhas de Copaíba Pastilha no meio da tarde ou pós-treino para recuperação muscular'],
        },
        expectedResults: 'Disposição sustentada ao longo do dia, melhor recuperação pós-esforço e modulação do estresse.',
        affirmation: 'A verdadeira performance vem de nutrir o corpo com o que ele precisa. Você é imparável.',
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
            { name: 'Melaleuca', fn: 'Controle da oleosidade e antisséptico' },
            { name: 'Geranium', fn: 'Equilíbrio da produção de sebo' },
            { name: 'Lavanda', fn: 'Anti-inflamatório suave' },
        ],
        routine: {
            morning: ['Geranium diluído em gel hidratante facial'],
            afternoon: [],
            night: ['Melaleuca + Lavanda em gel base neutro'],
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

    // --- PROTOCOLOS ESPECÍFICOS EBOOKS ---

    'Enjoos na gravidez': {
        focus: 'Gestação Mamãe', icon: '🤢',
        therapeuticObjective: 'Alívio natural de náuseas e enjoos matinais.',
        oils: [
            { name: 'Gengibre', fn: 'Digestivo e anti-enjoo' },
            { name: 'Lemon', fn: 'Refrescante e purificante' },
            { name: 'Bergamota', fn: 'Equilíbrio emocional e digestivo' },
            { name: 'Cardamomo', fn: 'Suporte digestivo suave' },
        ],
        routine: {
            morning: ['Inalação direta de Lemon (concha com as mãos)'],
            afternoon: ['Inalação de Gengibre se houver enjoo'],
            night: ['Difusor ultrassônico com Bergamota'],
        },
        safety: 'Uso aromático e tópico diluído a 2%. Evitar ingestão na gestação.',
        expectedResults: 'Redução das náuseas e maior conforto digestivo.',
        affirmation: 'Seu corpo está gerando vida. Cada pausa para respirar traz alívio.',
    },
    'Sono na gravidez': {
        focus: 'Gestação Mamãe', icon: '😴',
        therapeuticObjective: 'Promoção de sono reparador e redução da ansiedade noturna.',
        oils: [
            { name: 'Lavanda', fn: 'Calmante e relaxante' },
            { name: 'Ylang Ylang', fn: 'Equilíbrio emocional' },
            { name: 'Wild Orange', fn: 'Redução da ansiedade' },
            { name: 'Vetiver', fn: 'Aterramento e sono profundo' },
        ],
        routine: {
            morning: ['Wild Orange no difusor'],
            afternoon: ['Ylang Ylang nos pulsos'],
            night: ['Lavanda + Vetiver nas solas dos pés (diluído)', 'Lavanda no difusor'],
        },
        safety: 'Diluição a 2%. Evitar aplicação no abdômen.',
        expectedResults: 'Sono mais profundo e despertar com disposição.',
        affirmation: 'Você e seu bebê merecem um descanso sagrado.',
    },
    'Estrias na gravidez': {
        focus: 'Gestação Mamãe', icon: '✨',
        therapeuticObjective: 'Eloasticidade da pele e prevenção de marcas.',
        oils: [
            { name: 'Lavanda', fn: 'Regeneração tecidual' },
            { name: 'Frankincense', fn: 'Saúde celular da pele' },
            { name: 'Helichrysum', fn: 'Cicatrizante potente' },
        ],
        routine: {
            morning: ['Massagem nas áreas de interesse com diluição a 2%'],
            afternoon: [],
            night: ['Massagem após o banho com Frankincense e Lavanda'],
        },
        safety: 'Sempre diluir em óleo vegetal de boa qualidade (Amêndoas ou Coco).',
        expectedResults: 'Pele mais hidratada e redução na aparência de marcas.',
        affirmation: 'Sua pele é resiliente e se transforma com amor.',
    },
    'Retenção de líquidos na gravidez': {
        focus: 'Gestação Mamãe', icon: '🦵',
        therapeuticObjective: 'Drenagem linfática e alívio do inchaço gestacional.',
        oils: [
            { name: 'Wild Orange', fn: 'Drenagem e alegria' },
            { name: 'Grapefruit', fn: 'Estimulante linfático' },
            { name: 'Tangerina', fn: 'Dreno e detox' },
            { name: 'Lemon', fn: 'Purificante' },
        ],
        routine: {
            morning: ['Massagem ascendente nas pernas (diluído)'],
            afternoon: ['Escalda-pés com 4 gotas de Lemon'],
            night: ['Massagem relaxante nos pés com Tangerina'],
        },
        safety: 'Óleos cítricos: após uso tópico, evitar sol por 12h.',
        expectedResults: 'Pele mais firme e leveza nas pernas.',
        affirmation: 'Seu corpo flui em harmonia com a vida.',
    },

    // --- SINERGIAS ESPECIAIS (ROLL-ONS) ---

    'Equilíbrio Emocional (Sinergia)': {
        focus: 'Sinergia Terapêutica', icon: '⚖️',
        therapeuticObjective: 'Estabilizar emoções e reduzir ansiedade crônica.',
        oils: [
            { name: 'Lavanda', fn: '8 gotas' },
            { name: 'Vetiver', fn: '5 gotas' },
            { name: 'Lemongrass', fn: '5 gotas' },
        ],
        routine: {
            morning: ['Aplicar roll-on nos pulsos'],
            afternoon: ['Aplicar na nuca em momentos de agitação'],
            night: ['Inalar profundamente da palma das mãos'],
        },
        instructions: 'Misturar em frasco roll-on de 10ml e completar com Óleo de Coco.',
        expectedResults: 'Sentimento de calma constante e maior resiliência.',
        affirmation: 'Eu estou no controle da minha paz interior.',
    },
    'Foco e Concentração (Sinergia)': {
        focus: 'Sinergia Terapêutica', icon: '🎯',
        therapeuticObjective: 'Clareza mental e produtividade prolongada.',
        oils: [
            { name: 'Lemongrass', fn: '5 gotas (Clareza mental)' },
            { name: 'Peppermint', fn: '5 gotas (Alerta)' },
            { name: 'Vetiver', fn: '3 gotas (Organização)' },
        ],
        routine: {
            morning: ['Aplicar nas têmporas e nuca antes de trabalhar'],
            afternoon: ['Inalar se sentir cansaço mental'],
            night: [],
        },
        instructions: 'Diluir em 10ml de óleo carreador.',
        expectedResults: 'Melhor foco em tarefas complexas e menos distração.',
        affirmation: 'Minha mente é livre e focada no que importa.',
    },

    'Psoríase': {
        focus: 'Pele e Autoimune', icon: '🩸',
        therapeuticObjective: 'Redução da inflamação sistêmica, modulação imune e cicatrização da pele.',
        oils: [
            { name: 'Copaiba', fn: 'Anti-inflamatório sistêmico forte' },
            { name: 'Frankincense', fn: 'Regenerador celular' },
            { name: 'Melaleuca', fn: 'Antisséptico e calmante tópico' },
            { name: 'Lavanda', fn: 'Alívio de coceira e tensão' }
        ],
        routine: {
            morning: ['2 gotas de Copaíba sublingual', 'Mistura Tópica (Frankincense + Lavanda) nas áreas afetadas'],
            afternoon: ['Frankincense sublingual', 'Reaplicar Mistura Tópica se houver crise'],
            night: ['2 gotas de Copaíba sublingual', 'Melaleuca nas lesões antes de dormir'],
        },
        expectedResults: 'Diminuição da vermelhidão, alívio da coceira e melhora na descamação.',
        affirmation: 'Meu corpo está se curando de dentro para fora.',
    },
    'Dermatite atópica': {
        focus: 'Pele e Autoimune', icon: '🩸',
        therapeuticObjective: 'Hidratação profunda, redução da coceira e controle inflamatório.',
        oils: [
            { name: 'Lavanda', fn: 'Calmante da pele' },
            { name: 'Melaleuca', fn: 'Proteção contra infecções secundárias' },
            { name: 'Frankincense', fn: 'Renovação da barreira cutânea' }
        ],
        routine: {
            morning: ['Mistura Tópica (Lavanda + Frankincense em carreador) após o banho'],
            afternoon: ['Lavanda aromático para controle do estresse (gatilho)'],
            night: ['Melaleuca + Lavanda nas áreas de maior coceira'],
        },
        expectedResults: 'Alívio rápido da coceira e regeneração da barreira da pele.',
        affirmation: 'Minha pele está protegida, calma e saudável.',
    },
    'Alergia na pele': {
        focus: 'Pele e Imunidade', icon: '🤧',
        therapeuticObjective: 'Ação anti-histamínica natural e alívio rápido da irritação.',
        oils: [
            { name: 'Lavanda', fn: 'Anti-histamínico natural, alivia coceira' },
            { name: 'Peppermint', fn: 'Refresca e reduz vermelhidão' },
            { name: 'Melaleuca', fn: 'Limpeza e acalma a irritação' }
        ],
        routine: {
            morning: ['Uso tópico de Lavanda + Melaleuca no local da alergia'],
            afternoon: ['Inalar Peppermint para oxigenação'],
            night: ['Lavanda no local afetado e na sola dos pés'],
        },
        expectedResults: 'Redução expressiva da urticária e coceira em minutos.',
        affirmation: 'Estou em harmonia com o meu ambiente.',
    },
    'Infecção de garganta': {
        focus: 'Imunidade e Combate', icon: '🛡️',
        therapeuticObjective: 'Combate direto a patógenos, alívio da dor e suporte imunológico.',
        oils: [
            { name: 'On Guard', fn: 'Suporte imunológico forte' },
            { name: 'Melaleuca', fn: 'Antisséptico e combate infecções' },
            { name: 'Lemon', fn: 'Limpeza e detox linfático' }
        ],
        routine: {
            morning: ['Gargarejo com 1 gota de On Guard + 1 gota de Melaleuca (em água quente, cuspir)'],
            afternoon: ['1 gota de Lemon na água para beber'],
            night: ['On Guard diluído aplicado externamente no pescoço/gânglios'],
        },
        expectedResults: 'Alívio da dor ao engolir e combate rápido da infecção.',
        affirmation: 'Meu corpo tem força para expulsar o que não me serve.',
    },
    'Autismo': {
        focus: 'Sistema Nervoso e Foco', icon: '🧩',
        therapeuticObjective: 'Modulação sensorial, redução de hiperatividade e suporte emocional/foco.',
        oils: [
            { name: 'Vetiver', fn: 'Aterramento profundo, foco' },
            { name: 'Frankincense', fn: 'Oxigenação cerebral e calma' },
            { name: 'Lavanda', fn: 'Redução de crises e ansiedade' }
        ],
        routine: {
            morning: ['Frankincense sublingual or nuca', 'Vetiver na sola dos pés antes da escola/terapia'],
            afternoon: ['Lavanda no difusor para transições e momentos de estresse'],
            night: ['Massagem nos pés com Lavanda + Vetiver para induzir sono profundo'],
        },
        expectedResults: 'Maior presença, menos episódios de desregulação sensorial e sono reparador.',
        affirmation: 'Eu me sinto seguro e presente no meu corpo.',
    },
    'Dores na coluna': {
        focus: 'Eixo Físico e Dor', icon: '🦴',
        therapeuticObjective: 'Redução da inflamação nervosa, relaxamento muscular profundo.',
        oils: [
            { name: 'Deep Blue', fn: 'Mix analgésico' },
            { name: 'Copaiba', fn: 'Potencializador analgésico e anti-inflamatório' },
            { name: 'Frankincense', fn: 'Desinflamação celular' }
        ],
        routine: {
            morning: ['2 gotas de Copaíba sublingual', 'Massagem local com Deep Blue + Copaíba'],
            afternoon: ['Deep Blue na coluna lombar/cervical se houver pico de dor'],
            night: ['Copaíba sublingual + Massagem nas costas antes de dormir'],
        },
        expectedResults: 'Redução da dor crônica, maior mobilidade e alívio de tensões.',
        affirmation: 'Minha coluna me sustenta com força e flexibilidade.',
    },
    'Dores lombar': {
        focus: 'Eixo Físico e Dor', icon: '🦴',
        therapeuticObjective: 'Redução da inflamação nervosa, relaxamento muscular profundo.',
        oils: [
            { name: 'Deep Blue', fn: 'Mix analgésico' },
            { name: 'Copaiba', fn: 'Potencializador analgésico e anti-inflamatório' },
            { name: 'Frankincense', fn: 'Desinflamação celular' }
        ],
        routine: {
            morning: ['2 gotas de Copaíba sublingual', 'Massagem local com Deep Blue + Copaíba'],
            afternoon: ['Deep Blue na coluna lombar se houver pico de dor'],
            night: ['Copaíba sublingual + Massagem na lombar antes de dormir'],
        },
        expectedResults: 'Redução da dor crônica, maior mobilidade e alívio de tensões.',
        affirmation: 'Eu solto os pesos que não preciso carregar.',
    },
    'Dores articulares': {
        focus: 'Eixo Físico e Dor', icon: '🦴',
        therapeuticObjective: 'Desinflamação das articulações e suporte de cartilagem.',
        oils: [
            { name: 'Deep Blue', fn: 'Analgésico e refrescante' },
            { name: 'Copaiba', fn: 'Reduz inflamação articular' },
            { name: 'Frankincense', fn: 'Suporte celular' }
        ],
        routine: {
            morning: ['Massagem direta nos joelhos/ombros com Deep Blue e Copaíba'],
            afternoon: ['Copaíba sublingual (2 gotas)'],
            night: ['Massagem noturna nas articulações afetadas'],
        },
        expectedResults: 'Menos rigidez matinal e alívio da dor na movimentação.',
        affirmation: 'Eu me movo com graça, facilidade e sem dor.',
    },
    'Dores em Geral no corpo': {
        focus: 'Eixo Físico e Dor', icon: '🦴',
        therapeuticObjective: 'Alívio sistêmico da dor muscular e tensão.',
        oils: [
            { name: 'Deep Blue', fn: 'Alívio muscular' },
            { name: 'Copaiba', fn: 'Modulador de dor sistêmica' },
            { name: 'Peppermint', fn: 'Refresca e tira a tensão' }
        ],
        routine: {
            morning: ['Copaíba sublingual', 'Deep Blue + Peppermint nos músculos mais tensos'],
            afternoon: ['Peppermint inalado para energia e alívio de tensões'],
            night: ['Escalda pés com Lavanda e Copaíba para relaxamento global'],
        },
        expectedResults: 'Relaxamento muscular e diminuição da dor difusa.',
        affirmation: 'Meu corpo está relaxado e livre de tensões.',
    },
    'Fibromialgia': {
        focus: 'Dor e Sistema Nervoso', icon: '💜',
        therapeuticObjective: 'Modulação central da dor, relaxamento muscular e melhora do sono.',
        oils: [
            { name: 'Copaiba', fn: 'Atua nos receptores endocanabinoides para dor' },
            { name: 'Frankincense', fn: 'Neuroprotetor e anti-inflamatório' },
            { name: 'Lavanda', fn: 'Reduz a sensibilidade à dor e induz sono' },
            { name: 'Deep Blue', fn: 'Alívio tópico para pontos gatilho' }
        ],
        routine: {
            morning: ['2 gotas de Copaíba + 2 gotas de Frankincense sublingual'],
            afternoon: ['Massagem nos pontos doloridos com Deep Blue'],
            night: ['Lavanda no difusor', '2 gotas de Copaíba sublingual para aprofundar o sono'],
        },
        expectedResults: 'Menos crises agudas, controle da dor neuropática e sono mais profundo.',
        affirmation: 'Eu honro o ritmo do meu corpo e encontro o alívio.',
    },
    'Pressão alta': {
        focus: 'Cardiovascular e Relaxamento', icon: '❤️',
        therapeuticObjective: 'Vasodilatação natural, redução do estresse e equilíbrio simpático.',
        oils: [
            { name: 'Ylang Ylang', fn: 'Hipotensivo natural e calmante' },
            { name: 'Lavanda', fn: 'Reduz o estresse e ansiedade' },
            { name: 'Lemon', fn: 'Desintoxicante e apoio vascular' }
        ],
        routine: {
            morning: ['1 gota de Lemon na água', 'Ylang Ylang inalado ou no peito (diluído)'],
            afternoon: ['Lavanda inalado em momentos de tensão'],
            night: ['Ylang Ylang + Lavanda no peito e sola dos pés'],
        },
        expectedResults: 'Apoio na manutenção da pressão equilibrada e calma profunda.',
        affirmation: 'Meu coração bate em um ritmo calmo e seguro.',
    },
    'Rinite': {
        focus: 'Respiratório e Alergia', icon: '🌬️',
        therapeuticObjective: 'Ação anti-histamínica e desobstrução rápida.',
        oils: [
            { name: 'Peppermint', fn: 'Abertura das vias aéreas' },
            { name: 'Lavanda', fn: 'Anti-histamínico' },
            { name: 'Lemon', fn: 'Limpeza e quebra de muco' }
        ],
        routine: {
            morning: ['Mix ALR (Lemon, Lavanda, Peppermint) inalado ou 1 gota de cada em água'],
            afternoon: ['Peppermint inalado nas mãos ao longo do dia'],
            night: ['Lavanda no difusor e Peppermint na ponta do nariz (diluído)'],
        },
        expectedResults: 'Fim dos espirros, coriza contida e respiração livre.',
        affirmation: 'Eu respiro a vida de forma plena e limpa.',
    },
    'Sinusite': {
        focus: 'Respiratório e Alergia', icon: '🌬️',
        therapeuticObjective: 'Combate à infecção local, drenagem de muco e alívio da pressão no rosto.',
        oils: [
            { name: 'Melaleuca', fn: 'Antisséptico nasal' },
            { name: 'Peppermint', fn: 'Descongestionante analgésico' },
            { name: 'Oregano', fn: 'Antibiótico natural forte (se infecção)' }
        ],
        routine: {
            morning: ['Massagem na face (seios nasais) com Melaleuca + Peppermint diluídos (longe dos olhos)'],
            afternoon: ['Inalação de Peppermint no vaporizador ou copo dágua quente'],
            night: ['Melaleuca na sola dos pés e no peito'],
        },
        expectedResults: 'Drenagem do muco espesso e alívio da dor de cabeça frontal.',
        affirmation: 'Minha mente está clara e minha respiração flui.',
    },
    'Imunidade': {
        focus: 'Imunidade e Combate', icon: '🛡️',
        therapeuticObjective: 'Elevação da resposta imune celular, proteção contra patógenos.',
        oils: [
            { name: 'On Guard', fn: 'O mix protetor do sistema imune' },
            { name: 'Lemon', fn: 'Detox e vitamina C natural' },
            { name: 'Frankincense', fn: 'Apoio celular profundo' }
        ],
        routine: {
            morning: ['1 gota de On Guard na água ou sublingual', '1 gota de Lemon na água'],
            afternoon: ['On Guard no difusor do ambiente'],
            night: ['Frankincense sublingual', 'On Guard na sola dos pés'],
        },
        expectedResults: 'Corpo resistente a gripes sazonais, menos dias de adoecimento.',
        affirmation: 'Meu sistema imunológico é um escudo forte e impenetrável.',
    },
    'Gripe e resfriado': {
        focus: 'Imunidade e Combate', icon: '🛡️',
        therapeuticObjective: 'Ataque direto a vírus, quebra de muco e alívio dos sintomas.',
        oils: [
            { name: 'On Guard', fn: 'Combate imunológico' },
            { name: 'Breathe', fn: 'Descongestionante respiratório' },
            { name: 'Melaleuca', fn: 'Limpeza antiviral/antifúngica' },
            { name: 'Peppermint', fn: 'Baixa a febre e abre vias' }
        ],
        routine: {
            morning: ['On Guard sublingual ou em cápsula', 'Breathe inalado e no peito'],
            afternoon: ['Peppermint inalado (ou ao longo da espinha se tiver febre)'],
            night: ['Breathe no difusor', 'Melaleuca + On Guard na sola dos pés'],
        },
        expectedResults: 'Recuperação expressa (cortando o ciclo do vírus pela metade do tempo).',
        affirmation: 'Cada célula do meu corpo se regenera rapidamente.',
    },
    'Queda capilar': {
        focus: 'Beleza e Estética', icon: '💆‍♀️',
        therapeuticObjective: 'Estimulação do folículo piloso, limpeza do couro cabeludo e ancoragem.',
        oils: [
            { name: 'Rosemary', fn: 'Estímulo circulatório e capilar' },
            { name: 'Peppermint', fn: 'Oxigenação do folículo' },
            { name: 'Lavanda', fn: 'Acalma inflamação do couro cabeludo' }
        ],
        routine: {
            morning: ['Adicionar 2 gotas de Rosemary + 1 de Peppermint no shampoo no banho'],
            afternoon: ['Massagear o couro cabeludo a seco por 1 minuto'],
            night: ['Tônico noturno: água com Rosemary e Lavanda spray no couro cabeludo'],
        },
        expectedResults: 'Nascimento de novos fios (baby hair) em 30 dias e redução de queda.',
        affirmation: 'Minhas raízes são fortes e cheias de vida.',
    },
    'Pele com manchas melasma': {
        focus: 'Beleza e Estética', icon: '✨',
        therapeuticObjective: 'Regeneração celular, clareamento gradual e proteção antioxidante.',
        oils: [
            { name: 'Copaiba', fn: 'Reduz inflamação celular causadora da mancha' },
            { name: 'Frankincense', fn: 'Regenerador e despigmentante natural' },
            { name: 'Lavanda', fn: 'Acalma a pele sensibilizada' }
        ],
        routine: {
            morning: ['2 gotas de Copaíba sublingual', 'Sempre usar protetor solar'],
            afternoon: ['Hidratação leve'],
            night: ['Sérum noturno: Óleo carreador + Frankincense + Copaíba aplicado nas manchas'],
        },
        expectedResults: 'Clareamento suave das bordas do melasma e tom de pele uniformizado.',
        affirmation: 'Minha pele é um reflexo da minha saúde radiante.',
    },
    'Rugas e linhas de expressão': {
        focus: 'Beleza e Estética', icon: '✨',
        therapeuticObjective: 'Estímulo de colágeno, renovação celular e firmeza (Botox natural).',
        oils: [
            { name: 'Frankincense', fn: 'Rei dos óleos para anti-aging' },
            { name: 'Copaiba', fn: 'Antioxidante potente' },
            { name: 'Lavanda', fn: 'Tônico cutâneo relaxante' }
        ],
        routine: {
            morning: ['Frankincense + creme hidratante facial antes do filtro solar'],
            afternoon: ['Beber bastante água aromatizada com Lemon (colágeno)'],
            night: ['Sérum anti-idade: Óleo carreador + Frankincense + Lavanda no rosto e pescoço'],
        },
        expectedResults: 'Pele viçosa, preenchimento de linhas finas e redução de bolsas.',
        affirmation: 'Eu aceito minha idade com beleza e vitalidade.',
    },
    'Envelhecimento do corpo': {
        focus: 'Saúde Sistêmica e Longevidade', icon: '🧬',
        therapeuticObjective: 'Redução do estresse oxidativo, suporte celular e longevidade metabólica.',
        oils: [
            { name: 'Frankincense', fn: 'Reparo de DNA e vitalidade celular' },
            { name: 'Copaiba', fn: 'Protetor neural e sistêmico' },
            { name: 'Turmeric', fn: 'Combate oxidação (se disponível, ou suplemento)' }
        ],
        routine: {
            morning: ['Frankincense + Copaíba sublingual todas as manhãs'],
            afternoon: ['Massagem no corpo pós banho com óleo hidratante e Copaíba'],
            night: ['Rotina do sono profunda para regeneração celular'],
        },
        expectedResults: 'Mais disposição, pele do corpo mais firme e saúde celular blindada.',
        affirmation: 'Eu rejuvenesço e me renovo a cada dia.',
    },
    'Lúpus': {
        focus: 'Autoimune e Imunomodulação', icon: '🧬',
        therapeuticObjective: 'Modulação severa da resposta imune, controle de inflamação e dor articular.',
        oils: [
            { name: 'Copaiba', fn: 'Imunomodulador que NÃO hiperestimula (ideal)' },
            { name: 'Frankincense', fn: 'Redutor de estresse celular profundo' },
            { name: 'Deep Blue', fn: 'Para dor articular associada' }
        ],
        routine: {
            morning: ['2 gotas de Copaíba + Frankincense sublingual (rotina diária sagrada)'],
            afternoon: ['Deep Blue Rub nas articulações se houver dor aguda'],
            night: ['Massagem relaxante com Lavanda para controle do estresse (gatilho autoimune)'],
        },
        expectedResults: 'Menor frequência e gravidade de surtos inflamatórios e melhora das dores.',
        affirmation: 'Meu sistema imunológico atua com sabedoria e equilíbrio.',
    },
    'Emagrecimento': {
        focus: 'Eixo Metabólico', icon: '🔥',
        therapeuticObjective: 'Aceleração de metabolismo basal, controle de compulsão por doces e drenagem.',
        oils: [
            { name: 'Smart & Sassy / MetaPWR', fn: 'O mix metabólico' },
            { name: 'Lemon', fn: 'Quebra de toxinas gordurosas e detox' },
            { name: 'Peppermint', fn: 'Controle de saciedade e energia' }
        ],
        routine: {
            morning: ['2 gotas de Smart&Sassy/MetaPWR + 1 gota de Lemon na água de jejum'],
            afternoon: ['Inalar Peppermint ou Smart&Sassy 15min antes do almoço e no meio da tarde para inibir vontade de doce'],
            night: ['Não tomar cítricos antes de dormir se atrapalhar o sono, focar em Lavanda para ansiedade alimentar'],
        },
        expectedResults: 'Fim do inchaço, controle do apetite por doces e energia para treinar.',
        affirmation: 'Meu metabolismo trabalha a meu favor com velocidade e saúde.',
    },
    'Colesterol alto': {
        focus: 'Cardiovascular e Hepático', icon: '❤️',
        therapeuticObjective: 'Apoio hepático para metabolização de lipídios e detox.',
        oils: [
            { name: 'Zendocrine', fn: 'Mix de detox hepático' },
            { name: 'Lemon', fn: 'Limpeza de toxinas' },
            { name: 'Rosemary', fn: 'Estimula a função hepática e circulação' }
        ],
        routine: {
            morning: ['1 gota de Lemon + 1 gota de Zendocrine na água (suporte detox)'],
            afternoon: ['Alimentação focada em fibras'],
            night: ['Massagem com Zendocrine na região do fígado (lado direito do abdômen)'],
        },
        expectedResults: 'Apoio no controle de perfil lipídico (uso paralelo aos hábitos saudáveis).',
        affirmation: 'Meu sangue flui limpo e minhas células respiram pureza.',
    },
    'Cálculo renal': {
        focus: 'Detoxificação e Renal', icon: '💧',
        therapeuticObjective: 'Apoio à filtração renal, quebra suave de depósitos, prevenção inflamatória.',
        oils: [
            { name: 'Lemon', fn: 'Estimula a diurese e quebra de minerais acumulados' },
            { name: 'Zendocrine', fn: 'Limpeza dos órgãos de filtração' },
            { name: 'Copaiba', fn: 'Alívio sistêmico se houver desconforto' }
        ],
        routine: {
            morning: ['2 gotas de Lemon em jejum em um copo grande de água'],
            afternoon: ['Beber no mínimo 3L de água ao longo do dia com Lemon (1 gota por litro)'],
            night: ['Massagem na região lombar (rins) com Zendocrine e Copaíba diluídos'],
        },
        expectedResults: 'Maior volume e limpeza urinária, suporte na passagem/desintegração de microcálculos.',
        affirmation: 'Meus rins filtram perfeitamente tudo o que não me serve.',
    },
    'Cálculo vesícula': {
        focus: 'Hepático e Digestivo', icon: '💧',
        therapeuticObjective: 'Apoio ao fluxo biliar, desintoxicação e alívio de digestão lenta.',
        oils: [
            { name: 'Zendocrine', fn: 'Suporte completo a fígado e vesícula' },
            { name: 'Lemon', fn: 'Solvente natural e apoio biliar' },
            { name: 'ZenGest', fn: 'Para episódios de peso e má digestão' }
        ],
        routine: {
            morning: ['1 gota de Lemon + 1 de Zendocrine na água logo cedo'],
            afternoon: ['ZenGest tópico no abdômen (lado direito) após refeições gordurosas'],
            night: ['Massagem com Zendocrine na área do fígado antes de dormir'],
        },
        expectedResults: 'Digestão mais leve, alívio na sensação de empachamento após as refeições.',
        affirmation: 'Meu corpo processa e elimina com facilidade e harmonia.',
    },
    'Fadiga/cansaço físico e mental': {
        focus: 'Energia e Performance', icon: '🚀',
        therapeuticObjective: 'Estimulação celular (ATP), clareza cognitiva e oxigenação.',
        oils: [
            { name: 'Peppermint', fn: 'Energizante imediato e foco' },
            { name: 'Wild Orange', fn: 'Revigorante e alegria' },
            { name: 'Frankincense', fn: 'Energia celular de base' }
        ],
        routine: {
            morning: ['Frankincense sublingual', 'Inalar Peppermint + Wild Orange das mãos em concha'],
            afternoon: ['Peppermint na nuca ou no difusor para o slump das 15h'],
            night: ['Foco total no sono reparador (Lavanda) para não acumular fadiga no dia seguinte'],
        },
        expectedResults: 'Disposição sustentada sem a quebra (crash) causada pelo excesso de café.',
        affirmation: 'Sou guiado por uma energia infinita e renovável.',
    },
};
