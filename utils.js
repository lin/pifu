const CSVToJSON = require('csvtojson');
const path = require('path')

exports.parseCSV = CSVToJSON().fromFile

exports.getMonth = (file) => {
    path.basename(file, '.csv')
}