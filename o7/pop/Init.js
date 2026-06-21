/**
 * Init.js
 * модуля pop
 * определение тегов с class="olga-pop" 
 * и создание для них структуры o7pop
 *  
 * Их инициализация
 */


import { AO7 } from './AO7.js'
let C, clasn;

const
    logName = 'pop.Init: ',
    listO7 = [],
    initByClass = tag => {
        const atr = C.extractClassAttr(tag, clasn)
        if (atr)
            if (atr.ori) {
                const aO7 = new AO7(tag, atr.quals, atr.ori)
                listO7.push({ name: aO7.name, node: aO7.tag.nodeName, ori: aO7.ori })
            }
            else
                console.log("%c%s", C.consts.fmtErr,
                    logName + `audio-тег '${C.getObjName(tag)}' - нет адреса`,
                    `в квалификаторе ${atr.cls}`)
    }

export const Init = Object.freeze({
    init: function () {
        C.makeForTypName(tag => initByClass(tag), 'myclass', clasn)

        if (!listO7.length) {
            console.log("%c%s", C.consts.fmtErr, logName + `Нет объектов с class='${clasn}' или тегов <audio>`,
                `в документе или в его тегах с 'olga-start' `)
            return
        }

        if (C.consts.debug)
            C.ConsoleInfo(`Найдены pop `, listO7.length, listO7)
    },
    prepare: function (c, clsn) {
        C = c
        clasn = clsn
    },
    reset: function () {
    }
})