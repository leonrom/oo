
/**
 * определение списков тегов <audio>
 * и тегов с class="olga-snd"
 * файл Init.js
 * 
 * для тегов с class="olga-snd" выполняется первичня инициализация
 */

import { AO7 } from './AO7.js'
import { Curr } from './Curr.js'

let clasn, clasMatch;

const
    found = [],
    errs = [],
    aO7s = new Set(),
    addErr = (name, url, txt, atr, err) => {
        errs.push({ name: name, 'источник': url, 'пояснение': txt, val: atr, 'ошибка': err })
    },
    OnPlay = e => {
        Curr.playO7(e.target.aO7snd)
    },
    initByClass = (tag, C) => {
        const
            ms = tag.className.match(clasMatch),
            s = ms ? ms[0] : ''

        if (s) {
            tag.className = tag.className.replace(`${clasn}:${s}`, clasn)
            if (
                !tag.tagName.match(/audio/i) &&     //  эти пойдут отдельно
                !tag.classList.contains('o-none')   // для "временного" отключения
            )
                aO7s.add(new AO7(tag, s.split(/\:|,|;/)))
        }
    },
    initForAudio = (tag, C) => {
        const addr =
            tag.getAttribute('audio_play') ||
            C.getAddrForTag(tag, 'src')

        if (addr) {
            aO7s.add(new AO7(tag, [addr.url]))
            tag.addEventListener('play', OnPlay)
        }
        else
            addErr(C.getObjName(tag), 'PrepUrlsAudio()', `тег 'audio'`, '',
                `нет ни 'audio_play', ни ['data-src', '_src', 'src']`)
    },
    propagate = (el, aO7) => {
        for (const ch of el.children) {
            if (!ch.aO7snd)
                ch.aO7snd_ref = aO7

            propagate(ch, aO7)
        }
    }
let C;

export const Init = {
    init: function (W) {
        
        clasMatch = new RegExp(`(?<=${W.clasn}:)[^\\s]+`)

        C.makeForTypName(tag => initByClass(tag, C), 'myclass', W.clasn)
        C.makeForTypName(tag => initForAudio(tag, C), 'node', 'audio')

        if (aO7s.size) {
            const rez = []
            for (const aO7 of aO7s) {

                propagate(aO7.snd, aO7)

                if (C.consts.debug)
                    rez.push({ name: aO7.name, node: aO7.snd.nodeName, ori: aO7.ori, url: aO7.url })
            }
            aO7s.clear()

            if (rez.length)
                C.ConsoleInfo(`Найдены snd/audio `, rez.length, rez)
            if (errs.length) {
                C.ConsoleError(`snd: ошибки перекодировки тегов с ${clasn}`, errs.length, errs)
                errs.length = 0
            }
        } else
            console.log("%c%s", C.consts.fmtErr, `Нет объектов с class='${clasn}' или тегов <audio>`,
                `в документе или в его тегах с 'olga-start' (вообще, или без 'o-none' и ':N')`)
    },
    prepare: function (c, W) {
        C = c
        const shm = { name: '?', node: '', ref: '', ori: '', url: '' }
        found.Push = function (obj) { C.shmPush(this, obj, shm) }
    },
    reset: function () {
        C.makeForTypName(tag => tag.removeEventListener('play', OnPlay), 'node', 'audio')
    }
}