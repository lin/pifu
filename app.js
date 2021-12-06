// require csvtojson module
const CSVToJSON = require('csvtojson');

const fs = require("fs");
const path = require('path')

const run = async (year, month) => {
    const monthString = `${year}/${month}`
    // convert users.csv file to JSON array
    const nurses = await CSVToJSON().fromFile(`${monthString}.csv`)
    const holidays = nurses[1]

    const result = {}
    result['month'] = monthString
    
    for (let i = 2; i < nurses.length; i++) {
        const nurse = nurses[i];
        const savedDays = getSavedDays(nurse, holidays)
        result[nurse['日期']] = savedDays
    }

    console.log(result);
}

const year = 2015

fs.readdirSync(`./${year}/`).forEach(file => {
    //Print file name
    const month = path.basename(file, '.csv')
    run(year, month)
})


const getSavedDays = (nurse, holidays) => {
    let totalRequireDays = 0
    let totalOnDays      = 0

    for (const day in nurse) {

        if (Object.hasOwnProperty.call(nurse, day)) {

            const kind = nurse[day];

            if (!isNaN(day)) {

                // 算是否应该算上班
                if (
                    holidays[day] != 'Y' 
                &&  kind != '' 
                &&  kind != '产'
                &&  kind != '产'
                &&  kind != '病假'
                &&  kind != 'ICU'
                ) {
                    totalRequireDays++
                }

                // 算上一天半
                if (
                    kind !== '休'
                &&  kind != '' 
                &&  kind != '产'
                &&  kind != '产'
                &&  kind != '病假'
                &&  kind != 'ICU'
                ) {
                    totalOnDays++
                }

                if (kind == '半') {
                    totalOnDays += 0.5
                }
            }
        }
    }

    return totalOnDays - totalRequireDays
}

// run()