/**
 * Pick.js
 * модуль pop
 * обработка событий на теге
 *      - DCLCK: двойной клик
 *      - CLICK: простой клик
 *      - 'A' или 'O': курсор "замер" на теге
 * первые 2 события на теге открывают всплытие окна если оно не было всплыто для тегов с соответствущей модой. 
 *  И они же закрывают всплывшее окно для любых (в т.ч. 'A' или 'O') тегов
 * 
 *  Окна с одинаковым url открываются с сохранёнными размерами. 
 * Чтобы исходный - держать shiftKey/ctrlKey/altKey при клике
 * 
 * Нажатие ShiftKey : 
 *  - при открытии окна позиционирует всплывшее окно в исходное (авторское ) положение
 *  - при закрытии окна сохраняет его позицию и размеры
 */

let C, popDelay, popDelta, deltaXY;
import { AO7 } from './AO7.js'
import { Wnd } from './Wnd.js'
import { Div } from './Div.js'

const
    logName = 'pop.Pick: ',
    keyEves = Object.freeze({
        UP: 'keyup',
        DN: 'keydown',
    }),
    tagEves = Object.freeze({
        // CLK: 'click',
        DBL: 'dblclick',
        CLK: 'pointerup',
        OUT: 'pointerout',
        OVER: 'pointerover',
    }),
    pop = {
        actO7: null, reqID: 0, t: 0, x: 0, y: 0, t: 0,
        start: true, session: 0, isKey: false,
    }

let isKey;
function pointler(e) {
    if (isKey !== C.IsKey(e)) { // e.shiftKey переключатель drag/resize
        isKey = C.IsKey(e)
        Wnd.setShift(isKey)
    }
}

function popUp(aO7, byClick, isKey) {
    const wnd = Wnd.getWnd(aO7.url)
    if (wnd.aO7) {
        if (wnd.aO7 === aO7) wnd.close(isKey)
        else
            wnd.putOnTop(aO7)
    } else
        wnd.open(aO7, byClick, isKey)

    // wnd.close()
    pop.t = window.performance.now()
}

function startListener(aO7) {
    if (pop.actO7)
        stopListener()
    if (C.consts.debug > 1)
        console.log(logName, `startListener  aO7=${aO7.name}`)

    pop.start = true
    pop.actO7 = aO7
    pop.session++

    const session = pop.session

    function loop(t) {
        if (session !== pop.session || !pop.actO7) return

        let dx = Math.abs(pop.x - C.mouse.x)
        let dy = Math.abs(pop.y - C.mouse.y)

        pop.x = C.mouse.x
        pop.y = C.mouse.y
        pop.isKey = C.mouse.isKey

        if (pop.start || dx >= deltaXY || dy >= deltaXY) pop.t = t
        else
            if (t - pop.t >= popDelay) {

                if (aO7.wnd) aO7.wnd.putOnTop()
                else
                    popUp(aO7, false, pop.isKey)

                if (C.consts.debug > 1)
                    console.log(logName, `закончен Listener  actO7=${pop.actO7.name}`)
                pop.actO7 = null
                return // после показа — остановка
            }
        pop.start = false
        pop.reqID = requestAnimationFrame(loop)
    }

    pop.reqID = requestAnimationFrame(loop)
}

function stopListener() {
    if (!pop.actO7)
        return
    if (C.consts.debug > 1)
        console.log(logName, `stopListener  actO7=${pop.actO7.name}`)

    if (pop.reqID)
        window.cancelAnimationFrame(pop.reqID)
    pop.actO7 = null
    pop.session++ // ← убивает все старые loop
}

function handler(e) {
    if (!e.target.aO7pop_ref)
        return

    const
        aO7 = e.target.aO7pop_ref,
        isclk = e.type === tagEves.CLK,
        isdbl = e.type === tagEves.DBL,
        clicked = isclk || isdbl,
        wnd = aO7.wnd

    if (clicked) {
        stopListener(aO7)

        if (wnd) {
            if (window.performance.now() - pop.t > popDelta)  // защита от дребезга
                if (Wnd.isOnTop(wnd)) wnd.close(C.IsKey(e))   // e.shiftKey)
                else
                    wnd.putOnTop(aO7)
        }
        else {
            const adbl = aO7.mode === AO7.M.DCLCK
            if (!adbl || (adbl && isdbl))
                popUp(aO7, true, C.IsKey(e))    //e.shiftKey)
        }
    }
    else
        if ((aO7.mode === 'A' || aO7.mode === 'O') &&
            aO7 !== e.relatedTarget?.aO7pop_ref
        )
            if (e.type === tagEves.OVER) {
                if (!wnd || !Wnd.isOnTop(wnd))
                    startListener(aO7)
            } else
                if (e.type === tagEves.OUT) {
                    stopListener(aO7)
                    if (wnd && aO7.mode === 'O' && !wnd.byClick)
                        wnd.close(C.IsKey(e))
                }
}

export const Pick = Object.freeze({
    init: function () {
    },
    prepare: function (c, delay, delta, dXY) {
        C = c

        popDelay = delay > 10 ? delay : delay * 1000
        popDelta = delta > 10 ? delta : delta * 1000
        deltaXY = dXY

        for (const eve of [...Object.values(tagEves)])
            document.addEventListener(eve, handler)
        for (const eve of [...Object.values(keyEves)])
            document.addEventListener(eve, pointler)

        // страховка
        window.addEventListener('blur', e=>{
            if (Div.action)
            Div.endDrag('on blur')
        })
    },
    reset: function () {
    }
})