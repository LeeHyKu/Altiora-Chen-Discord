import { request, get } from "http";
import { URL } from "url";
import { MessageEmbed } from "discord.js";

export namespace Util {
    export async function JSONPost(link: string, element: any): Promise<any> {
        return new Promise(async (s, r) => {
            try {
                let a = JSON.parse(await SimplePost(link, element));
                s(a);
            } catch (e) {
                r(e);
            }
        });
    }
    export async function SimplePost(link: string, element: any): Promise<string> {
        return new Promise((s, r) => {
            try {
                let u = new URL(link);
                let chunk: string;
                let a = request({
                    host: u.origin,
                    path: u.pathname + (/\?(.*)=(.*)/.test(link)) ? `?${u.searchParams.toString()}` : '',
                    method: 'POST'
                }, (res) => {
                    res.on('error', e => r(e));
                    res.on('data', c => chunk += c);
                    res.on('end', () => s(chunk));
                });

                a.on('error', e => r(e));
                a.write(element);
                a.end();
            } catch (e) {
                r(e);
            }
        });
    }
    export async function JSONGet(link: string): Promise<any> {
        return new Promise(async (s, r) => {
            try {
                let a = JSON.parse(await SimpleGet(link));
                s(a);
            } catch (e) {
                r(e);
            }
        });
    }
    export async function SimpleGet(link:string): Promise<string> {
        return new Promise((s, r) => {
            try {
                let chunk: string;
                let a = get(new URL(link), (res) => {
                    res.on('error', e => r(e));
                    res.on('data', c => chunk += c);
                    res.on('end', () => s(chunk));
                });

                a.on('error', e => r(e));
                a.end();
            } catch (e) {
                r(e);
            }
        });
    }

    export function ErrorCard(error: Error): MessageEmbed { return SimpleErrorCard(error).addField('trace', error.stack); }
    export function SimpleErrorCard(error: Error): MessageEmbed {
        let a = new MessageEmbed();
        a.setTitle(error.name);
        a.setColor('#800000');
        a.setDescription(error.message);
        return a;
    }
}