import { store } from '../store.js';
import { toast } from '../utils.js';
import { renderLayout } from './Dashboard.js';

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const fmt_brl = v => v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '—';
const parseDate = s => {
    if (!s) return null;
    // Se for YYYY-MM-DD (comum em inputs), anexa meio-dia para evitar problemas de fuso horário
    const iso = s.length === 10 ? s + 'T12:00:00' : s;
    const d = new Date(iso);
    return isNaN(d) ? null : d;
};

const fmt_date = s => {
    const d = parseDate(s);
    return d ? d.toLocaleDateString('pt-BR') : '—';
};

const days_until = s => {
    const d = parseDate(s);
    if (!d) return null;
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Compara meio-dia com meio-dia
    return Math.ceil((d - today) / 86400000);
};

const DOTERRA_PRODUCTS = [
    { nome: "Lavanda (Lavender)", cat: "Óleo Essencial" },
    { nome: "Hortelã-Pimenta (Peppermint)", cat: "Óleo Essencial" },
    { nome: "Olíbano (Frankincense)", cat: "Óleo Essencial" },
    { nome: "Melaleuca (Tea Tree)", cat: "Óleo Essencial" },
    { nome: "Laranja Doce (Wild Orange)", cat: "Óleo Essencial" },
    { nome: "Limão Siciliano (Lemon)", cat: "Óleo Essencial" },
    { nome: "Copaíba", cat: "Óleo Essencial" },
    { nome: "Orégano", cat: "Óleo Essencial" },
    { nome: "Gengibre (Ginger)", cat: "Óleo Essencial" },
    { nome: "Alecrim (Rosemary)", cat: "Óleo Essencial" },
    { nome: "Bergamota", cat: "Óleo Essencial" },
    { nome: "Eucalipto", cat: "Óleo Essencial" },
    { nome: "Gerânio", cat: "Óleo Essencial" },
    { nome: "Helicriso (Helichrysum)", cat: "Óleo Essencial" },
    { nome: "Canela (Cinnamon Bark)", cat: "Óleo Essencial" },
    { nome: "Rosa (Rose)", cat: "Óleo Essencial" },
    { nome: "Melissa", cat: "Óleo Essencial" },
    { nome: "Mirra (Myrrh)", cat: "Óleo Essencial" },
    { nome: "Cedro (Cedarwood)", cat: "Óleo Essencial" },
    { nome: "Pimenta Preta (Black Pepper)", cat: "Óleo Essencial" },
    { nome: "Sálvia Esclareia (Clary Sage)", cat: "Óleo Essencial" },
    { nome: "Ylang Ylang", cat: "Óleo Essencial" },
    { nome: "Vetiver", cat: "Óleo Essencial" },
    { nome: "Sândalo Havaiano (Hawaiian Sandalwood)", cat: "Óleo Essencial" },
    { nome: "Cravo (Clove)", cat: "Óleo Essencial" },
    { nome: "Toranja (Grapefruit)", cat: "Óleo Essencial" },
    { nome: "Tangerina", cat: "Óleo Essencial" },
    { nome: "Capim-Limão (Lemongrass)", cat: "Óleo Essencial" },
    { nome: "Erva Doce (Fennel)", cat: "Óleo Essencial" },
    { nome: "Manjerona (Marjoram)", cat: "Óleo Essencial" },
    { nome: "Patchouli", cat: "Óleo Essencial" },
    { nome: "Tomilho (Thyme)", cat: "Óleo Essencial" },
    { nome: "Cipreste (Cypress)", cat: "Óleo Essencial" },
    { nome: "Zimbro (Juniper Berry)", cat: "Óleo Essencial" },
    { nome: "Arborvitae", cat: "Óleo Essencial" },
    { nome: "Basil (Manjericão)", cat: "Óleo Essencial" },
    { nome: "Pinho Siberiano (Siberian Fir)", cat: "Óleo Essencial" },
    { nome: "Coentro (Coriander)", cat: "Óleo Essencial" },
    { nome: "Camomila Romana (Roman Chamomile)", cat: "Óleo Essencial" },
    { nome: "On Guard (Mix Protetor)", cat: "Blend" },
    { nome: "Breathe / Clarify (Mix Respiratório)", cat: "Blend" },
    { nome: "Deep Blue (Mix Suavizante)", cat: "Blend" },
    { nome: "ZenGest / DigestZen (Mix Digestivo)", cat: "Blend" },
    { nome: "Serenity (Mix Repousante)", cat: "Blend" },
    { nome: "Balance (Mix Aterrador)", cat: "Blend" },
    { nome: "Citrus Bliss (Mix Revigorante)", cat: "Blend" },
    { nome: "Elevation (Mix Alegre)", cat: "Blend" },
    { nome: "Purify (Mix Purificador)", cat: "Blend" },
    { nome: "AromaTouch", cat: "Blend" },
    { nome: "PastTense (Mix Tensão)", cat: "Blend" },
    { nome: "InTune (Mix Foco)", cat: "Blend" },
    { nome: "ClaryCalm (Mix Mensal Mulher)", cat: "Blend" },
    { nome: "Cheer (Mix Animador)", cat: "Blend" },
    { nome: "Motivate (Mix Encorajador)", cat: "Blend" },
    { nome: "Peace (Mix Tranquilizador)", cat: "Blend" },
    { nome: "Zendocrine (Mix Desintoxicante)", cat: "Blend" },
    { nome: "Adaptiv", cat: "Blend" },
    { nome: "MetaPWR Blend", cat: "Blend" },
    { nome: "TerraShield (Mix Repelente)", cat: "Blend" },
    { nome: "Whisper (Mix para Mulheres)", cat: "Blend" },
    { nome: "Passion (Mix Inspirador)", cat: "Blend" },
    { nome: "Forgive (Mix Renovador)", cat: "Blend" },
    { nome: "Console (Mix Consolador)", cat: "Blend" },
    { nome: "Anchor (Yoga)", cat: "Blend" },
    { nome: "Align (Yoga)", cat: "Blend" },
    { nome: "Arise (Yoga)", cat: "Blend" },
    { nome: "Island Mint", cat: "Blend" },
    { nome: "Holiday Peace", cat: "Blend" },
    { nome: "Holiday Joy", cat: "Blend" },
    { nome: "Lavanda Touch", cat: "Roll-on (Touch)" },
    { nome: "Peppermint Touch", cat: "Roll-on (Touch)" },
    { nome: "Frankincense Touch", cat: "Roll-on (Touch)" },
    { nome: "Melaleuca Touch", cat: "Roll-on (Touch)" },
    { nome: "On Guard Touch", cat: "Roll-on (Touch)" },
    { nome: "Breathe Touch", cat: "Roll-on (Touch)" },
    { nome: "Deep Blue Touch", cat: "Roll-on (Touch)" },
    { nome: "ZenGest Touch", cat: "Roll-on (Touch)" },
    { nome: "Rose Touch", cat: "Roll-on (Touch)" },
    { nome: "Jasmine Touch", cat: "Roll-on (Touch)" },
    { nome: "Neroli Touch", cat: "Roll-on (Touch)" },
    { nome: "Magnolia Touch", cat: "Roll-on (Touch)" },
    { nome: "Thinker (Kids)", cat: "Linha Kids" },
    { nome: "Calmer (Kids)", cat: "Linha Kids" },
    { nome: "Stronger (Kids)", cat: "Linha Kids" },
    { nome: "Rescuer (Kids)", cat: "Linha Kids" },
    { nome: "Steady (Kids)", cat: "Linha Kids" },
    { nome: "Brave (Kids)", cat: "Linha Kids" },
    { nome: "Tamer (Kids)", cat: "Linha Kids" },
    { nome: "Lifelong Vitality Pack (LLV)", cat: "Suplemento" },
    { nome: "Microplex VMz", cat: "Suplemento" },
    { nome: "xEO Mega", cat: "Suplemento" },
    { nome: "Alpha CRS+", cat: "Suplemento" },
    { nome: "PB Assist+ (Probiótico)", cat: "Suplemento" },
    { nome: "TerraZyme", cat: "Suplemento" },
    { nome: "Beauty Power (Colágeno)", cat: "Suplemento" },
    { nome: "MetaPWR Advantage (Colágeno)", cat: "Suplemento" },
    { nome: "MetaPWR Assist", cat: "Suplemento" },
    { nome: "Deep Blue Polyphenol Complex", cat: "Suplemento" },
    { nome: "Peppermint Softgels", cat: "Suplemento" },
    { nome: "ZenGest Softgels", cat: "Suplemento" },
    { nome: "On Guard Softgels", cat: "Suplemento" },
    { nome: "Copaíba Softgels", cat: "Suplemento" },
    { nome: "Mito2Max", cat: "Suplemento" },
    { nome: "Pasta de Dente On Guard", cat: "Personal Care" },
    { nome: "Enxaguante Bucal On Guard", cat: "Personal Care" },
    { nome: "Sabonete Líquido On Guard", cat: "Personal Care" },
    { nome: "Pomada Deep Blue Rub", cat: "Personal Care" },
    { nome: "Bálsamo Labial Original", cat: "Personal Care" },
    { nome: "Loção Mãos e Corpo", cat: "Personal Care" },
    { nome: "Shampoo Salon Essentials", cat: "Personal Care" },
    { nome: "Condicionador Salon Essentials", cat: "Personal Care" },
    { nome: "Veráge Cleanser", cat: "Personal Care" },
    { nome: "Veráge Toner", cat: "Personal Care" },
    { nome: "Veráge Sérum", cat: "Personal Care" },
    { nome: "Veráge Loção Hidratante", cat: "Personal Care" },
    { nome: "Esfoliante Corporal Revel (Body Scrub)", cat: "Personal Care" },
    { nome: "Manteiga Corporal Revel (Body Butter)", cat: "Personal Care" },
    { nome: "Kit Brasil Living (10 óleos 5ml)", cat: "Kit" },
    { nome: "Kit Essencial para o Lar", cat: "Kit" },
    { nome: "Kit Kids Completo (7 unidades)", cat: "Kit" },
    { nome: "Kit Soluções Naturais", cat: "Kit" },
    { nome: "Difusor Pétala (Petal)", cat: "Difusor" },
    { nome: "Difusor Volo", cat: "Difusor" },
    { nome: "Difusor Pilot", cat: "Difusor" },
    { nome: "Difusor Roam", cat: "Difusor" },
    { nome: "Difusor Dawn (Umidificador)", cat: "Difusor" },
    { nome: "Laluz Diffuser", cat: "Difusor" },
    { nome: "Difusor Petal 2.0", cat: "Difusor" },
    { nome: "Difusor Pebble", cat: "Difusor" },
    { nome: "Óleo de Coco Fracionado (115ml)", cat: "Acessório" },
    { nome: "Cápsulas Vegetais (Vazias)", cat: "Acessório" },
    { nome: "Chaveiro doTERRA (Roxo/Preto)", cat: "Acessório" },
    { nome: "Estojo de Viagem Para Óleos", cat: "Acessório" },
    { nome: "Caixa de Madeira", cat: "Acessório" },
    // Óleos essenciais adicionais
    { nome: "Copaíba (Copaiba)", cat: "Óleo Essencial" },
    { nome: "Eucalipto Radiata (Eucalyptus)", cat: "Óleo Essencial" },
    { nome: "Orégano (Oregano)", cat: "Óleo Essencial" },
    { nome: "Gerânio (Geranium)", cat: "Óleo Essencial" },
    { nome: "Wintergreen", cat: "Óleo Essencial" },
    { nome: "Cardamomo (Cardamom)", cat: "Óleo Essencial" },
    { nome: "Limão Tahiti (Lime)", cat: "Óleo Essencial" },
    { nome: "Cúrcuma (Turmeric)", cat: "Óleo Essencial" },
    { nome: "Spearmint", cat: "Óleo Essencial" },
    { nome: "Cássia (Cassia)", cat: "Óleo Essencial" },
    { nome: "Pimenta Rosa (Pink Pepper)", cat: "Óleo Essencial" },
    { nome: "Petitgrain", cat: "Óleo Essencial" },
    { nome: "Douglas Fir", cat: "Óleo Essencial" },
    { nome: "Spikenard", cat: "Óleo Essencial" },
    { nome: "Breu Branco", cat: "Óleo Essencial" },
    { nome: "Erva Baleeira", cat: "Óleo Essencial" },
    { nome: "Green Mandarin", cat: "Óleo Essencial" },
    { nome: "Guaiacwood", cat: "Óleo Essencial" },
    { nome: "Lemon Eucalyptus", cat: "Óleo Essencial" },
    { nome: "Madagascar Vanilla", cat: "Óleo Essencial" },
    { nome: "Cilantro", cat: "Óleo Essencial" },
    { nome: "Citronela", cat: "Óleo Essencial" },
    { nome: "Blue Tansy", cat: "Óleo Essencial" },
    { nome: "Yarrow Pom", cat: "Óleo Essencial" },
    // Blends adicionais
    { nome: "Motive (Mix Motivador)", cat: "Blend" },
    { nome: "Air-X", cat: "Blend" },
    { nome: "Forest Bathing", cat: "Blend" },
    { nome: "Hope", cat: "Blend" },
    { nome: "Hygge", cat: "Blend" },
    { nome: "Salubelle", cat: "Blend" },
    { nome: "Citrus Bloom", cat: "Blend" },
    { nome: "HD Clear", cat: "Blend" },
    { nome: "DDR Prime", cat: "Blend" },
    { nome: "Slim & Sassy (Mix Metabólico)", cat: "Blend" },
    { nome: "Immortelle", cat: "Blend" },
    // Suplementos adicionais
    { nome: "Lifeshōt", cat: "Suplemento" },
    { nome: "TriEase", cat: "Suplemento" },
    { nome: "DDR Prime Cápsulas", cat: "Suplemento" },
    { nome: "Cúrcuma Cápsulas", cat: "Suplemento" },
    { nome: "ZenGest Cápsulas", cat: "Suplemento" },
    { nome: "VM Complex", cat: "Suplemento" },
    { nome: "MetaPWR FiberUP", cat: "Suplemento" },
    { nome: "TrimShake Vanilla", cat: "Suplemento" },
    { nome: "TrimShake Chocolate", cat: "Suplemento" },
    // Personal Care adicionais
    { nome: "On Guard Pastilhas", cat: "Personal Care" },
    { nome: "On Guard Beadlets", cat: "Personal Care" },
    { nome: "Peppermint Beadlets", cat: "Personal Care" },
    { nome: "SuperMint Beadlets", cat: "Personal Care" },
    { nome: "Balas Breathe", cat: "Personal Care" },
    { nome: "Balas Ginger", cat: "Personal Care" },
    { nome: "Balas On Guard", cat: "Personal Care" },
    { nome: "Creme Dental On Guard", cat: "Personal Care" },
    { nome: "Loção Spa Mãos e Corpo", cat: "Personal Care" },
    { nome: "Sabonete Líquido Spa", cat: "Personal Care" },
    { nome: "Veráge Kit Skincare", cat: "Kit" },
];

