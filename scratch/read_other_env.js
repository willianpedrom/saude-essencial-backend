const fs = require('fs');
try {
  const content = fs.readFileSync('/Users/willianmoreira/.gemini/antigravity/scratch/saude-essencial-backend/.env', 'utf8');
  console.log("=== OTHER ENV ===");
  console.log(content);
} catch (e) {
  console.error("Error reading other env:", e.message);
}
