
/**
 * Init.js
 * модуля snd
 * определение списков тегов <audio>
 * и тегов с class="olga-snd"
 *  
 * Их инициализация
 */

import { TAO7 } from './TAO7.js'
import { CAO7 } from './CAO7.js'

let C, clasn;

const
    logName = 'snd.Init: ',
    listO7 = [],
    getAddrForTag = (tag, ref) => {
        const attrs = tag.attributes
        for (const from of [`${ref}`, `_${ref}`, `data-${ref}`])
            for (const atr of attrs)
                if (atr.name === from)
                    return (atr.value || '').trim()
    },
    addSrc = (audio, src) => {
        const source = document.createElement('source')
        source.setAttribute('src', src)
        audio.appendChild(source)
    },
    initByClass = tag => {
        if (tag.nodeName === 'AUDIO')
            return

        const atr = C.extractClassAttr(tag, clasn)
        if (atr)
            if (atr?.ori) {
                const aO7 = new CAO7(tag, atr.quals, atr.ori)
                listO7.push({ name: aO7.name, node: aO7.tag.nodeName, ori: aO7.ori })
            }
            else
                console.log("%c%s", C.consts.fmtErr,
                    logName + `audio-тег '${C.getObjName(tag)}' - нет адреса`,
                    `в квалификаторе ${atr.cls}`)
    },
    initForAudio = tag => {
        const stags = tag.getElementsByTagName('source')
        let l = stags?.length || 0

        if (l)
            for (const stag of stags) {
                const src = getAddrForTag(stag, 'src')
                stag.src = C.decodeUrl(src, stag.id)
            }

        const src = getAddrForTag(tag, 'src')
        if (src) {
            l++
            tag.removeAttribute('src')
            addSrc(tag, C.decodeUrl(src, tag.id))
        }

        const atr = C.extractClassAttr(tag, clasn)
        if (atr?.ori) {
            l++
            addSrc(tag, C.decodeUrl(atr.ori, tag.id))
        }

        if (l) {
            tag.load()
            const aO7 = (new TAO7(tag, atr?.quals || '', stags))
            listO7.push({ name: aO7.name, node: aO7.tag.nodeName, ori: '..' })
        }
        else
            console.log("%c%s", C.consts.fmtErr,
                logName + `audio-тег '${C.getObjName(tag)}' - нет адреса`,
                `ни в <source>'ах, ни в ['data-src', '_src', 'src'], ни в квалификаторе ${clasn}`)
    }

export const Init = Object.freeze({
    init: function () {
        C.makeForTypName(tag => initForAudio(tag), 'node', 'audio')
        C.makeForTypName(tag => initByClass(tag), 'myclass', clasn)

        if (!listO7.length) {
            console.log("%c%s", C.consts.fmtErr, logName + `Нет объектов с class='${clasn}' или тегов <audio>`,
                `в документе или в его тегах с 'olga-start' `)
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