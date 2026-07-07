const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('/Users/hirushanperera/Downloads/support.html', 'utf8');
const $ = cheerio.load(html);

// We know the main layout is inside a top level div
const container = $('body > div');

// Function to convert attributes
function convertNode(node) {
    if (node.attribs) {
        if (node.attribs['class']) {
            node.attribs['className'] = node.attribs['class'];
            delete node.attribs['class'];
        }
        // convert svg attributes if any
        const attrs = Object.keys(node.attribs);
        for (const attr of attrs) {
            if (attr === 'stroke-width') {
                node.attribs['strokeWidth'] = node.attribs['stroke-width'];
                delete node.attribs['stroke-width'];
            }
            if (attr === 'stroke-linecap') {
                node.attribs['strokeLinecap'] = node.attribs['stroke-linecap'];
                delete node.attribs['stroke-linecap'];
            }
            if (attr === 'stroke-linejoin') {
                node.attribs['strokeLinejoin'] = node.attribs['stroke-linejoin'];
                delete node.attribs['stroke-linejoin'];
            }
        }
    }
    
    // Check if node is an img and needs to be self closing in JSX
    // cheerio handles this somewhat during render but we can just use xml mode output
    
    node.children?.forEach(convertNode);
}

// Remove the absolute positioning classes on top level blocks
// The top level blocks are direct children of the container
container.children().each((i, el) => {
    let cls = $(el).attr('class') || '';
    cls = cls.replace(/absolute/g, '')
             .replace(/left-\[[^\]]+\]/g, '')
             .replace(/top-\[[^\]]+\]/g, '')
             .replace(/w-\[[^\]]+\]/g, 'w-full')
             .replace(/h-\[[^\]]+\]/g, '') // remove hardcoded heights on containers to allow flow
             .replace(/\s+/g, ' ').trim();
    $(el).attr('class', cls);
    
    // Also check for inner w-[1200px] or w-[1512px] containers and make them responsive
    $(el).find('div').each((_, child) => {
        let childCls = $(child).attr('class') || '';
        childCls = childCls.replace(/w-\[1200px\]/g, 'max-w-7xl mx-auto w-full')
                           .replace(/w-\[1512px\]/g, 'w-full')
                           .replace(/w-\[1152px\]/g, 'w-full')
                           .replace(/w-\[917px\]/g, 'max-w-4xl');
        $(child).attr('class', childCls);
    });
});

// We want to extract the main content blocks and ignore the header/nav and footer
// Looking at the children of the main container:
// index 0, 1: absolute blur blobs (keep them)
// index 2: header/nav (skip)
// index 3: Hero
// index 4: Services & pricing
// index 5: Footer & What we help with (Wait, footer and what we help with are in one container? Let's check)

convertNode(container[0]);

let outHtml = $.xml(container);

// In JSX, img and br must be self-closing. Cheerio's xml mode handles this.

fs.writeFileSync('/Users/hirushanperera/Sites/businesslabels-new/parsed.jsx', outHtml);
