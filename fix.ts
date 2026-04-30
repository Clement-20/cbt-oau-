import fs from 'fs';
let content = fs.readFileSync('src/lib/postUtmeQuestions.ts', 'utf-8');
content = content.replace(/\\\\n/g, '\\n');
fs.writeFileSync('src/lib/postUtmeQuestions.ts', content);
console.log('Fixed newlines');
