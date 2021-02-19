import { Command } from "../DefineClasses";
import { Message, MessageEmbed } from "discord.js";
import { QueueHub } from "./MusicQueue";
import { MusicCreater } from "./MusicCreater";
import { MusicFrom, MusicPack } from "./MusicPack";
import { MusicUtil } from "./MusicUtil";
import { Chen } from "../Chen";
import { Util } from "../Util";
import { Search } from "./MusicSearch";
import { isNullOrUndefined } from "util";
import fs from "fs";
import { PresetEvent } from "./MusicPreset";

export function addMusicCommands() {
    Chen.addHendlerinstance(new Help());
    Chen.addHendlerinstance(new Join());
    Chen.addHendlerinstance(new Leave());
    Chen.addHendlerinstance(new Play());
    Chen.addHendlerinstance(new SearchMusic());
    Chen.addHendlerinstance(new NowPlay());
    Chen.addHendlerinstance(new Skip());
    Chen.addHendlerinstance(new Loop());
    Chen.addHendlerinstance(new Pause());
    Chen.addHendlerinstance(new List());
    Chen.addHendlerinstance(new Volume());
    Chen.addHendlerinstance(new Remove());
    Chen.addHendlerinstance(new Clear());
    Chen.addHendlerinstance(new Locallist());
    Chen.addHendlerinstance(new Presetlist());
    Chen.addHendlerinstance(new Preset());
}

export class Help extends Command {
    readonly prefix = ['musichelp', 'mh'];

    async Handle(msg: Message) {
        msg.reply(this.HelpCard(Chen.instance.getConfig(msg.guild).botPrefix));
    }

    HelpCard(pfx:string): MessageEmbed {
        let a = new MessageEmbed();
        a.setTitle("Ch'en Discord Music Bot");
        a.setColor('#87CEEB');

        a.addField(`${pfx}j[oin]`, '통화방에 들어갑니다', true);
        a.addField(`${pfx}leave(lv)`, '큐를 모두 지우고 통화방에서 나갑니다', true);
        a.addField(`${pfx}p[lay] <유튜브 주소|local:음악이름|검색>`, '음악을 재생하거나 추가합니다', true);
        a.addField(`${pfx}se[arch] <검색>`, '음악을 검색하고 리스트를 불러옵니다', true);
        a.addField(`${pfx}nowplay(np)`, '현재 재생중인 음악의 정보를 불러옵니다', true);
        a.addField(`${pfx}v[olume]`, '볼륨을 불러옵니다', true);
        a.addField(`${pfx}v[olume] <숫자>`, '볼륨을 조절합니다', true);
        a.addField(`${pfx}s[kip]`, '현재 재생중인 음악을 스킵합니다', true);
        a.addField(`${pfx}l[oop]`, '루프를 키거나 끕니다', true);
        a.addField(`${pfx}pause(ps)`, '음악을 일시정지하거나 재시작합니다', true);
        a.addField(`${pfx}q[ueue]`, '음악 리스트를 불러옵니다', true);
        a.addField(`${pfx}r[emove] <숫자>`, '플레이리스트를 삭제합니다', true);
        a.addField(`${pfx}cl[ear]`, '플레이리스트를 모두 삭제합니다', true);
        a.addField(`${pfx}locallist(ll)`, '로컬 음악 리스트를 불러옵니다', true);
        a.addField(`${pfx}presetlist(pl)`, '프리셋 리스트를 불러옵니다', true);
        a.addField(`${pfx}pr[eset] <프리셋>`, '프리셋을 불러옵니다', true);

        return a;
    }
}

export class Join extends Command {
    readonly prefix = ['join', 'j'];

    async Handle(msg: Message) {
        msg.member.voice.channel.join()
            .then(v => { msg.reply(`${v.channel.name}에 입장했습니다`) });
    }
}

export class Leave extends Command {
    readonly prefix = ['leave', 'lv'];

    async Handle(msg: Message) {
        if (QueueHub.instance.getQueue(msg.guild).isVaild) {
            QueueHub.instance.getQueue(msg.guild).connection.disconnect();
            QueueHub.instance.queue.delete(msg.guild);
            msg.reply('접속종료');
        }
        else
            msg.reply('통화방에 들어와있지 않습니다');
    }
}

export class Play extends Command {
    readonly prefix = ['play', 'p'];

    async HandleArguments(msg: Message, args: Array<string>) {
        if (!QueueHub.instance.getQueue(msg.guild).isVaild)
            msg.reply(`${(await msg.member.voice.channel.join()).channel.name}에 입장했습니다`);

        try {
            let a;
            switch (MusicCreater.Identification(args[0])) {
                case MusicFrom.Youtube:
                    a = await MusicCreater.fromYoutube(args[0]);
                    break;
                case MusicFrom.YoutubeSearch:
                    let b = await Search(args.join(' '));
                    a = await MusicCreater.fromYoutube(`https://www.youtube.com/watch?v=${b.SearchObjects[0].id}`);
                    break;
                case MusicFrom.LocalPreset:
                    a = await MusicCreater.fromLocalPreset(args.join(' ').replace('local:', ''));
                    break;
                default:
                    msg.reply('아직 지원하지 않는 방식입니다.');
                    break;
            }

            QueueHub.instance.getQueue(msg.guild).addMusic(a);
            msg.reply(a.PlayCard);

            if (!QueueHub.instance.getQueue(msg.guild).isReallyPlaying)
                QueueHub.instance.getQueue(msg.guild).playNext();
        }
        catch (e) {
            msg.reply(Util.SimpleErrorCard(e));
        }
    }
}

export class SearchMusic extends Command {
    readonly prefix = ['search', 'se'];

