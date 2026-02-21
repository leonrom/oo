
/**
 * 4. обработка событий на тегах
 * файл EveTags.js
 * 
 * делегированный (один комплект listener’ов)
 * работает в Blogger
 * pointer + keyboard
 * не создаёт лишний AO7
 * корректно фильтрует «внутренние» переходы
 * легко снимается unbind()
 */

import { AO7 } from './AO7.js'

const eves = Object.freeze({
    pointerover: 'enter',
    pointerout: 'leave',
    focusout: 'leave',
    focusin: 'enter',
    click: 'click',
})

let prevO7, isFirstClick, C;

function handler(e) {
    const
        tag = e.target,
        teve = eves[e.type],
        aO7 = tag.aO7snd_ref || tag.aO7snd

    if (C.consts.debug > 1) {
        const name = C.getObjName(tag)
        if (name.indexOf('olga5_Start') < 0)
            console.log(` ${e.type.padEnd(12)} на '${name}':  '${aO7 ? aO7.name : 'undef'}'   prevO7='${prevO7 ? prevO7.name : 'undef'}'`)
    }
    if (teve === 'click') {
        isFirstClick = true
        if (aO7)
            aO7.onClick()
    }
    else        //   (teve === 'leave' || teve === 'enter') 
        if (prevO7 !== aO7) {
            if (prevO7)
                prevO7.onLeave()

            if (aO7)
                if (teve === 'enter')
                    aO7.onEnter()
                else
                    aO7.onLeave()
        }

    prevO7 = aO7
}

export const EveTags = {
    hasFirstClick: function () {
        return isFirstClick
    },
    init: function () {
        prevO7 = null
    },
    reset: function () {
    },
    prepare: function (c) {
        C = c
        for (const eve in eves)
            document.addEventListener(eve, handler)
    },
}