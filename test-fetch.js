const http = require('http');
http.get('http://businesslabels.test/api/faq/slug/orientation-benefits-english', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