    async HandleArguments(msg: Message, args: Array<string>) {
        if (!QueueHub.instance.getQueue(msg.guild).isVaild)
            msg.reply(`${(await msg.member.voice.channel.join()).channel.name}에 입장했습니다`);

        try {
            let a = await Search(args.join(' '));
            msg.reply(a.ListCard);
            Chen.instance.Ask(msg.member, a);
        } catch (e) {
            msg.reply(Util.SimpleErrorCard(e));
        }
    }
}

export class NowPlay extends Command {
    readonly prefix = ['nowplay', 'np'];

    async Handle(msg: Message) {
        if (QueueHub.instance.getQueue(msg.guild).isReallyPlaying)
            msg.channel.send(QueueHub.instance.getQueue(msg.guild).NowplayCard);
        else
            msg.reply('현재 재생중인 곡이 없습니다');
    }
}

export class Skip extends Command {
    readonly prefix = ['skip', 's'];

    async Handle(msg: Message) {
        if (MusicUtil.isSameConnection(msg.member)) {
            QueueHub.instance.getQueue(msg.guild).skip();
            msg.reply('스킵했습니다');
        }
        else
            msg.reply('같은 통화방에 있어야 합니다');
    }
}

export class Loop extends Command {
    readonly prefix = ['loop', 'l'];

    async Handle(msg: Message) {
        msg.reply((QueueHub.instance.getQueue(msg.guild).loop()) ? '루프를 켰습니다' : '루프를 껐습니다');
    }
}

export class Pause extends Command {
    readonly prefix = ['pause', 'ps'];

    async Handle(msg: Message) {
        if (QueueHub.instance.getQueue(msg.guild).isReallyPlaying && MusicUtil.isSameConnection(msg.member))
            msg.reply((QueueHub.instance.getQueue(msg.guild).pause()) ? '일시정지' : '재시작');
    }
}

export class List extends Command {
    readonly prefix = ['queue', 'q'];

    async Handle(msg: Message) {
        let a = QueueHub.instance.getQueue(msg.guild).ListCard;
        if (!isNullOrUndefined(a)) {
            msg.reply(a);
        }
        else
            msg.reply('재생중인 음악이 없습니다');
    }
}

export class Volume extends Command {
    readonly prefix = ['volume', 'v'];

    async HandlePrefixOnly(msg: Message) { msg.reply(`현재 볼륨: ${QueueHub.instance.getQueue(msg.guild).v}`); }
    async HandleArguments(msg: Message, args: Array<string>) {
        if (MusicUtil.isSameConnection(msg.member)) {
            let c = parseInt(args[0]);
            if (isNaN(c) || c <= 0) {
                msg.reply('올바른 숫자를 입력하십시오');
                return;
            }

            QueueHub.instance.getQueue(msg.guild).v = c;
            msg.reply(`볼륨을 ${c}로 설정했습니다`);
        }
        else
            msg.reply('같은 통화방에 있어야 합니다');
    }
}

export class Remove extends Command {
    readonly prefix = ['remove', 'r'];

    async HandleArguments(msg: Message, args: Array<string>) {
        if (MusicUtil.isSameConnection(msg.member)) {
            let c = parseInt(args[0]);
            if (isNaN(c)) {
                msg.reply('올바른 숫자를 입력하십시오');
                return;
            }

            QueueHub.instance.getQueue(msg.guild).remove(c);
            msg.reply(`삭제했습니다`);
        }
        else
            msg.reply('같은 통화방에 있어야 합니다');
    }
}

export class Clear extends Command {
    readonly prefix = ['clear', 'cl'];

    async Handle(msg: Message) {
        if (MusicUtil.isSameConnection(msg.member)) {
            QueueHub.instance.getQueue(msg.guild).clear();
            msg.reply(`삭제했습니다`);
        }
        else
            msg.reply('같은 통화방에 있어야 합니다');
    }
}

export class Locallist extends Command {
    readonly prefix = ['locallist', 'll'];

    async Handle(msg: Message) {
        fs.readdir('./resources/music/local/', (err, files) => {
            if (err)
                return msg.reply(Util.SimpleErrorCard(err));

            let a = new MessageEmbed();
            a.setTitle('로컬파일 리스트');
            for (let i = 0; i < files.length; i++)
                a.addField(i + 1, files[i])
            msg.reply(a);
        });
    }
}

export class Presetlist extends Command {
    readonly prefix = ['presetlist', 'pl'];

    async Handle(msg: Message) {
        fs.readdir('./resources/music/preset/', (err, files) => {
            if (err)
                return msg.reply(Util.SimpleErrorCard(err));

            let a = new MessageEmbed();
            a.setTitle('프리셋 리스트');
            for (let i = 0; i < files.length; i++)
                a.addField(i + 1, files[i].replace('.json', ''));
            msg.reply(a);
        });
    }
}

export class Preset extends Command {
    readonly prefix = ['preset', 'pr'];

    async HandleArguments(msg: Message, args: Array<string>) {
        if (!QueueHub.instance.getQueue(msg.guild).isVaild)
            msg.reply(`${(await msg.member.voice.channel.join()).channel.name}에 입장했습니다`);

        try {
            let a = PresetEvent.load(args.join(' '));
            a.on('music', (m: MusicPack) => {
                msg.reply(m.PlayCard);
                QueueHub.instance.getQueue(msg.guild).addMusic(m);

                if (!QueueHub.instance.getQueue(msg.guild).isReallyPlaying)
                    QueueHub.instance.getQueue(msg.guild).playNext();
            });
            a.on('error', e => { msg.reply(Util.SimpleErrorCard(e)); })
            a.run();
        }
        catch (e) {
            msg.reply(Util.SimpleErrorCard(e));
        }
    }
}