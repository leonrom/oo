/**
 * TAO7.js
 * 
 * Класс TAO7  - обработка <audio> тегов
 * 
 * - обработка именованных ссылок как в самом теге,  так и в вложенном <source>
 * - задание olga-snd позволяет визуализировать звучание аналогично остальным тегам 
     (при этом остальные квалификаторы класса - игнорируются)
 * - делать "ленивую" загрузку аудио по наведению курсора мыша
 */

import { AO7 } from './AO7.js'
import { Urls } from './Urls.js'

let C;
const logName = 'snd.TAO7: '

export class TAO7 extends AO7 {
    #isTAO7 = true

    static prepare(c) {
        C = c
    }
    erase() {
        super.erase()
    }
    static reset() {
        C.makeForTypName(tag => tag.aO7snd?.erase(), 'node', 'audio')
    }
    constructor(tag, cls, stags) {
        super(tag, cls)

        this.audio = tag
        this.audio.preload = "none"

        if (C.consts.debug) {
            const stags = tag.getElementsByTagName('source')
            let s = ''
            for (const stag of stags)
                s += `\n\t"${stag.src}"`
            console.log(logName + ` '${this.name}' source:`, s)
        }
        Object.seal(this)
    }

    get isTAO7() {
        return this.#isTAO7
    }

    onEnter(e) {
        super.onEnter(e)
    }
}