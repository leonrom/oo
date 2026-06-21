/**
 * Pick.js
 * модуля snd
 * обработка событий мыши на тегах
 * 
 * ловит события мыши на аудиотегах и вызывает их обработка в соотв. aO7
 */

import { Play } from './Play.js'

const
    logName = 'snd.Pick: ',
    teves = Object.freeze({
        pointerover: 'E',  // 'enter',
        pointerout: 'L',  // 'leave',
        focusout: 'L',  // 'leave',
        focusin: 'E',  // 'enter',
        click: 'C',  // 'click',
    })


let C, clasn, firstClick;       // prevO7, 

function onLeavePage(e) {
    const actO7 = Play.actO7()
    if (actO7?.isOlgaSnd) {
        if (C.consts.debug)
            console.log(`прекращение звучания по событию '${e.type}'`)

        Play.stopSound(true)
    }
}

function handler(e) {
    const
        aO7 = e.target.aO7snd_ref,
        teve = teves[e.type]

    if (teve === 'C') {
        // console.log("%c%s", C.consts.fmtErr, `==========================================================`)
        const byClick = aO7?.byClick()
        if (byClick) aO7.onClick(e)
        else {
            const oO7 = Play.stopSound(!!aO7)
            if (aO7 && aO7 !== oO7)
                aO7.onEnter(e, 'byClick')  // вместо 'byClick' можно просто: true
        }
        // if (prevO7)
        //     prevO7.onClick()
        firstClick = true
    }
    else
        if (aO7 && (teve === 'E' || teve === 'L')) {
            const rO7 = e.relatedTarget?.aO7snd_ref // relatedTarget показывает откуда пришёл курсор или куда ушёл курсор
            if (rO7 === aO7)             //  игнорирую перемещения внутри одного контейнера
                return

            if (teve === 'E') aO7.onEnter(e)
            else aO7.onLeave(e)
        }

    // prevO7 = aO7
}

export const Pick = Object.freeze({
    firstClick: () => firstClick,
    init: function () {
        firstClick = false
    },
    prepare: function (c, clsn) {
        C = c
        clasn = clsn
        // for (const eve in teves)  -- теоретически может зацепить prototype.
        for (const eve of Object.keys(teves))
            document.addEventListener(eve, handler)

        document.addEventListener('visibilitychange', e => {
            if (document.hidden)
                onLeavePage(e)
        })
        document.addEventListener('mouseout', e => {
            if (!e.relatedTarget && !e.toElement) {
                onLeavePage(e)
            }
        })
        window.addEventListener('o-stopSound', onLeavePage)

    },
})