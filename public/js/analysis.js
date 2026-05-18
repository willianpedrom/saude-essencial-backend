/* ============================================================
   ANALYSIS LOGIC
   Algoritmos de diagnóstico comportamental e físico
   ============================================================ */

import { PROTOCOLS } from './protocols.js?v=1007';
import { LIVING_KIT } from './oils.js?v=1007';

/**
 * Analisa as respostas da anamnese física e emocional
 */
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
        ...(answers.goals || []),
        ...(answers.child_health_symptoms || []),
        ...(answers.child_emotional_symptoms || []),
        ...(answers.child_routine || []),
        ...(answers.child_goals || []),
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

    const specialConditions = answers.special_conditions || [];
    const chronicConditions = answers.chronic_conditions || [];
    
    // SAFETY FILTERING (KNOWLEDGE FROM EBOOKS)
    const isPregnant = specialConditions.includes('Gestante');
    const isNursing = specialConditions.includes('Lactante');
    const isChild = specialConditions.some(c => c.includes('Criança'));
    const hasHypertension = chronicConditions.includes('Hipertensão') || specialConditions.includes('Hipertensão (Pressão Alta)');
    const hasEpilepsy = chronicConditions.includes('Epilepsia') || specialConditions.includes('Epilepsia');

    if (isPregnant || isNursing || isChild || hasHypertension || hasEpilepsy) {
        // List of oils to avoid (compiled from eBooks)
        let blockedOilsRegex = /Wintergreen|Gaultéria|Clary Sage|Sálvia|Alecrim|Rosemary|Manjericão|Basil|Tomilho|Thyme|Erva Doce|Fennel|Zimbro|Juniper|Cedro|Cedarwood|Cipreste|Cypress|Cravo|Clove|Coentro|Coriander|Jasmim|Jasmine|Manjerona|Marjoram|Mirra|Myrrh|Orégano|Oregano/i;
        
        if (isPregnant || isNursing) {
            blockedOilsRegex = new RegExp(blockedOilsRegex.source + '|Peppermint|Hortelã-pimenta|Hortelã pimenta', 'i');
        }
        if (isChild) {
            blockedOilsRegex = new RegExp(blockedOilsRegex.source + '|Eucalyptus|Eucalipto', 'i');
        }

        protocols.forEach(p => {
            // Remove contra-indicated oils
            if (p.oils) {
                p.oils = p.oils.filter(oil => !blockedOilsRegex.test(oil.name) && !blockedOilsRegex.test(oil.fn));
            }

            // Clean routine steps
            if (p.routine) {
                ['morning', 'afternoon', 'night'].forEach(period => {
                    if (p.routine[period]) {
                        p.routine[period] = p.routine[period].filter(step => !blockedOilsRegex.test(step));
                    }
                });
            }

            // Safe dilution alerts
            if (isPregnant) {
                p.safetyAlert = "Ajustado para gestantes: Diluição a 2% (4 gotas por 10ml). Evite o abdômen.";
            } else if (isChild) {
                p.safetyAlert = "Ajustado para crianças: Diluição a 1% (2 gotas por 10ml).";
            }
        });
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
        primaryAxis,
        isPregnant,
        isNursing,
        isChild
    };
}

/**
 * Analisa as respostas do perfil de negócio (DISC, Jung, Arquétipos)
 */
