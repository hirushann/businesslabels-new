const http = require('http');
http.get('http://businesslabels.test/api/faq', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.parse(data)));
});
