const fs = require('fs');

const protocolsToAdd = `
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
            morning: ['Frankincense sublingual ou nuca', 'Vetiver na sola dos pés antes da escola/terapia'],
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
`;

const filePaths = [
    '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/public/js/data.js',
    '/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-crm/js/data.js'
];

filePaths.forEach(fp => {
    let content = fs.readFileSync(fp, 'utf8');
    // Inject right before "export function analyzeAnamnesis"
    // But since PROTOCOLS is an exported const object, the end of the object is a '};' right before 'export function analyzeAnamnesis'.
    
    // Find the end of PROTOCOLS object
    const analyzeIndex = content.indexOf('export function analyzeAnamnesis');
    if (analyzeIndex === -1) {
        console.error("Could not find analyzeAnamnesis in " + fp);
        return;
    }
    
    const insertionPoint = content.lastIndexOf('};', analyzeIndex);
    if (insertionPoint === -1) {
        console.error("Could not find end of PROTOCOLS object in " + fp);
        return;
    }

    const newContent = content.substring(0, insertionPoint) + protocolsToAdd + content.substring(insertionPoint);
    fs.writeFileSync(fp, newContent);
    console.log("Successfully injected protocols into", fp);
});

