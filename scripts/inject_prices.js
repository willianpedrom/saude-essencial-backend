const fs = require('fs');
const path = require('path');

const priceTable = {
    'Lavanda': [
        { size: '15 ml', regular: 197.00, member: 148.00, pv: 23 },
        { size: '5 ml', regular: 83.00, member: 62.00, pv: 10 },
        { size: '10 ml Touch', regular: 125.00, member: 94.00, pv: 16 }
    ],
    'Peppermint': [
        { size: '15 ml', regular: 177.00, member: 133.00, pv: 23 },
        { size: '5 ml', regular: 73.00, member: 55.00, pv: 9 },
        { size: '10 ml Touch', regular: 115.00, member: 86.00, pv: 15 }
    ],
    'Lemon': [
        { size: '15 ml', regular: 92.00, member: 69.00, pv: 11 },
        { size: '5 ml', regular: 39.00, member: 29.00, pv: 4 }
    ],
    'Melaleuca': [
        { size: '15 ml', regular: 163.00, member: 122.00, pv: 21 },
        { size: '10 ml Touch', regular: 105.00, member: 79.00, pv: 14 }
    ],
    'Frankincense': [
        { size: '15 ml', regular: 519.00, member: 389.00, pv: 64 },
        { size: '5 ml', regular: 204.00, member: 153.00, pv: 27 },
        { size: '10 ml Touch', regular: 357.00, member: 268.00, pv: 50 }
    ],
    'Copaiba': [
        { size: '15 ml', regular: 287.00, member: 215.00, pv: 40 },
        { size: '5 ml', regular: 121.00, member: 91.00, pv: 16 },
        { size: '10 ml Touch', regular: 172.00, member: 129.00, pv: 23 }
    ],
    'Tangerina': [
        { size: '15 ml', regular: 124.00, member: 93.00, pv: 17 },
        { size: '5 ml', regular: 55.00, member: 41.00, pv: 7 }
    ],
    'Wild Orange': [
        { size: '15 ml', regular: 89.00, member: 67.00, pv: 12 },
        { size: '5 ml', regular: 35.00, member: 26.00, pv: 4 }
    ],
    'ZenGest': [
        { size: '15 ml', regular: 257.00, member: 193.00, pv: 35 },
        { size: '5 ml', regular: 105.00, member: 79.00, pv: 14 },
        { size: 'Roll-on 10 ml', regular: 176.00, member: 132.00, pv: 23 }
    ],
    'On Guard': [
        { size: '15 ml', regular: 259.00, member: 194.00, pv: 36 },
        { size: '5 ml', regular: 100.00, member: 75.00, pv: 14 },
        { size: '10 ml Touch', regular: 171.00, member: 128.00, pv: 24 }
    ],
    'Breathe': [
        { size: '15 ml', regular: 183.00, member: 137.00, pv: 23 },
        { size: '10 ml Touch', regular: 112.00, member: 84.00, pv: 15 }
    ],
    'Deep Blue': [
        { size: '5 ml', regular: 252.00, member: 189.00, pv: 36 },
        { size: '10 ml Touch', regular: 305.00, member: 229.00, pv: 43 }
    ],
    'Balance': [
        { size: '15 ml', regular: 156.00, member: 117.00, pv: 21 }
    ],
    'Adaptiv': [
        { size: '15 ml', regular: 303.00, member: 227.00, pv: 37 },
        { size: '10 ml Touch', regular: 160.00, member: 120.00, pv: 20 }
    ],
    'Serenity': [
        { size: '15 ml', regular: 265.00, member: 199.00, pv: 34 }
    ],
    'ClaryCalm': [
        { size: '10 ml Roll-on', regular: 233.00, member: 175.00, pv: 28 }
    ],
    'PastTense': [
        { size: '10 ml Roll-on', regular: 164.00, member: 123.00, pv: 20 }
    ],
    'Oregano': [
        { size: '15 ml', regular: 175.00, member: 131.00, pv: 23 },
        { size: '5 ml (Ingestão)', regular: 77.00, member: 58.00, pv: 10 },
        { size: '10 ml Touch', regular: 111.00, member: 83.00, pv: 15 }
    ],
    'Rosemary': [
        { size: '15 ml', regular: 132.00, member: 99.00, pv: 16 },
        { size: '5 ml', regular: 53.00, member: 40.00, pv: 6 }
    ],
    'Clary Sage': [
        { size: '15 ml', regular: 316.00, member: 237.00, pv: 41 }
    ],
    'Ylang Ylang': [
        { size: '15 ml', regular: 299.00, member: 224.00, pv: 37 },
        { size: '5 ml', regular: 123.00, member: 92.00, pv: 15 }
    ],
    'Bergamota': [
        { size: '15 ml', regular: 239.00, member: 179.00, pv: 31 }
    ],
    'Cedarwood': [
        { size: '15 ml', regular: 109.00, member: 82.00, pv: 14 }
    ],
    'Vetiver': [
        { size: '15 ml', regular: 409.00, member: 307.00, pv: 39 },
        { size: '5 ml', regular: 173.00, member: 130.00, pv: 18 }
    ],
    'Ginger': [
        { size: '15 ml', regular: 287.00, member: 215.00, pv: 33 },
        { size: '5 ml', regular: 103.00, member: 77.00, pv: 10 }
    ],
    'Geranium': [
        { size: '15 ml', regular: 255.00, member: 191.00, pv: 31 },
        { size: '5 ml', regular: 100.00, member: 75.00, pv: 12 }
    ],
    'Helichrysum': [
        { size: '5 ml', regular: 651.00, member: 488.00, pv: 65 },
        { size: '10 ml Touch', regular: 432.00, member: 324.00, pv: 50 }
    ],
    'Myrrh': [
        { size: '15 ml', regular: 524.00, member: 393.00, pv: 51 },
        { size: '5 ml', regular: 199.00, member: 149.00, pv: 19 }
    ],
    'Patchouli': [
        { size: '15 ml', regular: 235.00, member: 176.00, pv: 29 },
        { size: '5 ml', regular: 91.00, member: 68.00, pv: 11 }
    ],
    'Roman Chamomile': [
        { size: '5 ml', regular: 405.00, member: 304.00, pv: 51 }
    ],
    'Sandalwood': [
        { size: '5 ml', regular: 567.00, member: 425.00, pv: 60 }
    ],
    'Thyme': [
        { size: '15 ml', regular: 233.00, member: 175.00, pv: 28 },
        { size: '5 ml', regular: 99.00, member: 74.00, pv: 11 }
    ],
    'Wintergreen': [
        { size: '15 ml', regular: 143.00, member: 107.00, pv: 18 }
    ],
    'Black Pepper': [
        { size: '5 ml', regular: 188.00, member: 141.00, pv: 25 }
    ],
    'Cardamom': [
        { size: '5 ml', regular: 217.00, member: 163.00, pv: 29 }
    ],
    'Marjoram': [
        { size: '15 ml', regular: 171.00, member: 128.00, pv: 21 },
        { size: '5 ml', regular: 71.00, member: 53.00, pv: 8 }
    ],
    'Lemongrass': [
        { size: '15 ml', regular: 85.00, member: 64.00, pv: 11 },
        { size: '5 ml', regular: 35.00, member: 26.00, pv: 4 }
    ],
    'Elevation': [
        { size: '15 ml', regular: 420.00, member: 315.00, pv: 42 }
    ],
    'InTune': [
        { size: '10 ml Roll-on', regular: 269.00, member: 202.00, pv: 32 }
    ],
    'Zendocrine': [
        { size: '15 ml', regular: 197.00, member: 148.00, pv: 24 }
    ],
    'Whisper': [
        { size: '5 ml Touch', regular: 119.00, member: 89.00, pv: 15 }
    ],
    'Motive': [
        { size: '5 ml', regular: 180.00, member: 135.00, pv: 24 },
        { size: '10 ml Touch', regular: 117.00, member: 88.00, pv: 15 }
    ],
    'Rosa': [
        { size: '10 ml Touch', regular: 499.00, member: 374.00, pv: 65 }
    ],
    'Green Mandarin': [
        { size: '15 ml', regular: 219.00, member: 164.00, pv: 28 },
        { size: '5 ml', regular: 79.00, member: 59.00, pv: 10 }
    ],
    'Siberian Fir': [
        { size: '15 ml', regular: 136.00, member: 102.00, pv: 19 },
        { size: '5 ml', regular: 56.00, member: 42.00, pv: 7 }
    ],
    'Cúrcuma': [
        { size: '15 ml', regular: 233.00, member: 175.00, pv: 28 }
    ],
    'Canela': [
        { size: '15 ml (Cassia)', regular: 148.00, member: 111.00, pv: 20 },
        { size: '5 ml (Cinnamon Bark)', regular: 201.00, member: 151.00, pv: 24 }
    ],
    'Cravo': [
        { size: '15 ml', regular: 129.00, member: 97.00, pv: 16 },
        { size: '5 ml', regular: 65.00, member: 49.00, pv: 7 }
    ],
    'Grapefruit': [
        { size: '15 ml', regular: 155.00, member: 116.00, pv: 17 },
        { size: '5 ml', regular: 59.00, member: 44.00, pv: 8 }
    ],
    'Citrus Bliss': [
        { size: '15 ml', regular: 144.00, member: 108.00, pv: 17 }
    ],
    'Purify': [
        { size: '15 ml', regular: 151.00, member: 113.00, pv: 20 }
    ],
    'TerraShield': [
        { size: '15 ml', regular: 87.00, member: 65.00, pv: 11 }
    ],
    'DDR Prime': [
        { size: '15 ml', regular: 280.00, member: 210.00, pv: 29 }
    ],
    'Slim & Sassy': [
        { size: '15 ml', regular: 220.00, member: 165.00, pv: 28 }
    ],
    'MetaPWR': [
        { size: '15 ml', regular: 239.00, member: 179.00, pv: 27 }
    ],
    'Deep Blue Rub': [
        { size: '120 ml', regular: 280.00, member: 210.00, pv: 33 }
    ],
    'Óleo de Coco Fracionado': [
        { size: '115 ml', regular: 113.00, member: 85.00, pv: 12 }
    ],
    'Guaiacwood': [
        { size: '15 ml', regular: 127.00, member: 95.00, pv: 17 }
    ],
    'Cilantro': [
        { size: '15 ml', regular: 220.00, member: 165.00, pv: 29 }
    ],
    'Eucalyptus': [
        { size: '15 ml', regular: 125.00, member: 94.00, pv: 16 }
    ],
    'Fennel': [
        { size: '15 ml', regular: 109.00, member: 82.00, pv: 14 }
    ],
    'Celery Seed': [
        { size: '15 ml', regular: 255.00, member: 191.00, pv: 31 }
    ],
    'Melissa': [
        { size: '5 ml', regular: 785.00, member: 589.00, pv: 76 }
    ]
};

const dataFilePath = path.join(__dirname, '../public/js/data.js');
let dataContent = fs.readFileSync(dataFilePath, 'utf8');

// The objects are like: 'Lavanda': { nameEn: '...", ... },
for (const [key, sizes] of Object.entries(priceTable)) {
    const regex = new RegExp(`('${key}'\\s*:\\s*{[^}]*)(})`);
    dataContent = dataContent.replace(regex, (match, p1) => {
        return `${p1}, sizes: ${JSON.stringify(sizes)} }`;
    });
}

fs.writeFileSync(dataFilePath, dataContent);
console.log('Preços injetados com sucesso.');
