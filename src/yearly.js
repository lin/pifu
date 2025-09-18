// require csvtojson module
const fs = require("fs");
const path = require('path')
const { getMonthlyReport } = require("./monthly");

// load config
const { YEARS, MONTHS } = require('../config')

async function getRawReport () {
    const rawReport = []
    const files = fs.readdirSync(path.resolve(__dirname, `../csv/`))

    for (let j = 0; j < files.length; j++) {
        const file = files[j]
        if (file != '.DS_Store') {
            const filename = path.basename(files[j], '.csv')
            const [year, month] = filename.split('-')
            const monthlyResult = await getMonthlyReport(year, month)
            rawReport.push(monthlyResult)
        }
    }

    return rawReport
}

exports.getYearlyReport = async () => {
    const data   = await getRawReport()
    const report = {}

    for (let i = 0; i < YEARS.length; i++) {
        const year = YEARS[i];
        const yearReport = {}

        const yearData = data.filter(item => +item.year == year)

        for (let j = 0; j < MONTHS.length; j++) {
            const month = MONTHS[j];
            const monthReport = yearData.filter(item => +item.month == month)
            if (monthReport && monthReport.length > 0) yearReport[month] = monthReport[0]
        }

        if (yearReport) report[year] = yearReport
    }

    return report
}