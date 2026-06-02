const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, '../public');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(publicDir);
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('v=1009')) {
        content = content.replace(/v=1009/g, 'v=1010');
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
});

let swPath = path.join(publicDir, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');
if (swContent.includes('gota-app-v9')) {
    swContent = swContent.replace(/gota-app-v9/g, 'gota-app-v10');
    fs.writeFileSync(swPath, swContent, 'utf8');
    count++;
}

console.log(`Done! Updated ${count} files.`);
