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
    { nome: "Mālama", cat: "Blend" },
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
    { nome: "Lifeshōt", cat: "Suplemento" },
    { nome: "Microplex VMz", cat: "Suplemento" },
    { nome: "xEO Mega", cat: "Suplemento" },
    { nome: "Alpha CRS+", cat: "Suplemento" },
    { nome: "PB Assist+ (Probiótico)", cat: "Suplemento" },
    { nome: "TerraZyme", cat: "Suplemento" },
    { nome: "Beauty Power (Colágeno)", cat: "Suplemento" },
    { nome: "MetaPWR Advantage (Colágeno)", cat: "Suplemento" },
    { nome: "MetaPWR Assist", cat: "Suplemento" },
    { nome: "MetaPWR Pastilha", cat: "Suplemento" },
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
    { nome: "Brasil Living Kit", cat: "Kit" },
    { nome: "Colecionador", cat: "Kit" },
    { nome: "Culinária Essencial", cat: "Kit" },
    { nome: "Culinária Essencial Sem Livro de Receitas", cat: "Kit" },
    { nome: "Dawn Umidificador Aromático", cat: "Difusor" },
    { nome: "Diamond", cat: "Kit" },
    { nome: "Difusor de Parede Myst", cat: "Difusor" },
    { nome: "Difusor Volo - Mármore", cat: "Difusor" },
    { nome: "Essencial Para o Lar", cat: "Kit" },
    { nome: "Kit de Apresentação", cat: "Kit" },
    { nome: "Kit de Cuidados para a Pele Veráge", cat: "Kit" },
    { nome: "Kit Início Rápido", cat: "Kit" },
    { nome: "Kids Kit", cat: "Kit" },
    { nome: "Kit Primeiros Cuidados", cat: "Kit" },
    { nome: "Kit Técnica AromaTouch", cat: "Kit" },
    { nome: "Kit Técnica AromaTouch com Difusor", cat: "Kit" },
    { nome: "Livro Culinária Essencial", cat: "Acessório" },
    { nome: "Livro Spa Essencial", cat: "Acessório" },
    { nome: "Soluções Naturais", cat: "Kit" },
    { nome: "Wooden Box", cat: "Acessório" },
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
    { nome: "Creatina Lifepower", cat: "Suplemento" },
    { nome: "Copaíba Pastilha", cat: "Suplemento" },
    { nome: "Kit Gênesis Performance", cat: "Kit" }
];

