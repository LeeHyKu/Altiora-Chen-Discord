import { Message, MessageReaction, User } from 'discord.js';

export class Command {
    readonly prefix: Array<string> = [this.constructor.name];

    async Handle(msg: Message) { }
    async HandlePrefixOnly(msg: Message) { }
    async HandleArguments(msg: Message,args: Array<string>) { }
}

export class Question {
    async Handle(msg: Message) { }
}

export class Selection {
    async Handle(arg: MessageReaction, user: User) { }
}