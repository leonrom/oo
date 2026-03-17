
/**
 * Init.js
 * определение списков тегов <audio>
 * и тегов с class="olga-snd"
 *  
 * Их инициализация
 */

import { TAO7 } from './TAO7.js'
import { CAO7 } from './CAO7.js'

let clasn;  //, clasMatch;

const
    logName = 'snd.Init: ',
    listO7 = [],
    getAddrForTag = (tag, ref) => {
        const attrs = tag.attributes
        for (const from of [`data-${ref}`, `_${ref}`, `${ref}`])
            for (const atr of attrs)
                if (atr.name === from) {
                    const ori = atr.value,
                        url = C.decodeUrl(ori, tag.id)
                    return { ref, ori, url }
                }

        return null
    },
    initByClass = (tag, C) => {
        // // const
        //     // ms = tag.className.match(clasMatch),
        //     // s = ms ? ms[0] : ''
        // const ms = tag.className.match(clasMatch)
        // const s = ms ? ms[1] : ''
        let first = true
        for (const cls of tag.classList)
            if (cls.startsWith(`${clasn}:`)) {
                tag.classList.remove(cls)
                if (first) {
                    first = false
                    tag.classList.add(clasn)
                    if (!tag.tagName.match(/audio/i) &&     //  эти пойдут отдельно
                        !tag.classList.contains(CAO7.oNONE)   // для "временного" отключения
                    ) {
                        const
                            ss = cls.split(/\:|,|;/).slice(1),
                            aO7 = new CAO7(tag, ss, ss.at(-1) || '')

                        listO7.push({ name: aO7.name, node: aO7.tag.nodeName, ori: aO7.ori, url: aO7.url })
                    }
                }
            }
        // const s = tag.className
        //     .split(/\s+/)
        //     .find(c => c.startsWith(`${clasn}:`))

        // if (s) {
        //     tag.className = tag.className.replace(`${clasn}:${s}`, clasn)
        //     if (
        //         !tag.tagName.match(/audio/i) &&     //  эти пойдут отдельно
        //         !tag.classList.contains(CAO7.oNONE)   // для "временного" отключения
        //     ) {
        //         const
        //             ss = s
        //                 .split(/\:|,|;/)
        //                 .slice(1),
        //             aO7 = (new CAO7(tag, ss, ss.at(-1) || ''))

        //         listO7.push({ name: aO7.name, node: aO7.tag.nodeName, ori: aO7.ori, url: aO7.url })
        //     }
        // }
    },
    initForAudio = (tag, C) => {
        const
            srcTags = [],
            stags = tag.getElementsByTagName('source')

        if (stags?.length)
            for (const stag of stags) {
                stag.aO7snd_ori = getAddrForTag(stag, 'src') || ''
                if (stag.aO7snd_ori)
                    srcTags.push(stag)
            }

        const
            len = stags?.length || 0,
            addr =
                tag.getAttribute('audio_play') ||
                getAddrForTag(tag, 'src')

        if (addr || (len && len === srcTags.length)) {
            const aO7 = (new TAO7(tag, srcTags, addr?.url || ''))
            listO7.push({ name: aO7.name, node: aO7.tag.nodeName, ori: aO7.ori, url: aO7.url })
        }
        else {
            const err = `audio-тег '${C.getObjName(tag)}' - нет адреса`
            let s = `['data-src', '_src', 'src']`
            if (len)
                s += `во вложенном <source>`
            console.log("%c%s", C.consts.fmtErr, logName, err, ` ${s} `)
        }
    }
let C;

export const Init = Object.freeze({
    init: function () {
        // clasMatch = new RegExp(`(?<=${clasn}:)[^\\s]+`) 
        // Можно переписать регулярку без lookbehind.
        // clasMatch = new RegExp(`${clasn}:([^\\s]+)`)

        C.makeForTypName(tag => initByClass(tag, C), 'myclass', clasn)

        C.makeForTypName(tag => initForAudio(tag, C), 'node', 'audio')

        if (!listO7.length) {
            console.log("%c%s", C.consts.fmtErr, logName, `Нет объектов с class='${clasn}' или тегов <audio>`,
                `в документе или в его тегах с 'olga-start' (вообще, или без '${CAO7.oNONE}' и ':N')`)
            return
        }

        if (C.consts.debug)
            C.ConsoleInfo(`Найдены snd/audio `, listO7.length, listO7)
    },
    prepare: function (c, clsn) {
        C = c
        clasn = clsn
    },
    reset: function () {
        listO7.length = 0
    }
})