// ── Tabela de Preços Oficiais doTERRA (por produto + tamanho) ──────────────
// Fonte: Lista de Preços P BR V36_27mai25 (Oficial doTERRA Brasil)
// Formato: { 'Nome Produto': { '15ml': { r: preço_regular, m: preço_membro } } }
const DOTERRA_PRICES = {
    'Adaptiv': { '15ml': { r: 303, m: 227 } },
    'Adaptiv Pastilhas': { 'Unidade / Kit': { r: 247, m: 185 } },
    'Adaptiv Touch': { '10ml Touch': { r: 160, m: 120 } },
    'Air-X': { '15ml': { r: 185, m: 139 } },
    'Alpha CRS+': { 'Cápsulas': { r: 267, m: 200 } },
    'AromaTouch': { '15ml': { r: 232, m: 174 } },
    'Balance': { '15ml': { r: 156, m: 117 } },
    'Basil (Manjericão)': { '15ml': { r: 245, m: 184 }, '5ml': { r: 101, m: 76 } },
    'Beauty Power Collagen Elixir': { 'Unidade / Kit': { r: 250, m: 187 } },
    'Bergamot (Bergamota)': { '15ml': { r: 239, m: 179 }, '5ml': { r: 99, m: 74 } },
    'Black Pepper': { '5ml': { r: 188, m: 141 } },
    'Black Spruce': { '5ml': { r: 132, m: 99 } },
    'Blue Tansy': { '5ml': { r: 532, m: 399 } },
    'Brasil Living Kit': { 'Unidade / Kit': { r: 1007, m: 755 } },
    'Brave Touch': { '10ml Touch': { r: 164, m: 123 } },
    'Breathe': { '15ml': { r: 183, m: 137 } },
    'Breathe Balas': { 'Unidade / Kit': { r: 120, m: 90 } },
    'Breathe Balm Stick': { 'Unidade / Kit': { r: 119, m: 89 } },
    'Breathe Touch': { '10ml Touch': { r: 112, m: 84 } },
    'Breu Branco': { '5ml': { r: 260, m: 195 } },
    'Calmer Touch': { '10ml Touch': { r: 145, m: 109 } },
    'Cardamom (Cardamomo)': { '5ml': { r: 217, m: 163 } },
    'Cassia (Canela-cássia)': { '15ml': { r: 148, m: 111 }, '5ml': { r: 60, m: 45 } },
    'Cedarwood (Cedro)': { '15ml': { r: 109, m: 82 } },
    'Celery Seed': { '15ml': { r: 255, m: 191 }, '5ml': { r: 101, m: 76 } },
    'Cheer': { '5ml': { r: 184, m: 138 } },
    'Cheer Touch': { '10ml Touch': { r: 127, m: 95 } },
    'Cilantro': { '15ml': { r: 220, m: 165 }, '5ml': { r: 75, m: 56 } },
    'Cinnamon Bark (Canela)': { '5ml': { r: 201, m: 151 }, '15ml': { r: 237, m: 178 } },
    'Citronella': { '15ml': { r: 99, m: 74 } },
    'Citrus Bliss': { '15ml': { r: 144, m: 108 } },
    'Clary Sage (Sálvia)': { '15ml': { r: 316, m: 237 }, '5ml': { r: 131, m: 98 } },
    'ClaryCalm': { '10ml Touch': { r: 233, m: 175 } },
    'Clove (Cravo)': { '15ml': { r: 129, m: 97 }, '5ml': { r: 65, m: 49 } },
    'Colecionador': { 'Unidade / Kit': { r: 7993, m: 5995 } },
    'Condicionador Diário': { 'Unidade / Kit': { r: 212, m: 159 } },
    'Condicionador Sem Enxágue': { 'Unidade / Kit': { r: 159, m: 119 } },
    'Console': { '5ml': { r: 303, m: 227 } },
    'Console Touch': { '10ml Touch': { r: 176, m: 132 } },
    'Copaiba (Copaíba)': { '15ml': { r: 287, m: 215 }, '5ml': { r: 121, m: 91 } },
    'Copaiba Touch': { '10ml Touch': { r: 172, m: 129 } },
    'Copaíba Softgels': { 'Cápsulas': { r: 121, m: 91 } },
    'Coriander (Coentro)': { '15ml': { r: 167, m: 125 }, '5ml': { r: 69, m: 52 } },
    'Correct-X Creme Essencial': { 'Unidade / Kit': { r: 129, m: 97 } },
    'Culinária Essencial': { 'Unidade / Kit': { r: 713, m: 535 } },
    'Culinária Essencial Sem Livro': { 'Unidade / Kit': { r: 573, m: 430 } },
    'Cypress (Cipreste)': { '15ml': { r: 141, m: 106 } },
    'DDR Prime': { '15ml': { r: 280, m: 180 } },
    'DDR Prime Pastilha': { 'Cápsulas': { r: 260, m: 195 } },
    'Daily Nutrient Pack': { 'Unidade / Kit': { r: 467, m: 350 } },
    'Dawn Umidificador': { 'Unidade / Kit': { r: 729, m: 547 } },
    'Deep Blue': { '5ml': { r: 252, m: 189 } },
    'Deep Blue Polyphenol': { 'Cápsulas': { r: 189, m: 142 } },
    'Deep Blue Rub': { 'Unidade / Kit': { r: 280, m: 210 } },
    'Deep Blue Rub Travel Pack': { 'Unidade / Kit': { r: 64, m: 48 } },
    'Deep Blue Stick + Copaiba': { 'Unidade / Kit': { r: 185, m: 139 } },
    'Deep Blue Touch': { '10ml Touch': { r: 305, m: 229 } },
    'Diamond': { 'Unidade / Kit': { r: 15993, m: 11995 } },
    'Difusor Pebble': { 'Unidade / Kit': { r: 399, m: 299 } },
    'Difusor Petal 2.0': { 'Unidade / Kit': { r: 532, m: 399 } },
    'Difusor Volo Mármore': { 'Unidade / Kit': { r: 567, m: 425 } },
    'Difusor de Parede Myst': { 'Unidade / Kit': { r: 603, m: 452 } },
    'Douglas Fir': { '5ml': { r: 179, m: 134 } },
    'Elevation': { '15ml': { r: 420, m: 315 } },
    'Erva Baleeira': { '5ml': { r: 239, m: 179 } },
    'Essencial Para o Lar': { 'Unidade / Kit': { r: 2187, m: 1640 } },
    'Eucalyptus (Eucalipto)': { '15ml': { r: 125, m: 94 } },
    'Eucalyptus (Mix/Blend)': { '15ml': { r: 153, m: 115 } },
    'Fennel (Erva-Doce)': { '15ml': { r: 109, m: 82 }, '5ml': { r: 51, m: 38 } },
    'Forgive': { '5ml': { r: 159, m: 119 } },
    'Forgive Touch': { '10ml Touch': { r: 108, m: 81 } },
    'Frankincense (Olíbano)': { '15ml': { r: 519, m: 389 }, '5ml': { r: 204, m: 153 } },
    'Frankincense Touch': { '10ml Touch': { r: 357, m: 268 } },
    'Geranium (Gerânio)': { '15ml': { r: 255, m: 191 }, '5ml': { r: 100, m: 75 } },
    'Ginger (Gengibre)': { '15ml': { r: 287, m: 215 }, '5ml': { r: 103, m: 77 } },
    'Ginger Balas': { 'Unidade / Kit': { r: 120, m: 90 } },
    'Grapefruit (Toranja)': { '15ml': { r: 155, m: 116 }, '5ml': { r: 59, m: 44 } },
    'Green Mandarin': { '15ml': { r: 219, m: 164 }, '5ml': { r: 79, m: 59 } },
    'Guaiacwood': { '15ml': { r: 127, m: 95 } },
    'HD Clear': { '10ml Touch': { r: 143, m: 107 } },
    'Hawaiian Sandalwood (Sândalo)': { '5ml': { r: 567, m: 425 } },
    'Helichrysum (Helicriso)': { '5ml': { r: 651, m: 488 } },
    'Helichrysum Touch': { '10ml Touch': { r: 432, m: 324 } },
    'Hope Touch': { '10ml Touch': { r: 167, m: 125 } },
    'Hygge': { '15ml': { r: 280, m: 210 } },
    'Immortelle': { '15ml': { r: 485, m: 364 } },
    'InTune': { '10ml Touch': { r: 269, m: 202 } },
    'Jasmine Touch': { '10ml Touch': { r: 315, m: 236 } },
    'Juniper Berry (Zimbro)': { '5ml': { r: 157, m: 118 } },
    'Kids Kit': { 'Unidade / Kit': { r: 817, m: 613 } },
    'Kit Cuidados Pele Veráge': { 'Unidade / Kit': { r: 731, m: 548 } },
    'Kit Inicio Rápido': { 'Unidade / Kit': { r: 884, m: 547 } },
    'Kit Primeiros Cuidados': { 'Unidade / Kit': { r: 1311, m: 898 } },
    'Kit Técnica AromaTouch': { 'Unidade / Kit': { r: 873, m: 655 } },
    'Kit Técnica AromaTouch com Difusor': { 'Unidade / Kit': { r: 1307, m: 980 } },
    'Kit de Apresentação': { 'Unidade / Kit': { r: 149, m: 112 } },
    'Lavender (Lavanda)': { '15ml': { r: 197, m: 148 }, '5ml': { r: 83, m: 62 } },
    'Lavender Fields Body Splash': { 'Unidade / Kit': { r: 169, m: 127 } },
    'Lavender Touch': { '10ml Touch': { r: 125, m: 94 } },
    'Lemon (Limão Siciliano)': { '15ml': { r: 92, m: 69 }, '5ml': { r: 39, m: 29 } },
    'Lifeshōt': { '1 litro': { r: 203, m: 152 } },
    'Lemon Eucalyptus': { '15ml': { r: 89, m: 67 } },
    'Lemongrass (Capim-Limão)': { '15ml': { r: 85, m: 64 }, '5ml': { r: 35, m: 26 } },
    'Lifelong Vitality Pack (LLV)': { 'Unidade / Kit': { r: 467, m: 350 } },
    'Lifeshot': { 'Unidade / Kit': { r: 203, m: 152 } },
    'Lifeshot Pack com 2': { 'Unidade / Kit': { r: 381, m: 286 } },
    'Lime (Limão Tahiti)': { '15ml': { r: 115, m: 86 }, '5ml': { r: 47, m: 35 } },
    'Livro Culinária Essencial': { 'Unidade / Kit': { r: 120, m: 90 } },
    'Livro Spa Essencial': { 'Unidade / Kit': { r: 120, m: 90 } },
    'Mālama': { '15ml': { r: 193, m: 145 } },
    'Marjoram (Manjerona)': { '15ml': { r: 171, m: 128 }, '5ml': { r: 71, m: 53 } },
    'Melaleuca (Tea Tree)': { '15ml': { r: 163, m: 122 }, '5ml': { r: 75, m: 56 } },
    'Melaleuca Touch': { '10ml Touch': { r: 105, m: 79 } },
    'Melissa': { '5ml': { r: 785, m: 589 } },
    'MetaPWR Aroma Natural': { '15ml': { r: 239, m: 179 } },
    'MetaPWR Assist': { 'Cápsulas': { r: 97, m: 73 } },
    'MetaPWR Fiber UP': { 'Unidade / Kit': { r: 296, m: 222 } },
    'MetaPWR Pastilha': { '90 pastilhas': { r: 252, m: 189 } },
    'Microplex VMz': { 'Cápsulas': { r: 265, m: 199 } },
    'Mito2Max': { 'Cápsulas': { r: 159, m: 119 } },
    'Motivate': { '5ml': { r: 180, m: 135 } },
    'Motivate Touch': { '10ml Touch': { r: 117, m: 88 } },
    'Myrrh (Mirra)': { '15ml': { r: 524, m: 393 }, '5ml': { r: 199, m: 149 } },
    'On Guard': { '15ml': { r: 259, m: 194 } },
    'On Guard Balas': { 'Unidade / Kit': { r: 120, m: 90 } },
    'On Guard Beadlets': { 'Unidade / Kit': { r: 124, m: 93 } },
    'On Guard Creme Dental': { 'Unidade / Kit': { r: 75, m: 56 } },
    'On Guard Creme Travel Pack': { 'Unidade / Kit': { r: 31, m: 23 } },
    'On Guard Pastilhas': { 'Cápsulas': { r: 199, m: 149 } },
    'On Guard Softgels': { 'Cápsulas': { r: 100, m: 75 } },
    'On Guard Touch': { '10ml Touch': { r: 171, m: 128 } },
    'Oregano (Orégano)': { '15ml': { r: 175, m: 131 }, '5ml': { r: 77, m: 58 } },
    'Oregano Touch': { '10ml Touch': { r: 111, m: 83 } },
    'PB Assist+ (Probiótico)': { 'Cápsulas': { r: 215, m: 161 } },
    'Passion': { '5ml': { r: 327, m: 245 } },
    'Passion Touch': { '10ml Touch': { r: 197, m: 148 } },
    'PastTense': { '10ml Touch': { r: 164, m: 123 } },
    'Patchouli': { '15ml': { r: 235, m: 176 }, '5ml': { r: 91, m: 68 } },
    'Peace': { '5ml': { r: 233, m: 175 } },
    'Peace Touch': { '10ml Touch': { r: 156, m: 117 } },
    'Peppermint (Hortelã-Pimenta)': { '15ml': { r: 177, m: 133 }, '5ml': { r: 73, m: 55 } },
    'Peppermint Beadlets': { 'Unidade / Kit': { r: 112, m: 84 } },
    'Peppermint Softgels': { 'Cápsulas': { r: 73, m: 55 } },
    'Peppermint Touch': { '10ml Touch': { r: 115, m: 86 } },
    'Petitgrain': { '15ml': { r: 183, m: 137 }, '5ml': { r: 73, m: 55 } },
    'Pink Pepper (Pimenta Rosa)': { '5ml': { r: 156, m: 117 } },
    'Pur Femme Eau de Parfum': { 'Unidade / Kit': { r: 385, m: 289 } },
    'Pur Homme Eau de Parfum': { 'Unidade / Kit': { r: 385, m: 289 } },
    'Purify': { '15ml': { r: 151, m: 113 } },
    'Rescuer Touch': { '10ml Touch': { r: 120, m: 90 } },
    'Roman Chamomile (Camomila)': { '5ml': { r: 405, m: 304 } },
    'Rose': { '5ml': { r: 722, m: 542 } },
    'Rose Touch': { '10ml Touch': { r: 499, m: 374 } },
    'Rosemary (Alecrim)': { '15ml': { r: 132, m: 99 }, '5ml': { r: 53, m: 40 } },
    'Salubelle': { '10ml Touch': { r: 580, m: 435 } },
    'Serenity': { '15ml': { r: 265, m: 199 } },
    'Shampoo Protetor': { 'Unidade / Kit': { r: 193, m: 145 } },
    'Siberian Fir': { '15ml': { r: 136, m: 102 }, '5ml': { r: 56, m: 42 } },
    'Smart & Sassy': { '15ml': { r: 220, m: 165 }, '5ml': { r: 84, m: 63 } },
    'Soluções Naturais': { 'Unidade / Kit': { r: 3987, m: 2990 } },
    'Spa Citrus Bliss Loção': { 'Unidade / Kit': { r: 85, m: 64 } },
    'Spa Esfoliante para o Corpo': { 'Unidade / Kit': { r: 200, m: 150 } },
    'Spa Loção para Mãos e Corpo': { 'Unidade / Kit': { r: 132, m: 99 } },
    'Spa Manteiga Hidratante': { 'Unidade / Kit': { r: 212, m: 159 } },
    'Spa Sabonete Hidratante': { 'Unidade / Kit': { r: 105, m: 79 } },
    'Spearmint': { '15ml': { r: 211, m: 158 }, '5ml': { r: 79, m: 59 } },
    'Spikenard': { '5ml': { r: 447, m: 335 } },
    'Steady Touch': { '10ml Touch': { r: 121, m: 91 } },
    'Stronger Touch': { '10ml Touch': { r: 115, m: 86 } },
    'SuperMint': { '15ml': { r: 193, m: 145 } },
    'SuperMint Beadlets': { 'Unidade / Kit': { r: 145, m: 109 } },
    'Tamer Touch': { '10ml Touch': { r: 113, m: 85 } },
    'Tangerine (Tangerina)': { '15ml': { r: 124, m: 93 }, '5ml': { r: 55, m: 41 } },
    'TerraShield': { '15ml': { r: 87, m: 65 } },
    'TerraShield Spray': { '30ml': { r: 159, m: 119 } },
    'TerraZyme': { 'Cápsulas': { r: 207, m: 155 } },
    'Thinker Touch': { '10ml Touch': { r: 128, m: 96 } },
    'Thyme (Tomilho)': { '15ml': { r: 233, m: 175 }, '5ml': { r: 99, m: 74 } },
    'TriEase Pastilha': { 'Cápsulas': { r: 237, m: 178 } },
    'TrimShake Chocolate': { 'Unidade / Kit': { r: 211, m: 158 } },
    'TrimShake Vanilla': { 'Unidade / Kit': { r: 211, m: 158 } },
    'Turmeric (Cúrcuma)': { '15ml': { r: 233, m: 175 } },
    'Turmeric Pastilhas': { 'Cápsulas': { r: 199, m: 149 } },
    'VM Complex': { 'Cápsulas': { r: 248, m: 186 } },
    'Veráge Creme Hidratante': { 'Unidade / Kit': { r: 243, m: 182 } },
    'Veráge Hidratante': { 'Unidade / Kit': { r: 211, m: 158 } },
    'Veráge Salubelle Sérum': { 'Unidade / Kit': { r: 452, m: 339 } },
    'Veráge Solução de Limpeza': { 'Unidade / Kit': { r: 216, m: 162 } },
    'Veráge Tônico': { 'Unidade / Kit': { r: 289, m: 217 } },
    'Vetiver': { '15ml': { r: 409, m: 307 }, '5ml': { r: 173, m: 130 } },
    'Vetiver Touch': { '10ml Touch': { r: 264, m: 198 } },
    'Whisper Touch': { '5ml': { r: 119, m: 89 } },
    'Wild Orange (Laranja Doce)': { '15ml': { r: 89, m: 67 }, '5ml': { r: 35, m: 26 } },
    'Wintergreen': { '15ml': { r: 143, m: 107 } },
    'Wooden Box': { 'Unidade / Kit': { r: 105, m: 79 } },
    'Yarrow Pom': { '30ml': { r: 728, m: 546 }, '15ml': { r: 360, m: 270 } },
    'Yarrow Pom Sérum Firmador': { 'Unidade / Kit': { r: 553, m: 415 } },
    'Ylang Ylang': { '15ml': { r: 299, m: 224 }, '5ml': { r: 123, m: 92 } },
    'ZenGest': { '15ml': { r: 257, m: 193 } },
    'ZenGest Pastilhas': { 'Cápsulas': { r: 172, m: 129 } },
    'ZenGest Softgels': { 'Cápsulas': { r: 172, m: 129 } },
    'ZenGest Touch': { '10ml Touch': { r: 176, m: 132 } },
    'Zendocrine': { '15ml': { r: 197, m: 148 }, '5ml': { r: 79, m: 59 } },
    'Zendocrine Pastilhas': { 'Cápsulas': { r: 185, m: 139 } },
    'xEO Mega': { 'Cápsulas': { r: 360, m: 270 } },
    'xEO Mega Omega': { 'Cápsulas': { r: 360, m: 270 } },
    'Óleo de Coco Fracionado': { 'Unidade / Kit': { r: 113, m: 85 } },
    'Creatina Lifepower': { 'Unidade / Kit': { r: 239, m: 179 } },
    'Copaíba Pastilha': { 'Unidade / Kit': { r: 252, m: 189 } },
    'Kit Gênesis Performance': { 'Unidade / Kit': { r: 787, m: 590 } },
};

