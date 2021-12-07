
const CSVToJSON = require('csvtojson');

exports.generateMonthlyReport = async (year, month) => {
    const nurses = await CSVToJSON().fromFile(`./csv/${year}-${month}.csv`)
    const holidays = nurses[1]

    const result = {
        year:  year,
        month: month
    }
    
    for (let i = 2; i < nurses.length; i++) {
        const nurse = nurses[i];
        const required = getRequiredDays(nurse, holidays)
        const fulfilled = getFulfilledDays(nurse)
        const saved = fulfilled - required
        result[nurse['护士']] = {
            required,
            fulfilled,
            saved
        }
    }

    result.raw = nurses

    return result
}


const getRequiredDays = (nurse, holidays) => {
    let totalRequiredDays = 0

    for (const day in nurse) {

        if (Object.hasOwnProperty.call(nurse, day)) {

            const kind = nurse[day].trim()
            const notHoliday = holidays[day].trim() != 'Y' 

            if (!isNaN(day)) {
                if ( isRequiredDay(kind, notHoliday) ) {
                    totalRequiredDays++
                }
            }
        }
    }

    return totalRequiredDays
}

const getFulfilledDays = (nurse) => {
    let totalOnDays = 0

    for (const day in nurse) {

        if (Object.hasOwnProperty.call(nurse, day)) {

            const kind = nurse[day].trim();

            if (!isNaN(day)) {
                if (kind == '半') {
                    totalOnDays += 0.5
                } else if (kind == '哺乳半') {
                    // 8个小时，其中两个小时算上班（合理休息）
                    // 但应该还上6个小时，实际上了四个小时
                    // 所以一天，相当于上了8个小时中的6个小时
                    totalOnDays += 0.75
                } else if (kind == '哺乳休') {
                    // 8个小时，其中两个小时算上班（合理休息）
                    // 但应该还上6个小时，属于欠假
                    // 所以一天，相当于上了8个小时中的2个小时
                    totalOnDays += 0.25
                } else if (kind == '下') {
                    if (+day != 1 && nurse[day - 1] == '小') {
                        totalOnDays += 1.5
                    }
                } else if ( isOnDay(kind) ) {
                    totalOnDays++
                }
            }
        }
    }

    return totalOnDays
}

const isRequiredDay = (kind, notHoliday) => {

    return  notHoliday 
        &&  kind != '' 
        &&  kind != '病假'
        &&  kind != '产假'
        &&  kind != '婚假'
        &&  kind != '群力'
        &&  kind != '发热病房'
        &&  kind != '隔离'
        &&  kind != '眼二'
        &&  kind != 'ICU'
        &&  kind != '神内'
}

const isOnDay = (kind) => {

    return  kind != '休'
        &&  kind != '' 
        &&  kind != '病假'
        &&  kind != '产假'
        &&  kind != '婚假'
        &&  kind != '群力'
        &&  kind != '发热病房'
        &&  kind != '隔离'
        &&  kind != '眼二'
        &&  kind != 'ICU'
        &&  kind != '神内'
}