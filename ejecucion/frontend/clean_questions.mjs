import fs from 'fs';

const buffer = fs.readFileSync('questions.json');
let content = '';

if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    content = buffer.toString('utf16le');
} else {
    content = buffer.toString('utf8');
}

content = content.replace(/^\uFEFF/, '').trim();

const data = JSON.parse(content);

const categories = [];
let currentCategory = null;

data.forEach(item => {
    const text = item['__EMPTY'];
    if (text && /^\d+\.- /.test(text)) {
        currentCategory = {
            title: text.replace(/^\d+\.- /, '').replace(/-\.-$/, '').trim(),
            id: parseInt(text.split('.')[0]),
            questions: []
        };
        categories.push(currentCategory);
    } else if (text && /^\d+\.\d+ /.test(text)) {
        if (currentCategory) {
            currentCategory.questions.push({
                id: text.split(' ')[0],
                text: text.replace(/^\d+\.\d+ /, '').trim()
            });
        }
    }
});

fs.writeFileSync('structured_questions.json', JSON.stringify(categories, null, 2), 'utf8');
console.log('Success: structured_questions.json created');