export function analyzeBusinessProfile(answers) {
    // 1. DISC Analysis (Action Style)
    const discAction = answers.disc_action || '';
    let discCode = 'D';
    if (discAction.includes('entusiasmo')) discCode = 'I';
    else if (discAction.includes('calma')) discCode = 'S';
    else if (discAction.includes('riscos')) discCode = 'C';

    const discTypes = {
        'D': { type: 'Executor', trait: 'Dominância', desc: 'Focado em resultados, direto e decisivo. Motivado por desafios, metas claras e poder de decisão.' },
        'I': { type: 'Comunicador', trait: 'Influência', desc: 'Entusiasmado, sociável e influente. Motivado por reconhecimento, conexões humanas e novas experiências.' },
        'S': { type: 'Planejador', trait: 'Estabilidade', desc: 'Calmo, confiável e metódico. Motivado por segurança, harmonia e estabilidade a longo prazo.' },
        'C': { type: 'Analista', trait: 'Cautela', desc: 'Preciso, detalhista e cauteloso. Motivado por qualidade, dados técnicos e perfeccionismo.' }
    };
    const disc = { code: discCode, ...discTypes[discCode] };

    // 2. Jung Analysis (Energy & Decisions)
    const energy = answers.jung_energy || '';
    const decisions = answers.jung_decisions || '';
    const isExtrovert = energy.includes('pessoas');
    const isLogical = decisions.includes('lógica');

    // 3. Archetype (Drive)
    const drive = answers.archetype_drive || '';
    let archetype = { name: 'O Herói', desc: 'Foco em superação e metas' };
    if (drive.includes('Ensinar')) archetype = { name: 'O Sábio', desc: 'Conhecimento e ensino' };
    else if (drive.includes('Proteger')) archetype = { name: 'O Cuidador', desc: 'Segurança e acolhimento' };
    else if (drive.includes('liberdade')) archetype = { name: 'O Criador', desc: 'Inovação e liberdade' };

    // 4. Leadership Potential
    const posture = answers.leadership_posture || '';
    const investment = answers.investment_posture || '';
    const readiness = answers.readiness || '';
    
    let leadershipScore = 50;
    if (posture.includes('confortável')) leadershipScore += 30;
    if (posture.includes('exemplo')) leadershipScore += 15;
    if (investment.includes('decidido')) leadershipScore += 15;
    if (readiness.includes('Imediatamente')) leadershipScore += 5;
    
    leadershipScore = Math.min(100, leadershipScore);
    const isPotentialLeader = leadershipScore >= 80;

    // 5. Communication Matrix
    const communicationMatrix = {
        'D': {
            toSay: 'Fale sobre resultados e bônus.',
            toAvoid: 'Não demore com detalhes.',
            closingStrategy: 'Venda a visão de topo.',
            hook: `Olá! Vi que você tem um perfil extremamente focado em resultados e metas. Tenho uma visão estratégica para te mostrar que vai direto ao ponto. Podemos falar?`,
            secret: 'Vença pelo desafio. Mostre que ela pode ser a melhor e que o sistema recompensa a velocidade.',
            approach: 'Seja direto. Mostre os números de ganho (Blue Diamond, Presidential Diamond). Fale de metas.',
            objection: 'Se disser que não tem tempo, diga: "Justamente por isso, dōTERRA vai te dar a liberdade que a CLT nunca deu".',
            motivations: ['💰 Lucratividade', '🏆 Desafios', '⚡ Rapidez', '📈 Poder'],
            voice: 'Rápido, firme e seguro. Não hesite.',
            strategicOil: { name: 'Adaptive', reason: 'Para gerenciar o estresse da alta performance e manter o equilíbrio nas decisões sob pressão.' },
            roadmap: [
                { stage: 'Abertura', task: 'Vá direto ao ponto. Sem "quebra-gelo" longo.' },
                { stage: 'Sondagem', task: 'Pergunte: "Quanto você quer ganhar nos próximos 6 meses?"' },
                { stage: 'Valor', task: 'Mostre o plano de carreira e o Poder de 3.' },
                { stage: 'Fechamento', task: 'Desafie-a: "Esse negócio é para quem decide rápido. Vamos?"' }
            ]
        },
        'I': {
            toSay: 'Fale sobre pessoas e reconhecimento.',
            toAvoid: 'Evite planilhas pesadas agora.',
            closingStrategy: 'Venda o estilo de vida.',
            hook: `Olá! Adorei seu perfil, você transmite muita energia! Vi que você valoriza conexão e reconhecimento. Tenho um projeto que é a sua cara. Topa conhecer?`,
            secret: 'Vença pelo entusiasmo. Fale de viagens, convenções, palco e o impacto social que ela terá.',
            approach: 'Conte histórias de sucesso. Fale de liberdade e de como o negócio é divertido e cheio de gente.',
            objection: 'Se tiver medo de vendas, diga: "Você não vai vender, você vai compartilhar sua energia e o que você ama".',
            motivations: ['🌟 Reconhecimento', '🤝 Conexões', '🎨 Criatividade', '✈️ Liberdade'],
            voice: 'Animado, expressivo e amigável. Use o nome dela.',
            strategicOil: { name: 'Motivate', reason: 'Para canalizar sua criatividade e entusiasmo em ações produtivas e foco em resultados consistentes.' },
            roadmap: [
                { stage: 'Abertura', task: 'Crie conexão emocional. Elogie a energia dela.' },
                { stage: 'Sondagem', task: 'Pergunte: "Como seria a sua vida com liberdade total de tempo?"' },
                { stage: 'Valor', task: 'Mostre fotos de viagens e eventos da equipe.' },
                { stage: 'Fechamento', task: 'Venda a diversão: "Você vai amar o nosso grupo. Vamos nessa?"' }
            ]
        },
        'S': {
            toSay: 'Fale sobre segurança e suporte.',
            toAvoid: 'Não pressione por decisão imediata.',
            closingStrategy: 'Venda o passo a passo.',
            hook: `Olá! Vi seu perfil e percebi que você valoriza segurança e um método passo a passo. Preparei um material bem estruturado para te mostrar como podemos crescer com estabilidade.`,
            secret: 'Vença pela confiança. Mostre que ela nunca estará sozinha e que temos um sistema de treinamento completo.',
            approach: 'Fale de família e segurança. Mostre que é um negócio hereditário e seguro para o futuro.',
            objection: 'Se tiver dúvida, diga: "Eu estarei ao seu lado no passo a passo. Temos um suporte que é uma família".',
            motivations: ['🛡️ Segurança', '🧘 Equilíbrio', '📈 Estabilidade', '🤝 Lealdade'],
            voice: 'Calmo, acolhedor e pausado. Transmita paz.',
            strategicOil: { name: 'Brave', reason: 'Para fortalecer a autoconfiança e a coragem de tomar iniciativa em novos desafios de liderança.' },
            roadmap: [
                { stage: 'Abertura', task: 'Seja gentil e calmo. Transmita segurança.' },
                { stage: 'Sondagem', task: 'Pergunte: "Como você se sentiria ajudando outras famílias?"' },
                { stage: 'Valor', task: 'Mostre o suporte da equipe e o sistema de educação.' },
                { stage: 'Fechamento', task: 'Dê segurança: "Eu vou te guiar em cada detalhe. Vamos começar?"' }
            ]
        },
        'C': {
            toSay: 'Fale sobre dados e qualidade.',
            toAvoid: 'Evite promessas sem provas.',
            closingStrategy: 'Venda a solidez do método.',
            hook: `Olá! Analisei seu perfil e vi que você é uma pessoa criteriosa e atenta aos detalhes. Gostaria de te apresentar os dados e a base técnica do nosso projeto. O que acha?`,
            secret: 'Vença pelos fatos. Envie laudos, planos de compensação detalhados e provas de pureza CPTG.',
            approach: 'Seja técnico e calmo. Não use "hype". Deixe que ela analise os dados no tempo dela.',
            objection: 'Se questionar a qualidade, mostre o site Source to You e os certificados de pureza.',
            motivations: ['🔬 Qualidade', '📚 Conhecimento', '🎯 Precisão', '📋 Organização'],
            voice: 'Profissional, lógico e sem exageros emocionais.',
            strategicOil: { name: 'Citrus Bliss', reason: 'Para estimular a criatividade, flexibilidade e reduzir a autocrítica excessiva durante o processo analítico.' },
            roadmap: [
                { stage: 'Abertura', task: 'Seja profissional e formal. Use dados.' },
                { stage: 'Sondagem', task: 'Pergunte: "Ficou alguma dúvida sobre a lógica do negócio?"' },
                { stage: 'Valor', task: 'Mostre gráficos de retenção e certificados CPTG.' },
                { stage: 'Fechamento', task: 'Apele à lógica: "Os dados mostram que este é o melhor caminho. Vamos?"' }
            ]
        }
    };

    const comm = communicationMatrix[disc.code] || communicationMatrix['D'];

    // Lead Scoring
    const urgency = readiness.includes('Imediatamente') ? 40 : 20;
    const money = answers.financial_goal?.includes('10.000') ? 30 : 15;
    const time = answers.time_availability?.includes('Integralmente') ? 30 : 15;
    const leadScore = urgency + money + time;
    let leadLabel = '💎 LEAD DIAMANTE (Prioridade Máxima)';
    if (leadScore < 60) leadLabel = '🥉 LEAD PRATA (Manter no Radar)';
    else if (leadScore < 85) leadLabel = '🥇 LEAD OURO (Alta Qualificação)';

    return {
        disc,
        archetype,
        leadership: {
            score: leadershipScore,
            isPotential: isPotentialLeader,
            label: isPotentialLeader ? '🔥 LIDERANÇA ALTA' : (leadershipScore > 60 ? '🟡 POTENCIAL' : '❄️ EXECUTOR')
        },
        lead: { score: leadScore, label: leadLabel },
        jung: { energy: isExtrovert ? 'Extrovertido' : 'Introvertido', approach: isLogical ? 'Racional' : 'Empático' },
        guide: {
            toSay: comm.toSay,
            toAvoid: comm.toAvoid,
            closingStrategy: comm.closingStrategy,
            secret: comm.secret,
            approach: comm.approach,
            objection: comm.objection,
            roadmap: comm.roadmap,
            voice: comm.voice,
            strategicOil: comm.strategicOil
        },
        meta: {
            urgency: readiness.includes('Imediatamente') ? 'Alta' : 'Média',
            financialGoal: answers.financial_goal || 'Não definida',
            availability: answers.time_availability || 'Não definida'
        },
        communication: {
            hook: comm.hook,
            motivations: comm.motivations
        }
    };
}
