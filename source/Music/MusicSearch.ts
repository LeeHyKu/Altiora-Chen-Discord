import { MessageEmbed, Message } from "discord.js";
import { Question } from "../DefineClasses";
import { MusicCreater } from "./MusicCreater";
import { QueueHub } from "./MusicQueue";
import { Util } from "../Util";

import youtubeSearch from "youtube-search";
import * as config from "../../resources/Config.json";

export async function Search(arg: string): Promise<SearchResult> {
    return new Promise<SearchResult>((s, r) => {
        youtubeSearch(arg, {
            part: 'snippet',
            type: 'video',
            regionCode: 'KR',
            maxResults: 10,
            key: config.GoogleToken
        }).then((res) => {
            let a = new SearchResult();
            res.results.forEach((re) => { a.SearchObjects.push({ title: re.title, id: re.id, author: re.channelTitle, authorId: re.channelId }); });
            s(a);
        }).catch((e) => {
            r(e);
        })
    });
}

export class SearchResult extends Question {
    SearchObjects: Array<SearchInfo> = [];

    async Handle(msg: Message) {
        if (!QueueHub.instance.getQueue(msg.guild).isVaild)
            msg.reply(`${(await msg.member.voice.channel.join()).channel.name}에 입장했습니다`);
        
        let a = parseInt(msg.content) - 1;
        if (isNaN(a) || a > this.SearchObjects.length || a < 0) {
            msg.reply('올바른 숫자를 입력하세요');
            return;
        }

        MusicCreater.fromYoutube(`https://www.youtube.com/watch?v=${this.SearchObjects[a].id}`)
            .then(async (r) => {
                let b = QueueHub.instance.getQueue(msg.guild).addMusic(r);
                msg.reply(`${b}번 큐에 추가했습니다`);
                msg.reply(r.PlayCard);
            })
            .catch((e) => { msg.reply(Util.SimpleErrorCard(e)); });
    }

    get ListCard(): MessageEmbed {
        let a = new MessageEmbed();
        a.setTitle('검색결과');
        a.setColor('AQUA');
        for (let i = 0; i < this.SearchObjects.length; i++)
            a.addField(`${i + 1}.`, `[${this.SearchObjects[i].title}](https://youtu.be/${this.SearchObjects[i].id}) - ${this.SearchObjects[i].author}`);

        return a;
    }
}

export interface SearchInfo {
    title: string;
    id: string;
    author: string;
    authorId: string;
}