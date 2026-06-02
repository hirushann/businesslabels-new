const fs = require('fs');

const html = fs.readFileSync('/Users/hirushanperera/.gemini/antigravity-ide/brain/012927f3-0525-4a4f-9d7e-1c568844db14/.system_generated/steps/213/content.md', 'utf8');

// Try to find the main content blocks. Elementor uses div.elementor-section
const cheerio = require('cheerio');
const $ = cheerio.load(html);

const sections = [];
$('.elementor-section').each((i, el) => {
    sections.push($(el).text().replace(/\s+/g, ' ').trim());
});

console.log("Found " + sections.length + " sections");
sections.forEach((s, i) => {
    if (s.length > 0) {
        console.log(`\n--- Section ${i} ---`);
        console.log(s.substring(0, 500));
    }
});
