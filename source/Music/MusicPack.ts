import { MessageEmbed, MessageAttachment } from "discord.js";
import { isNullOrUndefined } from "util";

export class MusicPack {
    name: string = '';
    author: string = '';
    thumbnail: string | Buffer;
    musicLength: number;

    musicType: MusicFrom;

    url: string;

    get PlayCard(): MessageEmbed {
        let a = new MessageEmbed();
        a.setColor('#B2FFFF');

        a.setTitle(this.name);
        a.setAuthor(this.author);

        switch (this.musicType) {
            case MusicFrom.Youtube:
                a.setURL(this.url);
                a.setThumbnail(this.thumbnail as string);
                break;
            case MusicFrom.Local:
                if (!isNullOrUndefined(this.thumbnail)) {
                    a.attachFiles([new MessageAttachment(this.thumbnail as Buffer, `musicthumbnail.png`)]);
                    a.setThumbnail('attachment://musicthumbnail.png');
                }
                break;
        }
        return a;
    }
}

export enum MusicFrom {
    Youtube,
    Local,
    YoutubeSearch, //This is only used to identification
    LocalPreset //This is only used to identification
}