// Mapa de typos comuns e aliases de nome que não casam via fuzzy
const DOTERRA_ALIASES = {
    'kit início rápido': 'Kit Inicio Rápido',
    'lifeshot': 'Lifeshōt',
    'lifeshōt': 'Lifeshōt',
    'culinária essencial sem livro de receitas': 'Culinária Essencial Sem Livro',
    'dawn umidificador aromático': 'Dawn Umidificador',
    'difusor volo - mármore': 'Difusor Volo Mármore',
    'kit de cuidados para a pele veráge': 'Kit Cuidados Pele Veráge',
    'kit técnica aromatouch': 'Kit Técnica AromaTouch',
    'kit técnica aromatouch com difusor': 'Kit Técnica AromaTouch com Difusor',
    'malama': 'Mālama',
    'mālama': 'Mālama',
    'citronela': 'Citronella',
    'metapwr fiberup': 'MetaPWR Fiber UP',
    'metapwr pastilhas': 'MetaPWR Pastilha',
    'beauty power (colágeno)': 'Beauty Power Collagen Elixir',
    'beauty power': 'Beauty Power Collagen Elixir',
    'metapwr blend': 'MetaPWR Aroma Natural',
    'metapwr': 'MetaPWR Aroma Natural',
    'barsil': 'Basil',
    'basil': 'Basil (Manjericão)',
    'manjericao': 'Basil (Manjericão)',
    'olibano': 'Frankincense (Olíbano)',
    'frankincense': 'Frankincense (Olíbano)',
    'melaleuca': 'Melaleuca (Tea Tree)',
    'teatree': 'Melaleuca (Tea Tree)',
    'tea tree': 'Melaleuca (Tea Tree)',
    'wild orange': 'Wild Orange (Laranja Doce)',
    'laranja': 'Wild Orange (Laranja Doce)',
    'hortelha': 'Peppermint (Hortelã-Pimenta)',
    'peppermint': 'Peppermint (Hortelã-Pimenta)',
    'geranio': 'Gerânio',
    'gerânio': 'Gerânio',
    'curcuma': 'Turmeric (Cúrcuma)',
    'cúrcuma': 'Turmeric (Cúrcuma)',
    'cassia': 'Cassia (Canela-cássia)',
    'cássia': 'Cassia (Canela-cássia)',
    'lemon': 'Lemon (Limão Siciliano)',
    'limao': 'Lemon (Limão Siciliano)',
    'lime': 'Lime (Limão Tahiti)',
    'copaiba': 'Copaíba',
    'copaíba': 'Copaíba',
    'rosemary': 'Rosemary (Alecrim)',
    'alecrim': 'Rosemary (Alecrim)',
    'ginger': 'Ginger (Gengibre)',
    'gengibre': 'Ginger (Gengibre)',
    'bergamot': 'Bergamot (Bergamota)',
    'eucalipto': 'Eucalyptus (Eucalipto)',
    'eucalyptus': 'Eucalyptus (Eucalipto)',
    'myrrh': 'Myrrh (Mirra)',
    'mirra': 'Myrrh (Mirra)',
    'helichrysum': 'Helichrysum (Helicriso)',
    'helicriso': 'Helichrysum (Helicriso)',
    'sandalo': 'Sândalo',
    'cedarwood': 'Cedro (Cedarwood)',
    'cedro': 'Cedro (Cedarwood)',
    'forgive': 'Forgive (Mix Renovador)',
    'console': 'Console (Mix Consolador)',
    'cheer': 'Cheer (Mix Animador)',
    'motivate': 'Motivate (Mix Encorajador)',
    'peace': 'Peace (Mix Tranquilizador)',
    'passion': 'Passion (Mix Inspirador)',
    'whisper': 'Whisper (Mix para Mulheres)',
    'purify': 'Purify (Mix Purificador)',
    'terrashield': 'TerraShield (Mix Repelente)',
    'zendocrine': 'Zendocrine (Mix Desintoxicante)',
    'citrus bliss': 'Citrus Bliss (Mix Revigorante)',
    'onguard': 'On Guard (Mix Protetor)',
    'on guard': 'On Guard (Mix Protetor)',
    'breathe': 'Breathe / Clarify (Mix Respiratório)',
    'clarify': 'Breathe / Clarify (Mix Respiratório)',
    'deepblue': 'Deep Blue (Mix Suavizante)',
    'deep blue': 'Deep Blue (Mix Suavizante)',
    'zengest': 'ZenGest / DigestZen (Mix Digestivo)',
    'digestzen': 'ZenGest / DigestZen (Mix Digestivo)',
    'serenity': 'Serenity (Mix Repousante)',
    'balance': 'Balance (Mix Aterrador)',
    'intune': 'InTune (Mix Foco)',
    'in tune': 'InTune (Mix Foco)',
    'aromatouch': 'AromaTouch',
    'aroma touch': 'AromaTouch',
    'pastense': 'PastTense (Mix Tensão)',
    'past tense': 'PastTense (Mix Tensão)',
    'clarycalm': 'ClaryCalm (Mix Mensal Mulher)',
    'clary calm': 'ClaryCalm (Mix Mensal Mulher)',
    'elevation': 'Elevation (Mix Alegre)',
    'ddr prime': 'DDR Prime',
    'ddprime': 'DDR Prime',
    'slim & sassy (mix metabólico)': 'Smart & Sassy',
    'slim sassy': 'Smart & Sassy',
    'slim&sassy': 'Smart & Sassy',
    'metapwr': 'MetaPWR Aroma Natural',
    'immortelle': 'Immortelle',
    'guaiacwood': 'Guaiacwood',
    'anchor': 'Anchor (Yoga)',
    'align': 'Align (Yoga)',
    'arise': 'Arise (Yoga)',
};

