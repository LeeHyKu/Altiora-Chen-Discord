import { MessageEmbed, Message, MessageReaction, User, TextChannel, MessageAttachment } from "discord.js";

import * as characterData from "../../resources/arknights/Arknights_Character.json";
import * as scriptData from "../../resources/arknights/Arknights_Charword.json";
import * as skinData from "../../resources/arknights/Arknights_Skin.json";
import * as skillData from "../../resources/arknights/Arknights_Skill.json";
import { Selection } from "../DefineClasses";
import { Chen } from "../Chen";
import { isNullOrUndefined } from "util";

export class Characters {
    async Handle(msg: Message) {
        let a = Character.fromName(msg.content.split(' ').slice(1).join(' '), msg.member.nickname);
        if (a != null) {
            let b = new CharacterPage();
            b.pages.push(a.toAvatarCard());
            let c = new MessageEmbed();
            let d = 0;
            while (!isNullOrUndefined(c)) {
                c = a.toStatusCard(d);
                d++;
                
                if (c != null)
                    b.pages.push(c);
            }
            c = new MessageEmbed();
            d = 0;
            while (!isNullOrUndefined(c)) {
                c = a.toSkinCard(d);
                d++;

                if (c != null)
                    b.pages.push(c);
            }
            await b.initalize(msg.channel as TextChannel);
        }
        return;
    }
}

export class CharacterPage extends Selection {
    nowpage: number = 0;
    pages: Array<MessageEmbed> = [];

    async initalize(ch: TextChannel) {
        let a = await ch.send(this.pages[this.nowpage]);
        await a.react("⏪");
        await a.react("⏩");
        Chen.instance.addSelection(a.id, this);
    }

    async Handle(rea: MessageReaction, user: User) {
        if (user.bot) {
            Chen.instance.addSelection(rea.message.id, this);
            return;
        }

        if (rea.emoji.name == '⏩' && this.nowpage + 1 < this.pages.length) {
            this.nowpage++;
            let a = await rea.message.channel.send(this.pages[this.nowpage]);
            await a.react("⏪");
            await a.react("⏩");
            await rea.message.delete();
            Chen.instance.addSelection(a.id, this);
        }
        else if (rea.emoji.name == '⏪' && this.nowpage > 0) {
            this.nowpage--;
            let a = await rea.message.channel.send(this.pages[this.nowpage]);
            await a.react("⏪");
            await a.react("⏩");
            await rea.message.delete();
            Chen.instance.addSelection(a.id, this);
        }
        else {
            Chen.instance.addSelection(rea.message.id, this);
            return;
        }
    }
}

export class Character {
    name: string;
    appellation: string;
    description: string;
    factions: string;
    key: string;
    nickname: string = '';
    
    toAvatarCard(): MessageEmbed {
        return new MessageEmbed()
            .setAuthor('"' + scriptData[this.key + '_CN_042'].voiceText + '"')
            .setTitle(this.appellation)
            .setDescription(this.description)
            .attachFiles([new MessageAttachment(`./resources/arknights/img/characters/${this.key}_1.png`, `characters_${this.key}.png`),
                new MessageAttachment(`./resources/arknights/img/factions/${this.factions}.png`, `factions_${this.factions}.png`)])
            .setImage(`attachment://characters_${this.key}.png`)
            .setThumbnail(`attachment://factions_${this.factions}.png`)
            .setColor('AQUA')
    }

