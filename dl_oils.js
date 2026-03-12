const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'img', 'oils');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const oils = {
    'lavanda': 'https://media.doterra.com/br/pt/images/product/lavender-15ml.jpg',
    'peppermint': 'https://media.doterra.com/br/pt/images/product/peppermint-15ml-min.png',
    'lemon': 'https://media.doterra.com/br/pt/images/product/lemon-15ml.png',
    'zengest': 'https://media.doterra.com/br/pt/images/product/zengest-15ml.png',
    'onguard': 'https://media.doterra.com/br/pt/images/product/on-guard-15ml.jpg',
    'deepblue': 'https://media.doterra.com/br/pt/images/product/deep-blue-5ml-min.png',
    'balance': 'https://media.doterra.com/br/pt/images/product/balance-15ml.png',
    'breathe': 'https://media.doterra.com/br/pt/images/product/breathe-15ml.png',
    'copaiba': 'https://media.doterra.com/br/pt/images/product/copaiba-15ml.jpg',
};

Object.entries(oils).forEach(([name, url]) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if(res.statusCode === 200) {
            const ext = url.endsWith('.png') ? '.png' : '.jpg';
            const file = fs.createWriteStream(path.join(dir, name + ext));
            res.pipe(file);
        } else {
            console.log("Failed " + name + " " + res.statusCode);
        }
    });
});
