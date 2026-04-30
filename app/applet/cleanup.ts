import fs from 'fs';
let content = fs.readFileSync('src/lib/postUtmeQuestions.ts', 'utf-8');

// Replace the literal "\n" string in the JSON part with actual newlines or nothing.
// The file seems to contain escaped newlines `\n` that are now treated as part of the string or breaking the JSON.
// They seem to be literal characters `\` followed by `n` in the source file, not actual newlines.
// If I want them to be valid TS, they should just be newlines, not `\n` inside the string literals for JSON objects.

// Or I can just remove them for now.
content = content.replace(/\\n/g, ''); 
fs.writeFileSync('src/lib/postUtmeQuestions.ts', content);
console.log('Fixed postUtmeQuestions.ts format');
