import { EventEmitter } from "events";
import { MusicCreater } from "./MusicCreater";
import { MusicFrom } from "./MusicPack";
import fs from "fs";

export class PresetEvent extends EventEmitter {
    list: Array<string>;

    run() { this.runhandle(); }
    private async runhandle() {
        for (let i = 0; i < this.list.length; i++) {
            try {
                switch (MusicCreater.Identification(this.list[i])) {
                    case MusicFrom.Youtube:
                        this.emit('music', await MusicCreater.fromYoutube(this.list[i]));
                        break;
                    case MusicFrom.Local:
                        this.emit('music', await MusicCreater.fromLocal(this.list[i]));
                        break;
                    default:
                        this.emit('music', await MusicCreater.fromLocalPreset(this.list[i]));
                        break;
                }
            }
            catch (e) {
                this.emit('error',e);
            }
        }
    }

    static load(str: string): PresetEvent {
        let a = fs.readFileSync(`./resources/Music/preset/${str}.json`, 'utf8').toString();
        try { a = JSON.parse(a); } catch { a = JSON.parse(a.slice(1)); }
        
        let b = new PresetEvent();
        b.list = (a as any).data;
        return b;
    }
}