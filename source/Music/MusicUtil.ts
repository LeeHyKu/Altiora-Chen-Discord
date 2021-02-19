import { GuildMember } from "discord.js";
import { isNullOrUndefined } from "util";
import { MusicPack, MusicFrom } from "./MusicPack";
import fs from "fs";
import { MusicCreater } from "./MusicCreater";

export namespace MusicUtil {
    export function TimeProcessing(t: number): string {
        if (t == 0)
            return 'UNKNOWN';

        let a = Math.floor(t / 60);
        let b = t - (a * 60);
        return `${a}:${(b < 10) ? '0' + b : b}`;
    }
    export function isSameConnection(m: GuildMember): boolean { return isNullOrUndefined(m.guild.voice) || m.guild.voice.channelID == m.voice.channelID; }
}