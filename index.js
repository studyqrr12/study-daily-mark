const { join } = require('path');
const { writeFile } = require('fs/promises');

async function main() {
    console.log('Run Github Actions');

    const calendarMap = {};
    const nameMap = {};

    try {
        const simpleGit = require('simple-git')({
            baseDir: join(__dirname, '..', 'study'),
            binary: 'git',
            trimmed: false,
        });

        const logs = await simpleGit.log({});
        const mainCommits = logs.all.map(item => Object.assign(item, { __date: parseDateString(item.date) }));

        mainCommits.forEach(item => {
            const date = item.__date;
            const name = item.author_name;

            console.log(date, date.getDate());

            if (calendarMap[date.getFullYear()] == null) {
                calendarMap[date.getFullYear()] = {};
            }

            const year = calendarMap[date.getFullYear()];

            if (year[date.getMonth()] == null) {
                year[date.getMonth()] = {};
            }

            const month = year[date.getMonth()];

            if (month[date.getDate()] == null) {
                month[date.getDate()] = {};
            }

            const dateObj = month[date.getDate()];

            if (dateObj[name] == null) {
                dateObj[name] = 0;
                nameMap[name] = true;
            }

            dateObj[name] += 1;
        });
    } catch (reason) {
        console.log(reason.message);
    }

    let current = new Date();
    let lastDate = new Date();

    lastDate.setHours(9);
    lastDate.setMonth(lastDate.getMonth() + 1);
    lastDate.setDate(0);

    console.log(JSON.stringify(calendarMap, null, 2));

    const thisMonth = calendarMap?.[current.getFullYear()]?.[current.getMonth()] ?? {};
    const thisMonthFill = new Array(lastDate.getDate()).fill(0).map((val, idx) => Object.values(thisMonth[idx] ?? {}).reduce((init, curr) => { return init += curr }, 0) ?? val);

    lastDate.setDate(1);

    const weekLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let markdownStr = [];
    markdownStr.push(weekLabel.map(item => ` ${item}`));
    markdownStr.push(new Array(weekLabel.length).fill(' :---: '));

    for (let i = 1 - lastDate.getDay(); i <= thisMonthFill.length;) {
        let row = [];
        for (let j = 0; j < 7; j++, i++) {
            if (i < 1 || i > thisMonthFill.length) {
                row.push(' ');
            } else {
                row.push(`${i} (${thisMonthFill[i] ?? 0})`);
            }
        }
        markdownStr.push(row);
    }

    let output = `
        # 커밋 달력

        ## 이번달 (${String(current.getMonth() + 1).padStart(2, '0')}) 커밋

        ${markdownStr.map(item => '|' + item.join('|') + '|').join('\n')}
    `.substring(1).split('\n').map(item => item.trim()).join('\n');

    //이번달 커밋
    await writeFile(join(__dirname, 'README.md'), output, { encoding: 'utf-8' });
}

function parseDateString(str) {
    let [date, other] = str.split('T');
    let [time, utcTime] = other.split('+');

    let [yyyy, MM, dd] = date.split('-').map(item => Number(item));
    MM -= 1;

    let [hh, mm, ss] = time.split(':').map(item => Number(item));
    let [utcTimeHH, utcTimeMM] = utcTime.split(':').map(item => Number(item));

    let d = new Date(yyyy, MM, dd, hh, mm, ss);
    // d.setHours(d.getHours() + utcTimeHH);
    // d.setMinutes(d.getMinutes() + utcTimeMM);

    return d;
}

main();