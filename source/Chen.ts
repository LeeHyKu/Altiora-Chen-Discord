import { Message, MessageEmbed, Guild, GuildMember, Client, Snowflake, MessageReaction, User, DMChannel } from 'discord.js';
import { Command, Question, Selection } from './DefineClasses';
import { ServerConfig } from './ServerConfig';
import { BotToken } from '../resources/Config.json';
import { isNullOrUndefined } from 'util';
import * as readline from 'readline';

/**
 * Handle Client
 * 
 * @class
 * @classdesc Handle Client, singleton
 */
export class Chen {
    static readonly instance: Chen = new Chen();
    static async HandleMessageInstance(msg: Message) { await Chen.instance.HandleMessage(msg); }
    static async HandleSelectionInstance(rea: MessageReaction, user: User) { await Chen.instance.HandleSelection(rea,user); }
    static async addHendlerinstance(event: Command) { Chen.instance.AddHendler(event); }
    static logInstance(s: any) { Chen.instance.log(s); }


    commandList: Array<Command> = [];
    AddHendler(event: Command) {
        let a = event.prefix;
        if (this.commandList.findIndex((m): boolean => { return m.prefix == a; }) != -1)
            throw new ChenError("커맨드가 중복됩니다");
        this.commandList.push(event);
    }

    questions: Map<GuildMember, Question> = new Map();
    Ask(m: GuildMember, q: Question) { this.questions.set(m,q);}

    async HandleMessage(msg: Message) {
        try {
            if (msg.channel instanceof DMChannel) {
                Chen.logInstance(`DM Message Issue : ${msg.content} by ${msg.author.username}`);
                return;
            }

            if (this.questions.get(msg.member)) {
                let e = this.questions.get(msg.member);
                Chen.logInstance(`Question Issue : ${msg.content} by ${msg.author.username} in ${msg.guild.name}`);
                await e.Handle(msg);
                this.questions.delete(msg.member);
            }

            let a: Array<string>;
            let b = this.commandList.find((m): boolean => {
                let c = false;
                m.prefix.forEach((e) => {
                    let search = this.getConfig(msg.guild).botPrefix + e;
                    if (msg.content.split(' ')[0] == search) { c = true; a = msg.content.split(' '); a.shift(); }
                })
                return c;
            });

            if (b != null) {
                if (a.length > 0) {
                    Chen.logInstance(`Command Issue : ${msg.content} by ${msg.author.username} in ${msg.guild.name}`);
                    await b.Handle(msg);
                    await b.HandleArguments(msg, a);
                }
                else {
                    Chen.logInstance(`Command Issue : ${msg.content} Prefix Only by ${msg.author.username} in ${msg.guild.name}`);
                    await b.Handle(msg);
                    await b.HandlePrefixOnly(msg);
                }
            }
        }
        catch (e) {
            this.log(e);
        }
    }

    ServerConfigs: Map<Guild, ServerConfig> = new Map();
    getConfig(s: Guild) {
        if (!this.ServerConfigs.get(s))
            this.ServerConfigs.set(s, new ServerConfig());
        return this.ServerConfigs.get(s);
    }

    selections: Map<Snowflake, Selection> = new Map();
    addSelection(msgid: Snowflake, selection: Selection) {
        this.selections.set(msgid, selection);
    }
    async HandleSelection(rea: MessageReaction, user: User) {
        try {
            if (!isNullOrUndefined(this.selections.get(rea.message.id))) {
                Chen.logInstance(`Selection Issue : ${rea.emoji.name} by ${user.username}`);
                let a = this.selections.get(rea.message.id)
                this.selections.delete(rea.message.id);
                await a.Handle(rea, user);
            }
        }
        catch (e) {
            this.log(e);
        }
    }

    client: Client = new Client();
    log(s: any) {
        console.log(`[${Date.now().toString(16)}] ${s}`);
    }
    logobj(s: any) {
        console.log(s);
    }
    login() {
        this.log(`Try login to Discord`);
        this.client.on('message', Chen.HandleMessageInstance);
        this.client.on('messageReactionAdd', Chen.HandleSelectionInstance);
        this.client.on('ready', () => { Chen.logInstance(`Logged in as ${this.client.user.tag}!`); });
        this.client.login(BotToken);
    }

    /*
     * Utility functions
     */
    static SimpleErrorCard(e: Error): MessageEmbed {
        return new MessageEmbed()
            .setAuthor(e.name)
            .setTitle('오류 발생!')
            .addField('오류정보', e.message)
            .setColor('DARK_RED')
    }

    static ErrorCard(e: Error): MessageEmbed {
        return new MessageEmbed()
            .setAuthor(e.name)
            .setTitle('오류 발생!')
            .addField('오류정보', e.message)
            .addField('오류 위치', e.stack)
            .setColor('DARK_RED')
    }
}

export class ChenError extends Error {
    toSimpleErrorCard(): MessageEmbed { return Chen.SimpleErrorCard(this); }
    toErrorCard(): MessageEmbed { return Chen.ErrorCard(this); }
}