    toStatusCard(elite: number): MessageEmbed {
        if (
            (characterData[this.key].rarity < 2 && elite != 0) ||
            (characterData[this.key].rarity == 2 && elite > 1) ||
            elite > 2
        )
            return null;

        try {
            let a = new MessageEmbed();
            a.setTitle(this.appellation);
            a.setDescription(`${characterData[this.key].displayNumber}
${'★'.repeat(characterData[this.key].rarity + 1)}`);

            let b = characterData[this.key].phases[elite].attributesKeyFrames[1].data;
            a.addField('체력', b.maxHp, true);
            a.addField('공격력', b.atk, true);
            a.addField('방어력', b.def, true);
            a.addField('마법저항', b.magicResistance, true);
            a.addField('공격속도', b.baseAttackTime, true);
            a.addField('저지수', b.blockCnt, true);
            a.addField('코스트', b.cost, true);
            a.addField('재배치 시간', b.respawnTime, true);
            a.addField('\u200b', '*모든 수치는 각 정예화 레벨의 최고 레벨/강화 기준입니다.*');

            let c = ((elite + 1) * 3);
            for (let i = 0; i <= elite; i++) {
                if (isNullOrUndefined(characterData[this.key].skills[i]))
                    break;
                let d = skillData[characterData[this.key].skills[i].skillId].levels[c];
                let e = '';
                let f = '';

                switch (d.skillType) {
                    case 0:
                        e = '패시브';
                        break;
                    case 1:
                        e = '수동 발동';
                        break;
                    case 2:
                        e = '자동 발동';
                        break;
                }

                switch (d.spData.spType) {
                    case 1:
                        f = "초당 회복";
                        break;
                    case 2:
                        f = "공격 회복";
                        break;
                    case 4:
                        f = "방어 회복";
                        break;
                    case 8:
                        f = "항상";
                        break;
                    default:
                        f = d.spType;
                        break;
                }

                a.addField(d.name
                    , `${f} | ${e}
지속시간:${Math.floor(d.duration)}
소모 SP:${d.spData.spCost}, 배치 SP:${d.spData.spCost}

${Character.getSkillDescription(d)}`
                    , true);
            }
                

            switch (elite) {
                case 0:
                    a.setColor('DARK_AQUA');
                    a.setAuthor('"' + scriptData[this.key + '_CN_002'].voiceText.split('{@nickname}').join(this.nickname) + '"');
                    a.attachFiles([new MessageAttachment(`./resources/arknights/img/avatars/${this.key}.png`, `avatars_${this.key}.png`)]);
                    a.setThumbnail(`attachment://avatars_${this.key}.png`);
                    break;
                case 1:
                    a.setColor('BLUE');
                    a.setAuthor('"' + scriptData[this.key + '_CN_005'].voiceText.split('{@nickname}').join(this.nickname) + '"');
                    if (!isNullOrUndefined(skinData.charSkins[this.key + '#1+'])) {
                        a.attachFiles([new MessageAttachment(`./resources/arknights/img/avatars/${this.key}_1+.png`, `avatars_${this.key}_1p.png`)]);
                        a.setThumbnail(`attachment://avatars_${this.key}_1p.png`);
                    }
                    else {
                        a.attachFiles([new MessageAttachment(`./resources/arknights/img/avatars/${this.key}.png`, `avatars_${this.key}.png`)]);
                        a.setThumbnail(`attachment://avatars_${this.key}.png`);
                    }
                    break;
                case 2:
                    a.setColor('DARK_BLUE');
                    a.setAuthor('"' + scriptData[this.key + '_CN_006'].voiceText.split('{@nickname}').join(this.nickname) + '"');
                    a.attachFiles([new MessageAttachment(`./resources/arknights/img/avatars/${this.key}_2.png`, `avatars_${this.key}_2.png`)]);
                    a.setThumbnail(`attachment://avatars_${this.key}_2.png`);
                    break;
            }

            //TODO:evolve ITEM
            return a;
        }
        catch (e) {
            Chen.logInstance(e);
            return null;
        }
    }

    toSkinCard(i: number): MessageEmbed {
        let index = 0;
        for (let key in skinData.charSkins) {
            if (key.startsWith(`${this.key}@`)) {
                if (index != i) {
                    i++;
                    continue;
                }
                let a = new MessageEmbed();
                let b = skinData.charSkins[key];
                a.setAuthor(b.displaySkin.skinName);
                a.setTitle(this.appellation);
                a.setColor('GREEN');

                a.setDescription(b.displaySkin.content);
                a.setImage(`attachment://skin_${b.charId}_${i}.png`);

                a.attachFiles([new MessageAttachment(`./resources/arknights/img/characters/${b.avatarId}.png`, `skin_${b.charId}_${i}.png`)]);
                return a;
            }
        }
        return null;
    }

    //UTIL

    static getSkillDescription(skill:any): string {
        let a = skill.description;
        a = a.toLowerCase();
        a = a.split('<@ba.vup>').join('`');
        a = a.split('<@ba.vdown>').join('`');
        a = a.split('<@ba.rem>').join('`');
        a = a.split('</>').join('`');
        for (let i = 0; i < skill.blackboard.length; i++)
            a = a.split(`{${skill.blackboard[i].key}}`).join(skill.blackboard[i].value)
                .split(`{${skill.blackboard[i].key}:0%}`).join(Math.ceil(skill.blackboard[i].value * 100) + '%')
                .split(`{${skill.blackboard[i].key}:0.0}`).join(Math.ceil(skill.blackboard[i].value))
                .split(`{-${skill.blackboard[i].key}:0%}`).join(Math.ceil(skill.blackboard[i].value * -100) + '%');
        return a;
    }

    static fromName(name: string, nickname:string = '') {
        let a: Character = null;
        for (let key in characterData) {
            if (characterData[key].name == name) {
                a = new Character();
                a.name = characterData[key].name;
                a.appellation = characterData[key].appellation;
                a.description = characterData[key].itemDesc.split('{@nickname}').join(nickname);
                a.factions = characterData[key].displayLogo;
                a.key = key;
                a.nickname = nickname;
            }
        }
        return a;
    }
}