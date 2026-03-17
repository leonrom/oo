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
let C;
const
    logName = 'snd.TAO7: ',
    setAudioSrc = aO7 => {
        if (aO7.srcTags?.length) {
            let k = 0
            for (const srcTag of aO7.srcTags) {
                const
                    surl = srcTag.aO7snd_ori.url, // C.decodeUrl(srcTag.aO7snd_ori, aO7.name),
                    url = new URL(surl, document.baseURI).href

                if (srcTag.src !== url) {
                    srcTag.src = url
                    k++
                }
            }
            if (k)
                aO7.audio.load()
        }
        else    // основной src учитывается только если небыло <source>
            if (aO7.tag.src !== aO7.url)
                aO7.tag.src = aO7.url

        aO7.srcReady = true
    }

export class TAO7 extends AO7 {
    constructor(tag, srcTags, ori) {
        super(tag, ori)

        this.audio = tag
        this.audio.preload = "none"
        this.isAUDIO = true

        this.srcTags = srcTags    // для <audio>  с заданнм(и) <source>

        // Play.setListeners(tag, 'add')
        Object.seal(this)
    }
    onEnter(e) {
        if (!this.srcReady)
            setAudioSrc(this)
    }
    static prepare(c) {
        C = c
    }
    erase() {
        // Play.setListeners(this.tag, 'remove')
        if (this.srcTags)
            this.srcTags.length = 0
        super.erase()
    }
    static reset() {
        C.makeForTypName(tag => tag.aO7snd?.erase(), 'node', 'audio')
    }
}