import {prompt} from 'inquirer';
import Zangsisi from 'class-zangsisi';
import * as chalk from 'chalk';
import * as figlet from 'figlet';
import * as clear from 'clear';
import {basename, join} from 'path';
import * as bytes from 'bytes';
import {version} from './package.json';

clear();
console.log(
    chalk.yellow(figlet.textSync('cli-comics', {horizontalLayout: 'default', verticalLayout: 'default'})),
    chalk.red(version)
);

const PARENT = '../';

const zangsisi = new Zangsisi();
const cd = zangsisi.cd.bind(zangsisi);
const ls = zangsisi.ls.bind(zangsisi);
const download = zangsisi.download.bind(zangsisi);

class Cli {
    private downloadingList = [];
    private downloadedList = [];

    async selectComicsSeries() {
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
    async selectComicBook(comicBookSeries) {
        cd(join('/', comicBookSeries));
        const comicBooks = await ls();
        const {name} = await prompt({
            type: 'list',
            name: 'name',
            message: '다운로드할 권을 선택',
            choices: [PARENT, ...comicBooks.map(this.mapChoiceObject.bind(this))],
            pageSize: 30,
        });
        if (name !== PARENT) {
            cd(name);
            await this.download(name);
        }
        cd(PARENT);
        return name;
    }
    private mapChoiceObject(book) {
        const downloading = this.downloadingList.find(downloadingBook => downloadingBook === book.title);
        const ret = {name: book.title} as any;

        if (downloading) {
            ret.name = `[받는중] ${ret.name}`;
            ret.disabled = true;
        } else {
            const downloaded = this.downloadedList.find(downloadedBook => downloadedBook.title === book.title);
            if (downloaded) {
                ret.name = `[완료: ${bytes(downloaded.bytes, {decimalPlaces: 0})}] ${ret.name}`;
                ret.disabled = true;
            }
        }
        return ret;
    }
    async download(comicBook) {
        try {
            const filename = `${basename(comicBook).replace(/\s/g, '_')}.zip`;
            await download(filename, bytes => {
                const index = this.downloadingList.indexOf(comicBook);
                if (index !== -1) {
                    this.downloadingList.splice(index, 1);
                }
                this.downloadedList.push({title: comicBook, bytes});
            });
            this.downloadingList.push(comicBook);
        } catch(ex) {
            console.error(`[error] download failed: `, ex);
        }
    }
}

!async function main() {
    const cli = new Cli();
    try {
        exit:
        while (true) {
            const series = await cli.selectComicsSeries();
            while (true) {
                const nextPath = await cli.selectComicBook(series);
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

