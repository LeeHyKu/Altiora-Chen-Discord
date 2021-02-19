import { Command } from "./DefineClasses";
import { Message, MessageEmbed, Guild } from "discord.js";
import { Chen } from "./Chen";

export class SettingCommand extends Command {
    readonly prefix = ['설정'];

    async HandlePrefixOnly(msg: Message) {
        msg.reply(this.InfoCard(msg.guild));
    }

    async HandleArguments(msg: Message, args: Array<string>) {
        switch (args[0]) {
            case "prefix":
            case "p":
            case "접두사":
                if (args.length < 2) {
                    msg.reply(`명령어 접두사:${Chen.instance.getConfig(msg.guild).botPrefix}`);
                    return;
                }
                Chen.instance.getConfig(msg.guild).botPrefix = args[1];
                msg.reply(`명령어 접두사가 ${args[1]}로 설정되었습니다`);
                break;
        }
    }

    InfoCard(g: Guild): MessageEmbed {
        return new MessageEmbed()
            .setColor('BLUE')
            .setAuthor(`Ch'en`)
            .setTitle('설정')
            .addField('명령어 접두사', Chen.instance.getConfig(g).botPrefix);
    }
}