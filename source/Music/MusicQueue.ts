import { MusicPack, MusicFrom } from "./MusicPack";
import { Guild, VoiceConnection, StreamDispatcher, TextChannel, MessageEmbed, MessageAttachment } from "discord.js";
import { isNullOrUndefined } from "util";
import ytdl from "ytdl-core";
import { MusicUtil } from "./MusicUtil";

export class QueueHub {
    static readonly instance: QueueHub = new QueueHub();

    queue: Map<Guild, Queue> = new Map();
    getQueue(g: Guild): Queue {
        if (isNullOrUndefined(this.queue.get(g)))
            this.queue.set(g, new Queue(g));
        return this.queue.get(g);
    }
}

export class Queue {
    server: Guild;
    get isVaild(): boolean { return !isNullOrUndefined(this.server.voice) && !isNullOrUndefined(this.server.voice.connection); } //connection is not defined : issued when restart
    get isReallyPlaying(): boolean { return this.isVaild && !isNullOrUndefined(this.server.voice.connection.dispatcher) && !this.server.voice.connection.dispatcher.destroyed }
    get connection(): VoiceConnection { return this.server.voice.connection; }
    get dispatcher(): StreamDispatcher { return this.connection.dispatcher; }
    
    nowplay: MusicPack;
    playlist: Array<MusicPack> = [];
    get isPlaying() { return this.isVaild && !isNullOrUndefined(this.nowplay); }

    isloop: boolean = false;

    private volume: number = 0.3;
    get v() { return this.volume * 100; }
    set v(v: number) { this.volume = v / 100; }

    logChannel: TextChannel;
    private log(o: any) { if (!isNullOrUndefined(this.logChannel)) this.logChannel.send(o); };

    /*
     * FUNCTION AREA
     */
    constructor(g: Guild, lc: TextChannel = null) { this.server = g; this.logChannel = lc; }

    insertMusic(m: MusicPack) { this.playlist.unshift(m); }
    addMusic(m: MusicPack): number { return this.playlist.push(m); }

    skip() { if (!this.isReallyPlaying) return; this.dispatcher.destroy(); this.playNext(); }
    playNext(): boolean {
        if (!this.isVaild || this.playlist.length == 0)
            return false;

        let t = this.playlist.shift();

        let e;
        switch (t.musicType) {
            case MusicFrom.Youtube:
                e = ytdl(t.url, { quality: 'highestaudio' });
                break;
            case MusicFrom.Local:
                e = t.url;
                break;
            default:
                return false;
        }
        this.connection.play(e, { volume: this.volume });
        this.dispatcher.on('finish', () => { this.onFinish(); });
        this.dispatcher.on('error', (e) => { this.onError(e); });

        this.nowplay = t;
        return true;
    }

    clear() { for (let i = 0; i < this.playlist.length; i++) this.remove(i); }
    remove(i: number): boolean {
        if (!this.isVaild || isNullOrUndefined(this.playlist[i]))
            return false;
        this.playlist.splice(i - 1, 1);
    }

    loop(): boolean { return this.isloop = !this.isloop; }

    pause(): boolean {
        if (!this.isReallyPlaying)
            return true;

        this.dispatcher.paused ? this.dispatcher.resume() : this.dispatcher.pause();
        return this.dispatcher.paused;
    }

    /*
     * MESSAGE EMBED AREA
     */
    get NowplayCard(): MessageEmbed {
        if (!this.isReallyPlaying || !this.isPlaying)
            return null;

        let a = new MessageEmbed();
        a.setColor('#B2FFFF');

        a.setTitle(this.nowplay.name);
        a.setAuthor(this.nowplay.author);

        a.addField('재생시간', MusicUtil.TimeProcessing(Math.floor(this.dispatcher.streamTime / 1000)), true);
        a.addField('음악길이', MusicUtil.TimeProcessing(this.nowplay.musicLength), true);

        switch (this.nowplay.musicType) {
            case MusicFrom.Youtube:
                a.setURL(this.nowplay.url);
                a.setThumbnail(this.nowplay.thumbnail as string);
                break;
            case MusicFrom.Local:
                if (!isNullOrUndefined(this.nowplay.thumbnail)) {
                    a.attachFiles([new MessageAttachment(this.nowplay.thumbnail as Buffer, `musicthumbnail.png`)]);
                    a.setThumbnail('attachment://musicthumbnail.png');
                }
                break;
        }
        return a;
    }

    get ListCard(): MessageEmbed {
        if (!this.isReallyPlaying)
            return null;

        let a = new MessageEmbed();
        a.setTitle('플레이리스트');
        a.addField('현재 재생:', `[${this.nowplay.name}]${(!(this.nowplay.musicType == MusicFrom.Local)) ? `(${this.nowplay.url})` : ''} - ${MusicUtil.TimeProcessing(this.nowplay.musicLength)}`);
        if (!isNullOrUndefined(this.nowplay.thumbnail)) {
            if (this.nowplay.thumbnail instanceof Buffer) {
                a.attachFiles([new MessageAttachment(this.nowplay.thumbnail as Buffer,'musicthumbnail.png')]);
                a.setThumbnail('attachment://musicthumbnail.png');
            }
            else {
                a.setThumbnail(this.nowplay.thumbnail as string);
            }
        }

        if (this.playlist.length != 0) {
            for (let c = 0; (c < this.playlist.length && c <= 10); c++) {
                a.addField(`${c + 1}`, `[${this.playlist[c].name}]${(!(this.playlist[c].musicType == MusicFrom.Local)) ? `(${this.playlist[c].url})` : ''} - ${MusicUtil.TimeProcessing(this.playlist[c].musicLength)}`);
            }
        }

        a.setColor('RED');
        return a;
    }

    /*
     * EVENT HANDLER AREA
     */
    onFinish() {
        if (!this.isVaild)
            return;
        if (this.isloop)
            this.insertMusic(this.nowplay);

        this.nowplay = null;
        this.playNext();
    }

    onError(e: Error) { console.log(e); }
}