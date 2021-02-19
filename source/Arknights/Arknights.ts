import { Command } from "../DefineClasses";
import { Message } from "discord.js";
import { Calculator } from "./EXP_Calculator";
import { Characters } from "./Characters";

export class Arknights extends Command {
    readonly prefix = ['명', '명방', 'ak'];

    async HandleArguments(msg: Message, args: Array<string>) {
        switch (args[0]) {
            case "경험치":
            case "경험치계산":
                await new Calculator().Handle(msg);
                break;
            default:
                await new Characters().Handle(msg);
                break;
        }
    }
}