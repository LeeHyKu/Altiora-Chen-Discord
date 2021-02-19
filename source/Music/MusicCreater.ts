import { MusicPack, MusicFrom } from "./MusicPack";
import * as ytdl from "ytdl-core";
import * as mm from 'music-metadata';
import * as fs from "fs";
import { isNullOrUndefined } from "util";
import { Readable } from "stream";

export namespace MusicCreater {
    export function Identification(arg: string): MusicFrom {
        switch (true) {
            case /^(http(s|):\/\/|)(www\.|)youtube\.com\/watch\?v=.*/.test(arg):
            case /^(http(s|):\/\/|)youtu\.be\/.*/.test(arg):
                return MusicFrom.Youtube;
            case /^local:.*/.test(arg):
                return MusicFrom.LocalPreset;
            case /^[A-Z]:\\.*[^\\]$/.test(arg):
                return MusicFrom.Local;
            default:
                return MusicFrom.YoutubeSearch;
        }
    }

    export function LoadpresetFast(p: string): Readable {
        try {
            let a = new Readable();
            let j = require(`../../resources/Music/preset/${p}.json`);
            let pl = j.data;
            for (let i = 0; i < pl.length; i++) {
                switch (MusicCreater.Identification(pl[i])) {
                    case MusicFrom.Youtube:
                        MusicCreater.fromYoutube(pl[i])
                            .then(d => a.emit('data', d))
                            .catch(e => a.emit('error', e));
                        break;
                    case MusicFrom.Local:
                        MusicCreater.fromLocal(pl[i])
                            .then(d => a.emit('data', d))
                            .catch(e => a.emit('error', e));
                        break;
                    default:
                        MusicCreater.fromLocalPreset(pl[i])
                            .then(d => a.emit('data', d))
                            .catch(e => a.emit('error', e));
                        break;
                }
            }

            return a;
        }
        catch (e) {
            throw e;
        }
    }
    export async function fromYoutube(link: string): Promise<MusicPack> {
        return new Promise<MusicPack>(async (s,r) => {
            try {
                let a = await ytdl.getInfo(link);
                let b = new MusicPack();

                b.url = link;

                b.name = a.player_response.videoDetails.title;
                b.author = a.player_response.videoDetails.author;
                b.thumbnail = a.player_response.videoDetails.thumbnail.thumbnails[0].url;

                b.musicLength = a.player_response.videoDetails.lengthSeconds;
                b.musicType = MusicFrom.Youtube;

                s(b);
            }
            catch (err) {
                r(err);
            }
        });
    }
    export async function fromLocalPreset(link: string, musicname: string = 'UNKNOWN'): Promise<MusicPack> {
        return new Promise<MusicPack>(async (s, r) => {
            try {
                let a = await fromLocal(`./res/Music/local/${link.replace('local:','')}`, musicname);
                s(a);
            } catch (e) {
                r(e);
            }
        });
    }
    export async function fromLocal(link: string,musicname:string = 'UNKNOWN'): Promise <MusicPack> {
        return new Promise<MusicPack>(async (s, r) => {
            try {
                await fs.promises.access(link); //Is this necessary?

                let a = new MusicPack();
                let b = await mm.parseFile(link);

                a.name = (isNullOrUndefined(b.common.artist)) ? musicname : b.common.title;
                a.author = (isNullOrUndefined(b.common.artist)) ? 'UNKNOWN' : b.common.artist;
                a.url = link;

                if (!isNullOrUndefined(b.common.picture[0]))
                    a.thumbnail = b.common.picture[0].data;

                a.musicLength = (isNullOrUndefined(b.format.duration)) ? 0 : Math.floor(b.format.duration);
                a.musicType = MusicFrom.Local;
                s(a);
            } catch (error) {
                r(error);
            }
        });
    }
}