/** Retorna preços doTERRA para produto+tamanho: { r, m } ou null se o tamanho não existe para este produto */
function getDotPrices(nomeProduto, tamanho) {
    if (!nomeProduto) return null;
    const orig = nomeProduto.trim();
    const lower = orig.toLowerCase();

    // 0. Alias direto (typos e nomes curtos mapeados explicitamente)
    const aliasKey = DOTERRA_ALIASES[lower];
    if (aliasKey && DOTERRA_PRICES[aliasKey]) {
        const e = DOTERRA_PRICES[aliasKey];
        // Retorna o tamanho exato; se não existe, retorna null (não usa fallback)
        return e[tamanho] || null;
    }

    // 1. Match exato
    let entry = DOTERRA_PRICES[orig];

    // 2. Case-insensitive exact
    if (!entry) {
        for (const key of Object.keys(DOTERRA_PRICES)) {
            if (key.toLowerCase() === lower) { entry = DOTERRA_PRICES[key]; break; }
        }
    }

    // 2.5 Tokens Exact Matching (trata inversões tipo "Nome (Name)" vs "Name (Nome)")
    if (!entry) {
        const getTokens = s => {
            const out = s.replace(/\(.*?\)/g, '').trim().toLowerCase();
            const match = s.match(/\((.*?)\)/);
            const ins = match ? match[1].trim().toLowerCase() : '';
            return [out, ins].filter(Boolean);
        };
        const lowerTokens = getTokens(orig);
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const keyTokens = getTokens(key);
            // Se algum token for exatamente igual, é o produto certo
            if (lowerTokens.some(t => keyTokens.includes(t))) {
                entry = DOTERRA_PRICES[key];
                break;
            }
        }
    }

    // 3. Fuzzy parcial: chave começa com o nome ou vice-versa, ou um contém o outro
    if (!entry) {
        const stripped = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
        let bestKey = null;
        let minLen = Infinity;
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
            
            // Só cai em includes/startsWith se nenhuma das palavras exatas bateram antes
            if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) ||
                kl.includes(lower) || lower.includes(kl) ||
                (stripped.length > 3 && (kl.startsWith(stripped) || stripped.startsWith(kl)))) {
                
                // Penaliza muito substrings que não começam no início da palavra para evitar que "Lemon" ganhe de "Lemongrass" só por includes
                const startsMatch = kl.startsWith(stripped) || stripped.startsWith(kl);
                const score = kl.length + (startsMatch ? 0 : 100);

                if (score < minLen) {
                    minLen = score;
                    bestKey = key;
                }
            }
        }
        if (bestKey) entry = DOTERRA_PRICES[bestKey];
    }

    if (!entry) return null;
    
    let price = entry[tamanho];
    if (!price) {
        if (tamanho === 'Gramas' || tamanho === 'Outro') price = entry['Unidade / Kit'] || entry['Cápsulas'];
        if (tamanho === 'Cápsulas') price = entry['Unidade / Kit'];
        if (tamanho === 'Unidade / Kit') price = entry['Cápsulas'] || entry['Gramas'];
        
        const availableSizes = Object.keys(entry);
        if (!price && availableSizes.length === 1) {
            price = entry[availableSizes[0]];
        }
    }
    return price || null;
}

