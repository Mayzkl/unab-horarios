const fs = require('fs');

const files = [
    'public/data/data_unab_informatica_2026_1.json',
    'public/data/data_unab_industrial_2026_1.json',
    'public/data/data_unab_construccion_2026_1.json'
];

const names = new Set();

files.forEach(f => {
    try {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        data.sections?.forEach(s => {
            if (s.professor) {
                const clean = s.professor.replace(/\s+/g, ' ').trim();
                names.add(clean);
            }
        });
    } catch(e) {
        console.log('Error leyendo:', f);
    }
});

const sql = [...names]
    .map(n => `('${n.replace(/'/g, "''")}')`)
    .join(',\n');

console.log(`INSERT INTO professors (name) VALUES\n${sql};`);