export function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
  
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
  

export function divideTimes(from, to, byMinutes: number = 5) {
    const f = new Date(from)
    const t = new Date(to)
    const minutes = (t.getTime() - f.getTime())/1000/60
    const result = []

    // add 1 because the last time it's not looped
    for (let i = 0; i < (minutes/byMinutes); i++) {
        let hours = Math.floor(f.getUTCHours() + (byMinutes * i) / 60)
        let minutes = (f.getUTCMinutes() + (byMinutes * i)) % 60
        if (hours < 10) hours = `0${hours}`
        if (minutes < 10) minutes = `0${minutes}`
        result.push(`${hours}:${minutes}`)
    }

    return result
}

export function zeroTimes(date) {
    const x = new Date(date)
    x.setUTCHours(0)
    x.setUTCMinutes(0)
    x.setUTCSeconds(0)
    x.setUTCMilliseconds(0)
    return new Date(x)
}