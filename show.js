const fs = require('fs');

let report = JSON.parse(fs.readFileSync('report.json'));

console.log(report['2014']);