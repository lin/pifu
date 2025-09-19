const { NURSES } = require('../legacy/config');
const { getYearlyReport } = require('./yearly');

exports.getNursesReport = async (yearlyReport) => {
    if (!yearlyReport) {
        yearlyReport = await getYearlyReport()
    }

    let nursesReport = {}

    // init each nurse
    NURSES.forEach(nurse => {
        nursesReport[nurse] = {}
        nursesReport[nurse].total = 0
    })

    // go through year loop
    for (const year in yearlyReport) {
        if (Object.hasOwnProperty.call(yearlyReport, year)) {

            const yearReport = yearlyReport[year];
            NURSES.forEach(nurse => {
                nursesReport[nurse][year] = {}
                nursesReport[nurse][year].total = 0
            })

            for (const month in yearReport) {
                if (Object.hasOwnProperty.call(yearReport, month)) {
                    const monthReport = yearReport[month];
                    for (let i = 0; i < NURSES.length; i++) {
                        const nurse = NURSES[i];
                        const nurseReport = monthReport[nurse]
                        if (nurseReport) {
                            nursesReport[nurse][year].total += nurseReport.saved
                            nursesReport[nurse][year][month] = nurseReport.saved
                        }
                    }
                }
            }
        }

        for (let i = 0; i < NURSES.length; i++) {
            const nurse = NURSES[i];
            nursesReport[nurse].total += nursesReport[nurse][year].total
        }
    }

    return nursesReport
}