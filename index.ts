import {prompt} from 'inquirer';
import Zangsisi from 'class-zangsisi';
import * as chalk from 'chalk';
import * as figlet from 'figlet';
import * as clear from 'clear';
import {basename, join} from 'path';
import {writeFileSync} from 'fs';

clear();
console.log(
    chalk.yellow(figlet.textSync('cli-comics', {horizontalLayout: 'default', verticalLayout: 'default'})),
    chalk.red('[CTRL+C] exit\n')
);

const PARENT = '../';

const zangsisi = new Zangsisi();
const cd = zangsisi.cd.bind(zangsisi);
const ls = zangsisi.ls.bind(zangsisi);
const download = zangsisi.download.bind(zangsisi);

class Cli {
    static async selectComicsSeries() {
        cd('/');
        const listComicBookSeries = await ls();
        const answer = await prompt({
            type: 'list',
            name: 'name',
            message: '시리즈 선택',
            choices: listComicBookSeries.map(x => x.title),
            pageSize: 30
        });
        return answer.name;
    }
    static async selectComicBook(comicBookSeries) {
        cd(join('/', comicBookSeries));
        const comicBooks = await ls();
        const {name} = await prompt({
            type: 'list',
            name: 'name',
            message: '다운로드할 권을 선택',
            choices: [PARENT, ...comicBooks.map(x => x.title)],
            pageSize: 30
        });
        if (name !== PARENT) {
            cd(name);
            Cli.download(name);
        }
        cd(PARENT);
        return name;
    }
    static async download(comicBook) {
        console.log('downloading: ', comicBook);
        try {
            writeFileSync(`${basename(comicBook).replace(/\s/g, '_')}.zip`, await download(), 'binary');
            console.log('downloaded: ', comicBook);
        } catch(ex) {
            console.error(`download error: `, ex);
        }
    }
}

!async function main() {
    try {
        exit:
        while (true) {
            const series = await Cli.selectComicsSeries();
            while (true) {
                const nextPath = await Cli.selectComicBook(series);
                if (nextPath === PARENT) {
                    break;
                }
                const answer = await prompt({
                    type   : 'list',
                    name   : 'name',
                    message: '다운로드할 권을 선택',
                    choices: ['더', '끝내기']
                });
                if (answer.name === '끝내기') {
                    break exit;
                }
            }
        }
    } catch(ex) {
        console.error(ex);
    }
}();

