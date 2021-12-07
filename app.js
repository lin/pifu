const fs = require("fs");

const { getNursesReport } = require("./src/report");
const { getYearlyReport } = require("./src/yearly");

async function generateJSONFiles () {
    const yearlyReport = await getYearlyReport()
    const nursesReport = await getNursesReport(yearlyReport)

    fs.writeFileSync('yearly.json', JSON.stringify(yearlyReport, null, 4));
    fs.writeFileSync('report.json', JSON.stringify(nursesReport, null, 4));
}

generateJSONFiles()