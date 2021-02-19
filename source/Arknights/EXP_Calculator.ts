import { Command } from "../DefineClasses";
import { Message, MessageEmbed } from "discord.js";
import { Chen } from "../Chen";
import { maxLevel, characterExpMap, characterUpgradeCostMap, evolveGoldCost } from "../../resources/arknights/Arknights_Level.json";

export class Calculator{
    async Handle(msg: Message) {
        if (msg.content.split(' ').length < 7) {
            msg.reply(new MessageEmbed()
                .setColor('AQUA')
                .setTitle('명령어')
                .addField('경험치계산', Chen.instance.getConfig(msg.guild).botPrefix + '명방 경험치 <캐릭터 등급> <현재정예화(없으면 0)> <현재레벨> <목표정예화> <목표레벨>'));
            return;
        }
        let args = msg.content.split(' ');
        
        let star = parseInt(args[2]);
        let nowclass = parseInt(args[3]);
        let nowlevel = parseInt(args[4]);
        let toclass = parseInt(args[5]);
        let tolevel = parseInt(args[6]);
        

        if (
            (isNaN(star) || isNaN(nowclass) || isNaN(nowlevel) || isNaN(toclass) || isNaN(tolevel)) ||
            nowclass > toclass ||
            (nowclass == toclass && nowlevel >= tolevel) ||
            (star > 6) ||
            !(maxLevel[star - 1][nowclass] > nowlevel) ||
            !(maxLevel[star - 1][toclass] > tolevel)
        ) {
            msg.reply('올바른 값을 입력하세요');
            return;
        }

        let es = nowlevel === maxLevel[star - 1][nowclass] ? 0 : characterExpMap[nowclass][nowlevel - 1];
        let cs = nowlevel === maxLevel[star - 1][nowclass] ? 0 : characterUpgradeCostMap[nowclass][nowlevel - 1] * es / (characterExpMap[nowclass][nowlevel - 1]);
        nowlevel++;
        for (let i = nowclass, j = nowlevel; i <= toclass; i++) {
            while (i < toclass && j < maxLevel[star - 1][i]) {
                es += characterExpMap[i][j - 1];
                cs += characterUpgradeCostMap[i][j - 1];
                j++;
            }
            while (i === toclass && j < tolevel) {
                es += characterExpMap[i][j - 1];
                cs += characterUpgradeCostMap[i][j - 1];
                j++;
            }
            j = 1;
        }
        let ea = 0;
        for (let i = nowclass; i < toclass; i++) {
            ea += evolveGoldCost[star - 1][i];
        }
        
        let gs = (cs + ea);
        let lsn = Math.ceil((es / 7500));
        let cen = Math.ceil((gs / 7500));

        msg.reply(new MessageEmbed()
            .setColor('RED')
            .setTitle('결과')
            .addField('필요 경험치', es)
            .addField('필요 용문화', gs));
    }
}