// ── Tabela de Preços Oficiais doTERRA (por produto + tamanho) ──────────────
// Formato: { 'Nome Produto': { '15ml': { regular, member }, '5ml': { regular, member } } }
const DOTERRA_PRICES = {
    'Lavanda (Lavender)':          { '15ml': { r: 197, m: 148 }, '5ml': { r: 83, m: 62 }, '10ml Touch': { r: 125, m: 94 } },
    'Hortelã-Pimenta (Peppermint)':{ '15ml': { r: 140, m: 105 }, '5ml': { r: 59, m: 45 } },
    'Olíbano (Frankincense)':      { '15ml': { r: 459, m: 344 }, '5ml': { r: 196, m: 147 }, '10ml Touch': { r: 218, m: 164 } },
    'Melaleuca (Tea Tree)':        { '15ml': { r: 177, m: 133 }, '5ml': { r: 75, m: 56 } },
    'Laranja Doce (Wild Orange)':  { '15ml': { r: 111, m: 83 }, '5ml': { r: 47, m: 35 } },
    'Limão Siciliano (Lemon)':     { '15ml': { r: 111, m: 83 }, '5ml': { r: 47, m: 35 } },
    'Copaíba':                     { '15ml': { r: 281, m: 211 }, '5ml': { r: 119, m: 89 } },
    'Orégano':                     { '15ml': { r: 234, m: 176 }, '5ml': { r: 99, m: 74 } },
    'Gengibre (Ginger)':           { '15ml': { r: 213, m: 160 }, '5ml': { r: 91, m: 68 } },
    'Alecrim (Rosemary)':          { '15ml': { r: 147, m: 110 }, '5ml': { r: 63, m: 47 } },
    'Bergamota':                   { '15ml': { r: 207, m: 155 }, '5ml': { r: 88, m: 66 } },
    'Eucalipto':                   { '15ml': { r: 155, m: 116 }, '5ml': { r: 65, m: 49 } },
    'Gerânio':                     { '15ml': { r: 230, m: 173 }, '5ml': { r: 98, m: 74 } },
    'Helicriso (Helichrysum)':     { '15ml': { r: 599, m: 449 }, '5ml': { r: 254, m: 191 } },
    'Canela (Cinnamon Bark)':      { '15ml': { r: 237, m: 178 }, '5ml': { r: 101, m: 76 } },
    'Rosa (Rose)':                 { '5ml': { r: 722, m: 542 }, '10ml Touch': { r: 307, m: 231 } },
    'Melissa':                     { '5ml': { r: 599, m: 449 } },
    'Mirra (Myrrh)':               { '15ml': { r: 385, m: 289 }, '5ml': { r: 164, m: 123 } },
    'Cedro (Cedarwood)':           { '15ml': { r: 116, m: 87 }, '5ml': { r: 49, m: 37 } },
    'Ylang Ylang':                 { '15ml': { r: 215, m: 161 }, '5ml': { r: 91, m: 68 } },
    'Vetiver':                     { '15ml': { r: 409, m: 307 }, '5ml': { r: 173, m: 130 } },
    'Toranja (Grapefruit)':        { '15ml': { r: 133, m: 100 }, '5ml': { r: 56, m: 42 } },
    'Capim-Limão (Lemongrass)':    { '15ml': { r: 138, m: 104 }, '5ml': { r: 58, m: 44 } },
    'Patchouli':                   { '15ml': { r: 200, m: 150 }, '5ml': { r: 85, m: 64 } },
    'Cipreste (Cypress)':          { '15ml': { r: 205, m: 154 }, '5ml': { r: 87, m: 65 } },
    'On Guard (Mix Protetor)':     { '15ml': { r: 279, m: 209 }, '5ml': { r: 118, m: 89 } },
    'Breathe / Clarify (Mix Respiratório)': { '15ml': { r: 220, m: 165 }, '5ml': { r: 93, m: 70 } },
    'Deep Blue (Mix Suavizante)':  { '15ml': { r: 250, m: 188 }, '5ml': { r: 106, m: 80 } },
    'ZenGest / DigestZen (Mix Digestivo)': { '15ml': { r: 234, m: 176 }, '5ml': { r: 99, m: 74 } },
    'Serenity (Mix Repousante)':   { '15ml': { r: 197, m: 148 }, '5ml': { r: 83, m: 62 } },
    'Balance (Mix Aterrador)':     { '15ml': { r: 167, m: 125 }, '5ml': { r: 71, m: 53 } },
    'InTune (Mix Foco)':           { '15ml': { r: 310, m: 233 }, '10ml Touch': { r: 179, m: 134 } },
    'Elevation (Mix Alegre)':      { '15ml': { r: 196, m: 147 }, '5ml': { r: 83, m: 62 } },
    'AromaTouch':                  { '15ml': { r: 220, m: 165 } },
    'PastTense (Mix Tensão)':      { '10ml Touch': { r: 152, m: 114 } },
    'ClaryCalm (Mix Mensal Mulher)': { '10ml Touch': { r: 158, m: 119 } },
    'Adaptiv':                     { '15ml': { r: 234, m: 176 }, '10ml Touch': { r: 134, m: 101 } },
    'MetaPWR Blend':               { '15ml': { r: 281, m: 211 } },
    'Lifelong Vitality Pack (LLV)':{ 'Unidade / Kit': { r: 629, m: 472 } },
    'Microplex VMz':               { 'Cápsulas': { r: 249, m: 187 } },
    'xEO Mega':                    { 'Cápsulas': { r: 273, m: 205 } },
    'Alpha CRS+':                  { 'Cápsulas': { r: 267, m: 200 } },
    'PB Assist+ (Probiótico)':     { 'Cápsulas': { r: 215, m: 161 } },
    'TerraZyme':                   { 'Cápsulas': { r: 207, m: 155 } },
    'MetaPWR Advantage (Colágeno)':{ 'Unidade / Kit': { r: 289, m: 217 } },
    'Deep Blue Rub':               { 'Unidade / Kit': { r: 215, m: 161 } },
    'Pomada Deep Blue Rub':        { 'Unidade / Kit': { r: 215, m: 161 } },
    'Pasta de Dente On Guard':     { 'Unidade / Kit': { r: 62, m: 47 } },
    'Óleo de Coco Fracionado (115ml)': { 'Unidade / Kit': { r: 99, m: 74 } },
    'Lavanda Touch':               { '10ml Touch': { r: 125, m: 94 } },
    'Peppermint Touch':            { '10ml Touch': { r: 88, m: 66 } },
    'Frankincense Touch':          { '10ml Touch': { r: 218, m: 164 } },
    'Rose Touch':                  { '10ml Touch': { r: 307, m: 231 } },
    'On Guard Touch':              { '10ml Touch': { r: 152, m: 114 } },
    // Óleos adicionais doTERRA Brasil
    'Abeto Azul (Blue Spruce)':    { '15ml': { r: 248, m: 186 }, '5ml': { r: 105, m: 79 } },
    'Black Spruce':                { '15ml': { r: 248, m: 186 }, '5ml': { r: 105, m: 79 } },
    'Basil (Manjericão)':          { '15ml': { r: 176, m: 132 }, '5ml': { r: 75, m: 56 } },
    'Basil':                       { '15ml': { r: 176, m: 132 }, '5ml': { r: 75, m: 56 } },
    'Manjericão':                  { '15ml': { r: 176, m: 132 }, '5ml': { r: 75, m: 56 } },
    'Cássia':                      { '15ml': { r: 191, m: 143 }, '5ml': { r: 81, m: 61 } },
    'Cássia (Cassia)':             { '15ml': { r: 191, m: 143 }, '5ml': { r: 81, m: 61 } },
    'Sándalo Havaiano':            { '5ml': { r: 385, m: 289 } },
    'Sândalo':                     { '5ml': { r: 385, m: 289 } },
    'Cardamomo':                   { '5ml': { r: 178, m: 134 } },
    'Noz-Moscada (Nutmeg)':        { '15ml': { r: 176, m: 132 }, '5ml': { r: 75, m: 56 } },
    'Noz-moscada':                 { '15ml': { r: 176, m: 132 }, '5ml': { r: 75, m: 56 } },
    'Melão Amargo':                { '15ml': { r: 176, m: 132 } },
    'Abeto Siberiano':             { '15ml': { r: 135, m: 101 }, '5ml': { r: 57, m: 43 } },
    'Siberian Fir':                { '15ml': { r: 135, m: 101 }, '5ml': { r: 57, m: 43 } },
    'Pinho Siberiano':             { '15ml': { r: 135, m: 101 }, '5ml': { r: 57, m: 43 } },
    'Zimbro (Juniper Berry)':      { '15ml': { r: 205, m: 154 }, '5ml': { r: 87, m: 65 } },
    'Zimbro':                      { '15ml': { r: 205, m: 154 }, '5ml': { r: 87, m: 65 } },
    'Arborvitae':                  { '15ml': { r: 276, m: 207 }, '5ml': { r: 117, m: 88 } },
    'Coentro (Coriander)':         { '15ml': { r: 156, m: 117 }, '5ml': { r: 66, m: 50 } },
    'Coentro':                     { '15ml': { r: 156, m: 117 }, '5ml': { r: 66, m: 50 } },
    'Camomila Romana':             { '5ml': { r: 357, m: 268 } },
    'Camomila (Roman Chamomile)':  { '5ml': { r: 357, m: 268 } },
    'Sálvia (Clary Sage)':         { '15ml': { r: 207, m: 155 }, '5ml': { r: 88, m: 66 } },
    'Sálvia Esclareia':            { '15ml': { r: 207, m: 155 }, '5ml': { r: 88, m: 66 } },
    'Pimenta Preta':               { '5ml': { r: 125, m: 94 } },
    'Pimenta Preta (Black Pepper)':{ '5ml': { r: 125, m: 94 } },
    'Erva Doce (Fennel)':          { '15ml': { r: 147, m: 110 }, '5ml': { r: 63, m: 47 } },
    'Erva Doce':                   { '15ml': { r: 147, m: 110 }, '5ml': { r: 63, m: 47 } },
    'Manjerona (Marjoram)':        { '15ml': { r: 191, m: 143 }, '5ml': { r: 81, m: 61 } },
    'Manjerona':                   { '15ml': { r: 191, m: 143 }, '5ml': { r: 81, m: 61 } },
    'Tomilho (Thyme)':             { '15ml': { r: 211, m: 158 }, '5ml': { r: 89, m: 67 } },
    'Tomilho':                     { '15ml': { r: 211, m: 158 }, '5ml': { r: 89, m: 67 } },
    'Lifeshōt':                    { 'Unidade / Kit': { r: 179, m: 134 } },
    'Mito2Max':                    { 'Cápsulas': { r: 159, m: 119 } },
    'Beauty Power (Colágeno)':     { 'Unidade / Kit': { r: 249, m: 187 } },
    'Beauty Power':                { 'Unidade / Kit': { r: 249, m: 187 } },
    'MetaPWR Assist':              { 'Cápsulas': { r: 198, m: 149 } },
    'Peppermint Softgels':         { 'Cápsulas': { r: 115, m: 86 } },
    'ZenGest Softgels':            { 'Cápsulas': { r: 122, m: 92 } },
    'On Guard Softgels':           { 'Cápsulas': { r: 122, m: 92 } },
    'Copaíba Softgels':            { 'Cápsulas': { r: 145, m: 109 } },
    'Deep Blue Polyphenol':        { 'Cápsulas': { r: 189, m: 142 } },
    'xEO Mega Omega':              { 'Cápsulas': { r: 273, m: 205 } },
    'Immortelle':                  { '15ml': { r: 485, m: 364 } },
    'Neroli Touch':                { '10ml Touch': { r: 152, m: 114 } },
    'Magnolia Touch':              { '10ml Touch': { r: 125, m: 94 } },
    'Jasmine Touch':               { '10ml Touch': { r: 219, m: 164 } },
    'Breathe Touch':               { '10ml Touch': { r: 120, m: 90 } },
    'Deep Blue Touch':             { '10ml Touch': { r: 134, m: 101 } },
    'ZenGest Touch':               { '10ml Touch': { r: 120, m: 90 } },
    'Melaleuca Touch':             { '10ml Touch': { r: 95, m: 71 } },
    'Thinker (Kids)':              { '10ml Touch': { r: 105, m: 79 } },
    'Calmer (Kids)':               { '10ml Touch': { r: 105, m: 79 } },
    'Stronger (Kids)':             { '10ml Touch': { r: 105, m: 79 } },
    'Rescuer (Kids)':              { '10ml Touch': { r: 105, m: 79 } },
    'Steady (Kids)':               { '10ml Touch': { r: 105, m: 79 } },
    'Brave (Kids)':                { '10ml Touch': { r: 105, m: 79 } },
    'Tamer (Kids)':                { '10ml Touch': { r: 105, m: 79 } },
};

