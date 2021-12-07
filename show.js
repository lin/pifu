const fs = require('fs');

let rawreport = JSON.parse(fs.readFileSync('rawreport.json'));
let nurses = ['赵蕊', '尤嘉', '马磊', '付伟', '李如心', '张雪野', '付巍巍', '邹婷', '钱璐', '王鑫', '徐莹', '陈平', '荆小舟']
let nursesReport = {}

// init each nurse
nurses.forEach(nurse => {
    nursesReport[nurse] = {}
    nursesReport[nurse].total = 0
})


// go through year loop
for (const year in rawreport) {
    if (Object.hasOwnProperty.call(rawreport, year)) {

        const yearReport = rawreport[year];
        nurses.forEach(nurse => {
            nursesReport[nurse][year] = {}
            nursesReport[nurse][year].total = 0
        })

        for (const month in yearReport) {
            if (Object.hasOwnProperty.call(yearReport, month)) {
                const monthReport = yearReport[month];
                for (let i = 0; i < nurses.length; i++) {
                    const nurse = nurses[i];
                    const nurseReport = monthReport[nurse]
                    if (nurseReport) {
                        nursesReport[nurse][year].total += nurseReport.saved
                        nursesReport[nurse][year][month] = nurseReport.saved
                    }
                }
            }
        }
    }

    for (let i = 0; i < nurses.length; i++) {
        const nurse = nurses[i];
        nursesReport[nurse].total += nursesReport[nurse][year].total
    }
}

fs.writeFileSync('report.json', JSON.stringify(nursesReport));