const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./app/data/listings.json', 'utf8'));

const byProvince = {};

data.forEach(item => {
  if (!byProvince[item.province]) {
    byProvince[item.province] = new Set();
  }
  byProvince[item.province].add(item.district);
});

// Convert to arrays and sort
const result = {};
Object.keys(byProvince).sort().forEach(prov => {
  result[prov] = Array.from(byProvince[prov]).sort();
});

console.log(JSON.stringify(result, null, 2));