/** Retorna preços doTERRA para produto+tamanho: { r, m } ou null */
function getDotPrices(nomeProduto, tamanho) {
    if (!nomeProduto) return null;

    // 1. Match exato
    let entry = DOTERRA_PRICES[nomeProduto];

    // 2. Case-insensitive exact
    if (!entry) {
        const lower = nomeProduto.toLowerCase().trim();
        for (const key of Object.keys(DOTERRA_PRICES)) {
            if (key.toLowerCase() === lower) { entry = DOTERRA_PRICES[key]; break; }
        }
    }

    // 3. Fuzzy: a chave contém o nome do produto ou vice-versa
    if (!entry) {
        const lower = nomeProduto.toLowerCase().trim();
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase();
            if (kl.startsWith(lower) || lower.startsWith(kl) || kl.includes(lower) || lower.includes(kl)) {
                entry = DOTERRA_PRICES[key];
                break;
            }
        }
    }

    if (!entry) return null;
    // Tenta match exato no tamanho, depois o primeiro tamanho disponível
    return entry[tamanho] || Object.values(entry)[0] || null;
}

export async function renderInventory(router) {
    const pageContent = `
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
            <div>
                <h1 class="page-title">📦 Meu Estoque doTerra</h1>
                <p style="color:var(--text-muted); margin:4px 0 0; font-size:0.9rem;">Controle individual dos seus produtos</p>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button id="btn-export-pdf" class="btn btn-secondary" title="Exportar lista para impressão">📄 Exportar</button>
                <button id="add-item-btn" class="btn btn-primary">+ Adicionar Produto</button>
            </div>
        </div>

        <!-- KPIs -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px,1fr)); gap:14px; margin-bottom:20px;">
            <div class="card" style="text-align:center; padding:16px;">
                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:.5px;">Total em Prateleira</div>
                <div id="kpi-total" style="font-size:1.8rem; font-weight:800; color:var(--green-600); margin-top:4px;">—</div>
            </div>
            <div class="card" style="text-align:center; padding:16px; border-left:4px solid #f59e0b;">
                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:.5px;">Baixo / Zerado</div>
                <div id="kpi-low" style="font-size:1.8rem; font-weight:800; color:#f59e0b; margin-top:4px;">—</div>
            </div>
            <div class="card" style="text-align:center; padding:16px; border-left:4px solid #a78bfa;">
                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:.5px;">Vencendo em 30 dias</div>
                <div id="kpi-expiring" style="font-size:1.8rem; font-weight:800; color:#7c3aed; margin-top:4px;">—</div>
            </div>
            <div class="card" style="text-align:center; padding:16px; border-left:4px solid #10b981;">
                <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase; letter-spacing:.5px;">Total Investido</div>
                <div id="kpi-invested" style="font-size:1.4rem; font-weight:800; color:#059669; margin-top:4px;">—</div>
            </div>
        </div>

        <!-- Barra de Filtros -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px; align-items:center;">
            <input type="search" id="inv-search" placeholder="🔍 Buscar produto..." 
                style="flex:1; min-width:180px; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; outline:none;">
            <select id="inv-filter-cat" style="padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.85rem; background:white; cursor:pointer;">
                <option value="">Todas as categorias</option>
                <option value="Óleo Essencial">Óleos Essenciais</option>
                <option value="Blend">Mix / Blend</option>
                <option value="Roll-on (Touch)">Roll-on (Touch)</option>
                <option value="Linha Kids">Linha Kids</option>
                <option value="Suplemento">Suplemento</option>
                <option value="Personal Care">Cuidados Pessoais</option>
                <option value="Kit">Kit</option>
                <option value="Difusor">Difusor</option>
                <option value="Acessório">Acessório</option>
            </select>
            <select id="inv-filter-uso" style="padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.85rem; background:white; cursor:pointer;">
                <option value="">Todos os usos</option>
                <option value="venda">Para Venda</option>
                <option value="pessoal">Uso Pessoal</option>
            </select>
        </div>

        <!-- Tabela Desktop -->
        <div class="card inv-desktop-view" style="padding:0; overflow:hidden;">
            <table style="width:100%; border-collapse:collapse;" id="inv-table">
                <thead style="background:var(--green-50);">
                    <tr>
                        <th style="padding:11px 16px; text-align:left; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Produto</th>
                        <th style="padding:11px 8px; text-align:left; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Tam.</th>
                        <th style="padding:11px 8px; text-align:left; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Preços (Custo / Regular / Membro / Lucro)</th>
                        <th style="padding:11px 8px; text-align:left; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Validade</th>
                        <th style="padding:11px 8px; text-align:left; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Uso</th>
                        <th style="padding:11px 8px; text-align:center; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Qtd.</th>
                        <th style="padding:11px 16px; text-align:center; font-size:0.75rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Ações</th>
                    </tr>
                </thead>
                <tbody id="inv-tbody">
                    <tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-muted);">Carregando...</td></tr>
                </tbody>
            </table>
        </div>

        <!-- Cards Mobile -->
        <div id="inv-cards" class="inv-mobile-view" style="display:flex;flex-direction:column;gap:10px;"></div>

        <style>
          @media (min-width: 640px) {
            .inv-mobile-view { display: none !important; }
            .inv-desktop-view { display: block !important; }
          }
          @media (max-width: 639px) {
            .inv-desktop-view { display: none !important; }
            .inv-mobile-view { display: flex !important; }
          }
          .inv-card {
            background: white;
            border-radius: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
            border: 1px solid var(--border);
            padding: 14px 16px;
            transition: box-shadow 0.15s;
          }
          .inv-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 10px;
          }
          .inv-card-title {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--text-dark);
            line-height: 1.3;
          }
          .inv-card-cat {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 2px;
          }
          .inv-card-qty-badge {
            flex-shrink: 0;
            min-width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1.05rem;
          }
          .inv-card-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 12px;
          }
          .inv-card-meta-item {
            background: #f8fafc;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 0.78rem;
          }
          .inv-card-meta-label {
            color: var(--text-muted);
            font-size: 0.68rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
          }
          .inv-card-actions {
            display: grid;
            grid-template-columns: 1fr 1fr 52px 52px;
            gap: 8px;
            align-items: center;
          }
          .inv-card-qty-controls {
            display: flex;
            align-items: center;
            gap: 0;
            grid-column: 1 / 3;
            background: #f1f5f9;
            border-radius: 10px;
            overflow: hidden;
          }
          .inv-card-qty-btn {
            flex: 1;
            height: 42px;
            border: none;
            background: transparent;
            font-size: 1.3rem;
            font-weight: 700;
            cursor: pointer;
            color: var(--text-dark);
            transition: background 0.15s;
            -webkit-tap-highlight-color: transparent;
          }
          .inv-card-qty-btn:active { background: #e2e8f0; }
          .inv-card-qty-btn:disabled { opacity: 0.3; cursor: default; }
          .inv-card-qty-num {
            min-width: 36px;
            text-align: center;
            font-weight: 800;
            font-size: 1rem;
          }
          .inv-card-btn {
            height: 42px;
            border-radius: 10px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-tap-highlight-color: transparent;
            transition: filter 0.15s;
          }
          .inv-card-btn:active { filter: brightness(0.9); }
          .inv-card-btn-edit { background: #eff6ff; color: #2563eb; }
          .inv-card-btn-del  { background: #fef2f2; color: #dc2626; }
        </style>

        <!-- Modal Adicionar / Editar -->
        <div id="inv-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center; padding:16px;">
            <div style="background:white; border-radius:16px; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--border);">
                    <h3 id="inv-modal-title" style="margin:0; font-size:1rem;">Registrar Produto</h3>
                    <button id="inv-modal-close" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--text-muted); line-height:1;">&times;</button>
                </div>
                <form id="inv-form" style="padding:22px; display:flex; flex-direction:column; gap:14px;">
                    <input type="hidden" id="inv-edit-id">
                    <div style="position:relative;">
                        <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Nome do Produto *</label>
                        <input type="text" id="inv-name" autocomplete="off" placeholder="Ex: Lavanda, On Guard, MetaPWR..."
                            style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.92rem; box-sizing:border-box; outline:none;">
                        <div id="inv-ac" style="position:absolute; left:0; right:0; top:calc(100% + 2px); z-index:9999; background:white; border:1px solid var(--border); border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.12); display:none; max-height:200px; overflow-y:auto;"></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Categoria</label>
                            <select id="inv-cat" style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; background:white;">
                                <option value="Óleo Essencial">Óleo Essencial</option>
                                <option value="Blend">Mix / Blend</option>
                                <option value="Roll-on (Touch)">Roll-on (Touch)</option>
                                <option value="Linha Kids">Linha Kids</option>
                                <option value="Suplemento">Suplemento</option>
                                <option value="Personal Care">Cuidados Pessoais</option>
                                <option value="Kit">Kit Fechado</option>
                                <option value="Difusor">Difusor</option>
                                <option value="Acessório">Acessório</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Tamanho</label>
                            <select id="inv-size" style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; background:white;">
                                <option>15ml</option>
                                <option>5ml</option>
                                <option>10ml Touch</option>
                                <option>Unidade / Kit</option>
                                <option>Gramas</option>
                                <option>Cápsulas</option>
                                <option>Outro</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Quantidade</label>
                            <input type="number" id="inv-qty" value="1" min="0"
                                style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Preço de Custo (R$)</label>
                            <input type="number" id="inv-custo" placeholder="0,00" step="0.01" min="0"
                                style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; box-sizing:border-box;">
                        </div>
                    </div>
                    <!-- Painel de preços doTERRA (preenchido dinamicamente via JS) -->
                    <div id="inv-price-preview" style="display:none; background:#f8fafc; border:1px solid #bbf7d0; border-radius:10px; padding:12px;"></div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div>
                            <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Data de Validade</label>
                            <input type="date" id="inv-validade"
                                style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Destinado para</label>
                            <select id="inv-uso" style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; background:white;">
                                <option value="venda">🛒 Para Venda</option>
                                <option value="pessoal">🏠 Uso Pessoal</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-size:0.83rem; font-weight:600; margin-bottom:5px; color:var(--text-dark);">Notas / Origem</label>
                        <input type="text" id="inv-notes" placeholder="Ex: LRP Março, BOGO, Kit Brasil, Presente"
                            style="width:100%; padding:9px 12px; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; box-sizing:border-box;">
                    </div>
                    <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:4px;">
                        <button type="button" id="inv-cancel" class="btn btn-secondary">Cancelar</button>
                        <button type="submit" id="inv-submit" class="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderLayout(router, '📦 Meu Estoque', pageContent, 'estoque');

    // ── Element refs ──────────────────────────────────────────
    const modal     = document.getElementById('inv-modal');
    const form      = document.getElementById('inv-form');
    const tbody     = document.getElementById('inv-tbody');
    const nameEl    = document.getElementById('inv-name');
    const catEl     = document.getElementById('inv-cat');
    const sizeEl    = document.getElementById('inv-size');
    const qtyEl     = document.getElementById('inv-qty');
    const custoEl   = document.getElementById('inv-custo');
    const validEl   = document.getElementById('inv-validade');
    const usoEl     = document.getElementById('inv-uso');
    const notesEl   = document.getElementById('inv-notes');
    const acEl      = document.getElementById('inv-ac');
    const editIdEl  = document.getElementById('inv-edit-id');
    const searchEl  = document.getElementById('inv-search');
    const filterCat = document.getElementById('inv-filter-cat');
    const filterUso = document.getElementById('inv-filter-uso');
    const pricePreview = document.getElementById('inv-price-preview');

    let db = [];

    /** Atualiza o painel de preços e lucro estimado no modal */
    function updatePricePreview() {
        const nome = nameEl.value.trim();
        const size = sizeEl.value;
        const custo = parseFloat(custoEl.value) || 0;
        const prices = getDotPrices(nome, size);
        if (!pricePreview) return;
        if (!prices) {
            pricePreview.style.display = 'none';
            return;
        }
        const lucroReg = prices.r - custo;
        const lucroMem = prices.m - custo;
        const pctReg = custo > 0 ? ((lucroReg / custo) * 100).toFixed(0) : null;
        const pctMem = custo > 0 ? ((lucroMem / custo) * 100).toFixed(0) : null;
        pricePreview.style.display = 'block';
        pricePreview.innerHTML = `
          <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#059669;margin-bottom:8px">💰 Preços Oficiais doTERRA (${esc(size)})</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="background:#f0fdf4;border-radius:8px;padding:10px">
              <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase">Preço Regular</div>
              <div style="font-size:1.1rem;font-weight:800;color:#15803d">${fmt_brl(prices.r)}</div>
              ${custo > 0 ? `<div style="font-size:0.72rem;color:${lucroReg >= 0 ? '#059669' : '#dc2626'};font-weight:600">Lucro: ${fmt_brl(lucroReg)} ${pctReg !== null ? `(${pctReg}%)` : ''}</div>` : ''}
            </div>
            <div style="background:#eff6ff;border-radius:8px;padding:10px">
              <div style="font-size:0.68rem;color:var(--text-muted);font-weight:700;text-transform:uppercase">Preço Membro</div>
              <div style="font-size:1.1rem;font-weight:800;color:#1d4ed8">${fmt_brl(prices.m)}</div>
              ${custo > 0 ? `<div style="font-size:0.72rem;color:${lucroMem >= 0 ? '#059669' : '#dc2626'};font-weight:600">Lucro: ${fmt_brl(lucroMem)} ${pctMem !== null ? `(${pctMem}%)` : ''}</div>` : ''}
            </div>
          </div>
        `;
    }

    // ── Modal helpers ─────────────────────────────────────────
    const openModal = (item = null) => {
        form.reset();
        editIdEl.value = '';
        if (pricePreview) pricePreview.style.display = 'none';
        document.getElementById('inv-modal-title').textContent = item ? '✏️ Editar Produto' : 'Registrar Produto';
        if (item) {
            editIdEl.value  = item.id;
            nameEl.value    = item.nome_produto || '';
            catEl.value     = item.categoria || 'Óleo Essencial';
            sizeEl.value    = item.ml_tamanho || '15ml';
            qtyEl.value     = item.quantidade || 0;
            custoEl.value   = item.preco_custo || '';
            validEl.value   = item.validade ? item.validade.split('T')[0] : '';
            usoEl.value     = item.uso_tipo || 'venda';
            notesEl.value   = item.notas || '';
            updatePricePreview();
        } else {
            qtyEl.value = 1;
        }
        modal.style.display = 'flex';
        setTimeout(() => nameEl.focus(), 50);
    };
    const closeModal = () => { modal.style.display = 'none'; acEl.style.display = 'none'; };

    document.getElementById('add-item-btn').addEventListener('click', () => openModal());
    document.getElementById('inv-modal-close').addEventListener('click', closeModal);
    document.getElementById('inv-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    // ── Autocomplete ──────────────────────────────────────────
    nameEl.addEventListener('input', () => {
        const q = nameEl.value.toLowerCase().trim();
        if (q.length < 2) { acEl.style.display = 'none'; return; }
        const hits = DOTERRA_PRODUCTS.filter(p => p.nome.toLowerCase().includes(q)).slice(0, 8);
        if (!hits.length) { acEl.style.display = 'none'; return; }
        acEl.innerHTML = hits.map(p =>
            `<div data-name="${esc(p.nome)}" data-cat="${esc(p.cat)}"
                  style="padding:9px 14px; cursor:pointer; border-bottom:1px solid var(--border); font-size:0.88rem;"
                  onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background=''">
                <strong>${esc(p.nome)}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted); margin-left:6px;">${esc(p.cat)}</span>
            </div>`
        ).join('');
        acEl.style.display = 'block';
    });

    acEl.addEventListener('click', e => {
        const item = e.target.closest('[data-name]');
        if (!item) return;
        nameEl.value = item.dataset.name;
        catEl.value = Array.from(catEl.options).some(o => o.value === item.dataset.cat) ? item.dataset.cat : catEl.value;
        const c = item.dataset.cat;
        sizeEl.value = c.includes('Touch') ? '10ml Touch'
            : ['Difusor','Kit','Personal Care','Acessório'].includes(c) ? 'Unidade / Kit'
            : ['Suplemento'].includes(c) ? 'Cápsulas'
            : '15ml';
        acEl.style.display = 'none';
        // Atualiza preview de preços após selecionar do autocomplete
        updatePricePreview();
    });

    // Também atualiza preview ao trocar tamanho ou digitar custo
    sizeEl.addEventListener('change', updatePricePreview);
    custoEl.addEventListener('input', updatePricePreview);
    nameEl.addEventListener('change', updatePricePreview);

    document.addEventListener('click', e => {
        if (!nameEl.contains(e.target) && !acEl.contains(e.target)) acEl.style.display = 'none';
    }, { capture: true });

    // ── KPIs ──────────────────────────────────────────────────
    const updateKPIs = (data) => {
        let total = 0, low = 0, expiring = 0, invested = 0;
        data.forEach(it => {
            total += it.quantidade;
            if (it.quantidade <= 1) low++;
            const d = days_until(it.validade);
            if (d !== null && d <= 30 && d >= 0) expiring++;
            if (it.preco_custo) invested += it.preco_custo * it.quantidade;
        });
        document.getElementById('kpi-total').textContent     = String(total);
        document.getElementById('kpi-low').textContent       = String(low);
        document.getElementById('kpi-expiring').textContent  = String(expiring);
        document.getElementById('kpi-invested').textContent  = fmt_brl(invested);
    };

    // ── Render table ──────────────────────────────────────────
    const render = () => {
        const q   = (searchEl.value || '').toLowerCase();
        const cat = filterCat.value;
        const uso = filterUso.value;

        const visible = db.filter(it =>
            (!q || it.nome_produto.toLowerCase().includes(q)) &&
            (!cat || it.categoria === cat) &&
            (!uso || it.uso_tipo === uso)
        ).sort((a,b) => {
            if (a.nome_produto !== b.nome_produto) return a.nome_produto.localeCompare(b.nome_produto);
            if (a.ml_tamanho !== b.ml_tamanho) return (a.ml_tamanho || '').localeCompare(b.ml_tamanho || '');
            return (a.validade || '9999').localeCompare(b.validade || '9999');
        });

        updateKPIs(db);

        if (!visible.length) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:48px; color:var(--text-muted);">
                ${db.length ? '❌ Nenhum produto encontrado com esses filtros.' : 'Estoque vazio 📭 — clique em "+ Adicionar Produto" para começar'}
            </td></tr>`;
            return;
        }

        tbody.innerHTML = visible.map(it => {
            const daysLeft = days_until(it.validade);
            let validBadge = '';
            if (it.validade) {
                if (daysLeft < 0) {
                    validBadge = `<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:0.72rem;font-weight:700;">⚠️ VENCIDO</span>`;
                } else if (daysLeft <= 30) {
                    validBadge = `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:0.72rem;font-weight:700;">⏰ ${daysLeft}d</span>`;
                } else {
                    validBadge = `<span style="font-size:0.78rem;color:var(--text-muted);">${fmt_date(it.validade)}</span>`;
                }
            }

            const qtyColor = it.quantidade === 0 ? '#fee2e2;color:#991b1b'
                : it.quantidade === 1 ? '#fef3c7;color:#92400e'
                : '#dcfce7;color:#166534';

            const usoBadge = it.uso_tipo === 'pessoal'
                ? `<span style="background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:10px;font-size:0.72rem;">🏠 Pessoal</span>`
                : `<span style="background:#f0fdf4;color:#166534;padding:2px 8px;border-radius:10px;font-size:0.72rem;">🛒 Venda</span>`;

            // Célula de preços com custo, regular, membro e lucro estimado
            const dp = getDotPrices(it.nome_produto, it.ml_tamanho);
            const custo = it.preco_custo || null;
            const priceCell = (() => {
                const parts = [];
                if (custo) parts.push(`<span style="background:#f1f5f9;color:#475569;padding:2px 7px;border-radius:6px;font-size:0.72rem;font-weight:600;white-space:nowrap;">💵 ${fmt_brl(custo)}</span>`);
                if (dp) {
                    parts.push(`<span style="background:#f0fdf4;color:#15803d;padding:2px 7px;border-radius:6px;font-size:0.72rem;font-weight:700;white-space:nowrap;" title="Preço Regular doTERRA">🟢 ${fmt_brl(dp.r)}</span>`);
                    parts.push(`<span style="background:#eff6ff;color:#1d4ed8;padding:2px 7px;border-radius:6px;font-size:0.72rem;font-weight:700;white-space:nowrap;" title="Preço Membro doTERRA">🔵 ${fmt_brl(dp.m)}</span>`);
                    if (custo) {
                        const lucro = dp.r - custo;
                        const pct = ((lucro / custo) * 100).toFixed(0);
                        parts.push(`<span style="background:${lucro >= 0 ? '#fef9c3' : '#fee2e2'};color:${lucro >= 0 ? '#854d0e' : '#991b1b'};padding:2px 7px;border-radius:6px;font-size:0.72rem;font-weight:700;white-space:nowrap;" title="Lucro estimado (venda regular)">💰 ${fmt_brl(lucro)} (${pct}%)</span>`);
                    }
                }
                if (!parts.length) return `<span style="color:var(--text-muted);font-size:0.8rem;">—</span>`;
                return `<div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">${parts.join('')}</div>`;
            })();

            return `<tr style="border-bottom:1px solid var(--border); transition:background .1s;" onmouseover="this.style.background='#fafafa'" onmouseout="this.style.background=''">
                <td style="padding:11px 16px;">
                    <div style="font-weight:600; font-size:0.9rem;">${esc(it.nome_produto)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">${esc(it.categoria || '')}</div>
                    ${it.notas ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;" title="${esc(it.notas)}">${esc(it.notas)}</div>` : ''}
                </td>
                <td style="padding:11px 8px; color:var(--text-muted); font-size:0.85rem; white-space:nowrap;">${esc(it.ml_tamanho || '—')}</td>
                <td style="padding:11px 8px;">${priceCell}</td>
                <td style="padding:11px 8px; white-space:nowrap;">${validBadge || '<span style="color:var(--text-muted);font-size:0.8rem;">—</span>'}</td>
                <td style="padding:11px 8px;">${usoBadge}</td>
                <td style="padding:11px 8px; text-align:center;">
                    <span style="display:inline-block; background:${qtyColor}; padding:3px 14px; border-radius:20px; font-weight:700; font-size:1rem;">${it.quantidade}</span>
                </td>
                <td style="padding:11px 16px;">
                    <div style="display:flex; gap:5px; align-items:center; justify-content:center;">
                        <button data-id="${it.id}" data-act="dec"
                            style="width:28px;height:28px;border:1px solid var(--border);background:white;border-radius:6px;cursor:pointer;font-size:1rem;font-weight:700;" ${it.quantidade<=0?'disabled':''}>−</button>
                        <button data-id="${it.id}" data-act="inc"
                            style="width:28px;height:28px;border:1px solid var(--border);background:white;border-radius:6px;cursor:pointer;font-size:1rem;font-weight:700;">+</button>
                        <button data-id="${it.id}" data-act="edit"
                            style="width:28px;height:28px;border:none;background:none;cursor:pointer;color:#6366f1;font-size:0.9rem;" title="Editar">✏️</button>
                        <button data-id="${it.id}" data-act="del"
                            style="width:28px;height:28px;border:none;background:none;cursor:pointer;color:#ef4444;font-size:0.9rem;" title="Apagar">🗑</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // ── Cards Mobile ─────────────────────────────────────────
        const cardsEl = document.getElementById('inv-cards');
        if (!cardsEl) return;

        if (!visible.length) {
            cardsEl.innerHTML = `<div style="text-align:center;padding:48px 16px;color:var(--text-muted);background:white;border-radius:14px;">
                ${db.length ? '❌ Nenhum produto encontrado com esses filtros.' : '📭 Estoque vazio — toque em "+ Adicionar Produto" para começar'}
            </div>`;
            return;
        }

        cardsEl.innerHTML = visible.map(it => {
            const daysLeft2 = days_until(it.validade);
            let validText = '—';
            let validStyle = 'color:var(--text-muted)';
            if (it.validade) {
                if (daysLeft2 < 0) { validText = '⚠️ Vencido'; validStyle = 'color:#991b1b;font-weight:700'; }
                else if (daysLeft2 <= 30) { validText = `⏰ ${daysLeft2} dias`; validStyle = 'color:#92400e;font-weight:700'; }
                else { validText = fmt_date(it.validade); }
            }
            const qtyBg = it.quantidade === 0 ? 'background:#fee2e2;color:#991b1b'
                : it.quantidade === 1 ? 'background:#fef3c7;color:#92400e'
                : 'background:#dcfce7;color:#166534';

            return `<div class="inv-card">
              <div class="inv-card-header">
                <div>
                  <div class="inv-card-title">${esc(it.nome_produto)}</div>
                  <div class="inv-card-cat">${esc(it.categoria || '')} ${it.ml_tamanho ? '· ' + esc(it.ml_tamanho) : ''}</div>
                </div>
                <div class="inv-card-qty-badge" style="${qtyBg}">${it.quantidade}</div>
              </div>
              <div class="inv-card-meta">
                <div class="inv-card-meta-item">
                  <div class="inv-card-meta-label">Validade</div>
                  <div style="${validStyle};font-size:0.82rem">${validText}</div>
                </div>
                <div class="inv-card-meta-item">
                  <div class="inv-card-meta-label">Uso</div>
                  <div style="font-size:0.82rem">${it.uso_tipo === 'pessoal' ? '🏠 Pessoal' : '🛒 Venda'}</div>
                </div>
                ${it.preco_custo ? `
                <div class="inv-card-meta-item">
                  <div class="inv-card-meta-label">Custo/un.</div>
                  <div style="font-size:0.82rem;color:#059669;font-weight:600">${fmt_brl(it.preco_custo)}</div>
                </div>` : ''}
                ${(() => {
                    const dp = getDotPrices(it.nome_produto, it.ml_tamanho);
                    if (!dp) return '';
                    const lucroReg = dp.r - (it.preco_custo || 0);
                    return `
                    <div class="inv-card-meta-item">
                      <div class="inv-card-meta-label">venda regular</div>
                      <div style="font-size:0.82rem;color:#15803d;font-weight:700">${fmt_brl(dp.r)}</div>
                    </div>
                    <div class="inv-card-meta-item">
                      <div class="inv-card-meta-label">venda membro</div>
                      <div style="font-size:0.82rem;color:#1d4ed8;font-weight:700">${fmt_brl(dp.m)}</div>
                    </div>
                    ${it.preco_custo ? `<div class="inv-card-meta-item" style="grid-column:1 / 3;background:#fef9c3;">
                      <div class="inv-card-meta-label">💰 Lucro Estimado (regular)</div>
                      <div style="font-size:0.85rem;font-weight:800;color:${lucroReg >= 0 ? '#16a34a' : '#dc2626'}">${fmt_brl(lucroReg)} (${it.preco_custo > 0 ? ((lucroReg / it.preco_custo)*100).toFixed(0) + '%' : 'n/a'})</div>
                    </div>` : ''}`;
                })()}
                ${it.notas ? `
                <div class="inv-card-meta-item" style="grid-column:${it.preco_custo ? 'auto' : '1 / 3'}">
                  <div class="inv-card-meta-label">Notas</div>
                  <div style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.notas)}</div>
                </div>` : ''}
              </div>
              <div class="inv-card-actions">
                <div class="inv-card-qty-controls">
                  <button class="inv-card-qty-btn" data-id="${it.id}" data-act="dec" ${it.quantidade <= 0 ? 'disabled' : ''}>−</button>
                  <div class="inv-card-qty-num">${it.quantidade}</div>
                  <button class="inv-card-qty-btn" data-id="${it.id}" data-act="inc">+</button>
                </div>
                <button class="inv-card-btn inv-card-btn-edit" data-id="${it.id}" data-act="edit" title="Editar">✏️</button>
                <button class="inv-card-btn inv-card-btn-del" data-id="${it.id}" data-act="del" title="Excluir">🗑️</button>
              </div>
            </div>`;
        }).join('');
    }; // fim render()

    // ── Load data ─────────────────────────────────────────────
    const load = async () => {
        try { db = await store.getEstoque(); render(); }
        catch { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#ef4444;">Falha ao carregar estoque.</td></tr>`; }
    };

    // ── Filtros inline ────────────────────────────────────────
    searchEl.addEventListener('input', render);
    filterCat.addEventListener('change', render);
    filterUso.addEventListener('change', render);

    // ── Form submit ───────────────────────────────────────────
    form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('inv-submit');
        btn.disabled = true; btn.textContent = 'Salvando...';
        const id = editIdEl.value;
        const payload = {
            nome_produto: nameEl.value.trim(),
            categoria: catEl.value,
            quantidade: parseInt(qtyEl.value, 10) || 0,
            ml_tamanho: sizeEl.value,
            notas: notesEl.value.trim(),
            validade: validEl.value || null,
            preco_custo: custoEl.value ? parseFloat(custoEl.value) : null,
            uso_tipo: usoEl.value
        };
        try {
            if (id) {
                await store.updateEstoque(id, payload);
                toast('Produto atualizado! ✅');
            } else {
                await store.addEstoque(payload);
                toast('Produto salvo! ✅');
            }
            closeModal();
            load();
        } catch (err) {
            toast(err.message || 'Erro ao salvar', 'error');
        } finally {
            btn.disabled = false; btn.textContent = 'Salvar';
        }
    });

    // ── Table actions ─────────────────────────────────────────
    tbody.addEventListener('click', async e => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const { id, act } = btn.dataset;
        const item = db.find(x => x.id === id);
        if (!item) return;

        if (act === 'edit') { openModal(item); return; }
        if (act === 'del') {
            if (!confirm(`Apagar "${item.nome_produto}" do estoque?`)) return;
            try { await store.deleteEstoque(id); toast('Removido.'); load(); } 
            catch { toast('Erro ao apagar', 'error'); }
            return;
        }

        btn.disabled = true;
        try {
            const newQtd = act === 'inc' ? item.quantidade + 1 : Math.max(0, item.quantidade - 1);
            await store.updateEstoque(id, { quantidade: newQtd });
            item.quantidade = newQtd;
            render();
        } catch { toast('Erro na operação', 'error'); }
        finally { btn.disabled = false; }
    });

    // Cards Mobile — mesma lógica via event delegation
    document.getElementById('inv-cards')?.addEventListener('click', async e => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const { id, act } = btn.dataset;
        const item = db.find(x => x.id === id);
        if (!item) return;

        if (act === 'edit') { openModal(item); return; }
        if (act === 'del') {
            if (!confirm(`Apagar "${item.nome_produto}" do estoque?`)) return;
            try { await store.deleteEstoque(id); toast('Removido.'); load(); }
            catch { toast('Erro ao apagar', 'error'); }
            return;
        }

        btn.disabled = true;
        try {
            const newQtd = act === 'inc' ? item.quantidade + 1 : Math.max(0, item.quantidade - 1);
            await store.updateEstoque(id, { quantidade: newQtd });
            item.quantidade = newQtd;
            render();
        } catch { toast('Erro na operação', 'error'); }
        finally { btn.disabled = false; }
    });

    // ── Exportar PDF ──────────────────────────────────────────
    document.getElementById('btn-export-pdf').addEventListener('click', () => {
        const rows = db.map(it => `
            <tr>
                <td>${esc(it.nome_produto)}</td>
                <td>${esc(it.categoria || '')}</td>
                <td>${esc(it.ml_tamanho || '')}</td>
                <td style="text-align:center; font-weight:bold; color:${it.quantidade === 0 ? '#dc2626' : it.quantidade === 1 ? '#d97706' : '#15803d'}">${it.quantidade}</td>
                <td>${it.uso_tipo === 'pessoal' ? 'Uso Pessoal' : 'Para Venda'}</td>
                <td>${fmt_date(it.validade)}</td>
                <td>${it.notas || ''}</td>
                <td>${it.preco_custo ? fmt_brl(it.preco_custo) : ''}</td>
            </tr>
        `).join('');

        const totalInvested = db.reduce((acc, it) => acc + (it.preco_custo ? it.preco_custo * it.quantidade : 0), 0);
        const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Meu Estoque doTerra</title>
        <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{color:#166534;margin-bottom:4px}
        .sub{color:#6b7280;font-size:0.85rem;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:0.88rem}
        th{background:#f0fdf4;color:#166534;font-weight:700;text-transform:uppercase;font-size:0.72rem;padding:10px;text-align:left;border-bottom:2px solid #bbf7d0}
        td{padding:9px 10px;border-bottom:1px solid #e5e7eb}
        tr:hover td{background:#fafafa}
        .footer{margin-top:24px;font-size:0.8rem;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}
        </style></head><body>
        <h1>📦 Meu Estoque doTerra</h1>
        <div class="sub">Gerado em ${new Date().toLocaleDateString('pt-BR', {day:'2-digit',month:'long',year:'numeric'})} · Total Investido Estimado: <strong>${fmt_brl(totalInvested)}</strong></div>
        <table><thead><tr>
            <th>Produto</th><th>Categoria</th><th>Tamanho</th><th>Qtd.</th><th>Uso</th><th>Validade</th><th>Notas</th><th>Custo/un.</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <div class="footer">Gota App — Sistema de Gestão de Relacionamento</div>
        </body></html>`;

        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        setTimeout(() => w.print(), 400);
    });

    load();
}
