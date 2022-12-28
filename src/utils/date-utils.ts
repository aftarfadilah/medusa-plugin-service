export function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getUTCMonth() + 1),
        day = '' + d.getUTCDate(),
        year = d.getUTCFullYear();
  
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
  
    return [year, month, day].join('-');
}

export function addDay(date, day) {
    const d = new Date(date)
    d.setUTCDate(d.getUTCDate() + day)
    return new Date(d)
}

export function subDay(date, day) {
    const d = new Date(date)
    d.setUTCDate(d.getUTCDate() - day)
    return new Date(d)
}
  

export function divideTimes(f: Date, t: Date, byMinutes: number = 5) {
    const minutes = (t.getTime() - f.getTime())/1000/60
    const result = []
    
    for (let i = 0; i < (minutes/byMinutes); i++) {
        const dateNow = new Date(f)
        dateNow.setUTCMinutes(f.getUTCMinutes() + (byMinutes * i))
        const key = formatDate(dateNow)
        if (!result[key]) result[key] = []
        let hours: any = dateNow.getUTCHours()
        let minutes: any = dateNow.getUTCMinutes()
        if (hours < 10) hours = `0${hours}`
        if (minutes < 10) minutes = `0${minutes}`
        result[key].push(`${hours}:${minutes}`)
    }

    return result
}

export function countDays(from, to) {
    const date1 = new Date(from);
    const date2 = new Date(to);
    const differenceInTime = date2.getTime() - date1.getTime();
    const differenceInDays = differenceInTime / (1000 * 60 * 60 * 24);
    return differenceInDays
}

export function zeroTimes(date) {
    const x = new Date(date)
    x.setUTCHours(0)
    x.setUTCMinutes(0)
    x.setUTCSeconds(0)
    x.setUTCMilliseconds(0)
    return new Date(x)
}