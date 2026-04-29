/* ============================================================
   ANALYSIS LOGIC
   Algoritmos de diagnóstico comportamental e físico
   ============================================================ */

import { PROTOCOLS } from './protocols.js';
import { LIVING_KIT } from './oils.js';

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
    // 1. DISC Pillar
    const action = answers.disc_action || '';
    let disc = { type: 'Executor', trait: 'Dominância', code: 'D' };
    if (action.includes('entusiasmo')) disc = { type: 'Comunicador', trait: 'Influência', code: 'I' };
    if (action.includes('Manter a calma')) disc = { type: 'Planejador', trait: 'Estabilidade', code: 'S' };
    if (action.includes('Analisar todos')) disc = { type: 'Analista', trait: 'Conformidade', code: 'C' };

    // 2. Jung Pillar
    const energy = answers.jung_energy || '';
    const isExtrovert = energy.includes('Estando com pessoas');
    const decisions = answers.jung_decisions || '';
    const isLogical = decisions.includes('lógica fria');

    // 3. Archetype Pillar
    const drive = answers.archetype_drive || '';
    let archetype = { name: 'O Herói', desc: 'Foco em superação, vitória e metas audaciosas.', leadershipPotential: 90 };
    if (drive.includes('Ensinar')) archetype = { name: 'O Sábio', desc: 'Foco em conhecimento, verdade e desenvolvimento alheio.', leadershipPotential: 75 };
    if (drive.includes('Proteger')) archetype = { name: 'O Cuidador', desc: 'Foco em segurança, acolhimento e proteção da rede.', leadershipPotential: 60 };
    if (drive.includes('liberdade total')) archetype = { name: 'O Criador', desc: 'Foco em inovação, autenticidade e novas formas de agir.', leadershipPotential: 80 };

    // 4. Leadership Index Calculation
    const posture = answers.leadership_posture || '';
    const readiness = answers.readiness || '';
    
    let leadershipScore = archetype.leadershipPotential;
    if (posture.includes('muito confortável')) leadershipScore += 10;
    if (posture.includes('exemplo')) leadershipScore += 5;
    if (readiness.includes('Imediatamente')) leadershipScore += 5;
    
    leadershipScore = Math.min(100, leadershipScore);
    const isPotentialLeader = leadershipScore >= 80;

    // 5. Management Guide (For Consultant)
    let guide = {
        toSay: 'Fale sobre resultados e bônus.',
        toAvoid: 'Não demore com detalhes.',
        closingStrategy: 'Venda a visão de topo.'
    };

    if (disc.code === 'I') guide = { toSay: 'Fale sobre pessoas e reconhecimento.', toAvoid: 'Evite planilhas pesadas agora.', closingStrategy: 'Venda o estilo de vida.' };
    if (disc.code === 'S') guide = { toSay: 'Fale sobre segurança e suporte.', toAvoid: 'Não pressione por decisão imediata.', closingStrategy: 'Venda o passo a passo.' };
    if (disc.code === 'C') guide = { toSay: 'Fale sobre dados e qualidade.', toAvoid: 'Evite promessas sem provas.', closingStrategy: 'Venda a solidez do método.' };

    return {
        disc,
        archetype,
        leadership: {
            score: leadershipScore,
            isPotential: isPotentialLeader,
            label: isPotentialLeader ? '🔥 LIDERANÇA ALTA' : (leadershipScore > 60 ? '🟡 POTENCIAL' : '❄️ EXECUTOR')
        },
        jung: { energy: isExtrovert ? 'Extrovertido' : 'Introvertido', approach: isLogical ? 'Racional' : 'Empático' },
        guide,
        meta: {
            urgency: readiness.includes('Imediatamente') ? 'Alta' : 'Média',
            financialGoal: answers.financial_goal || 'Não definida',
            availability: answers.time_availability || 'Não definida'
        }
    };
}