/** Retorna todos os tamanhos disponíveis para um produto */
function getDotSizes(nomeProduto) {
    if (!nomeProduto) return null;
    const orig = nomeProduto.trim();
    const lower = orig.toLowerCase();

    const aliasKey = DOTERRA_ALIASES[lower];
    if (aliasKey && DOTERRA_PRICES[aliasKey]) return DOTERRA_PRICES[aliasKey];

    let entry = DOTERRA_PRICES[orig];
    if (!entry) {
        for (const key of Object.keys(DOTERRA_PRICES)) {
            if (key.toLowerCase() === lower) { entry = DOTERRA_PRICES[key]; break; }
        }
    }
    // 2.5 Tokens Exact Matching
    if (!entry) {
        const getTokens = s => {
            const out = s.replace(/\(.*?\)/g, '').trim().toLowerCase();
            const match = s.match(/\((.*?)\)/);
            const ins = match ? match[1].trim().toLowerCase() : '';
            return [out, ins].filter(Boolean);
        };
        const lowerTokens = getTokens(orig);
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const keyTokens = getTokens(key);
            if (lowerTokens.some(t => keyTokens.includes(t))) {
                entry = DOTERRA_PRICES[key];
                break;
            }
        }
    }

    if (!entry) {
        const stripped = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
        let bestKey = null;
        let minLen = Infinity;
        for (const key of Object.keys(DOTERRA_PRICES)) {
            const kl = key.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
            if (kl === stripped || kl.startsWith(lower) || lower.startsWith(kl) ||
                kl.includes(lower) || lower.includes(kl) ||
                (stripped.length > 3 && (kl.startsWith(stripped) || stripped.startsWith(kl)))) {
                
                const startsMatch = kl.startsWith(stripped) || stripped.startsWith(kl);
                const score = kl.length + (startsMatch ? 0 : 100);

                if (score < minLen) {
                    minLen = score;
                    bestKey = key;
                }
            }
        }
        if (bestKey) entry = DOTERRA_PRICES[bestKey];
    }
    return entry || null;
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
                                <option>30ml</option>
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
        const allSizes = getDotSizes(nome);
        if (!pricePreview) return;

        if (!prices) {
            // Se o produto existe na tabela mas o tamanho específico não tem preço, mostra aviso
            if (allSizes) {
                const sizesDisponiveis = Object.keys(allSizes).join(', ');
                pricePreview.style.display = 'block';
                pricePreview.innerHTML = `
                  <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:10px;font-size:0.82rem;color:#92400e">
                    ⚠️ Preço não cadastrado para <strong>${esc(size)}</strong> de "${esc(nome)}".<br>
                    Tamanhos disponíveis: <strong>${esc(sizesDisponiveis)}</strong>
                  </div>
                `;
            } else {
                pricePreview.style.display = 'none';
            }
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
