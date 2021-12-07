// require csvtojson module
const fs = require("fs");
const path = require('path')
const { generateMonthlyReport } = require("./generator");

async function getReportData () {
    const data = []
    const files = fs.readdirSync(`./csv/`)

    for (let j = 0; j < files.length; j++) {
        const file = files[j]
        if (file != '.DS_Store') {
            const filename = path.basename(files[j], '.csv')
            const [year, month] = filename.split('-')
            const monthlyResult = await generateMonthlyReport(year, month)
            data.push(monthlyResult)
        }
    }

    return data
}

async function generateReport () {
    const data   = await getReportData()
    const years  = [2014, 2015, 2016, 2017, 2018, 2019, 2020]
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

    const report = {}

    for (let i = 0; i < years.length; i++) {
        const year = years[i];
        const yearReport = {}

        const yearData = data.filter(item => +item.year == year)

        for (let j = 0; j < months.length; j++) {
            const month = months[j];
            const monthReport = yearData.filter(item => +item.month == month)
            if (monthReport && monthReport.length > 0) yearReport[month] = monthReport[0]
        }

        if (yearReport) report[year] = yearReport
    }

    fs.writeFileSync('rawreport.json', JSON.stringify(report));
}

generateReport()