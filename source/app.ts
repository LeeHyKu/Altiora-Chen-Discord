import { Chen } from "./Chen";
import { SettingCommand } from "./SettingCommand";
import { Arknights } from "./Arknights/Arknights";
import { addMusicCommands } from "./Music/MusicCommand";

addMusicCommands();
Chen.addHendlerinstance(new SettingCommand());
Chen.addHendlerinstance(new Arknights());
Chen.instance.login();