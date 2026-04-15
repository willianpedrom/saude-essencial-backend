import { analyzeAnamnesis } from './public/js/data.js';

const mockAnswersPregnant = {
    full_name: 'Ana Gestante',
    special_conditions: ['Gestante'],
    general_symptoms: ['Dores de cabeça frequentes', 'Sinusite / Rinite'],
    emotional_symptoms: ['Ansiedade'],
    goals: ['Melhorar o sono']
};

const result = analyzeAnamnesis(mockAnswersPregnant);

console.log('--- TESTE GESTANTE ---');
console.log('Is Pregnant:', result.isPregnant);
console.log('Symptoms:', result.mainSymptoms);
console.log('Protocols Count:', result.protocols.length);

result.protocols.forEach(p => {
    console.log(`\nProtocolo: ${p.symptom}`);
    console.log('Safety Alert:', p.safetyAlert);
    console.log('Oils:', p.oils.map(o => o.name).join(', '));
    const routineStrings = JSON.stringify(p.routine);
    console.log('Peppermint in routine?', /Peppermint|Hortelã/i.test(routineStrings));
    console.log('Rosemary in routine?', /Rosemary|Alecrim/i.test(routineStrings));
});
