const fs = require('fs');
const pdf = require('pdf-parse');
const https = require('https');

const url = 'https://drive.google.com/uc?export=download&id=1XMjyuNNIn5GeVtyDHWFZyq3cG0rduFaj';
const dest = './tabela_precos.pdf';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 303) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

async function run() {
    console.log('Downloading PDF...');
    await downloadFile(url, dest);
    console.log('Parsing PDF...');
    let dataBuffer = fs.readFileSync(dest);
    pdf(dataBuffer).then(function(data) {
        fs.writeFileSync('./parsed_prices.txt', data.text);
        console.log('Done! Saved to parsed_prices.txt');
    }).catch(err => console.error('Error parsing:', err));
}

run();
