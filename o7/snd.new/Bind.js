
/**
 * 4. Привязка к элементам -  Создание AO7 при первом hove
 * файл Bind.js
 * 
 * делегированный (один комплект listener’ов)
 * работает в Blogger
 * pointer + keyboard
 * не создаёт лишний AO7
 * корректно фильтрует «внутренние» переходы
 * легко снимается unbind()
 */

// Bind.js
import { AO7 } from './AO7.js'

const acts = {
    enter: AO7.prototype.onEnter,
    leave: AO7.prototype.onLeave,
    click: AO7.prototype.onClick,
}
const eves = {
    pointerover: 'enter',
    pointerout: 'leave',
    focusout: 'leave',
    focusin: 'enter',
    click: 'click',
}

let firstEve = true, firstClick, selector, C;

function handler(e) {
    // if (e.target.id === 's1' || e.target.id === 's2')
    //     debugger
    const
        snd = e.target.closest(selector),
        teve = eves[e.type]

if (e.type==='click' && !firstClick)
    firstClick=true

    if (!teve || !snd ||
        (firstEve && teve === 'enter') ||
        (e.relatedTarget && snd.contains(e.relatedTarget))      // игнор перехода внутри того же элемента
    )
        return
    
    firstEve = false

    const aO7 = snd.aO7snd

    if (aO7.modis.over)
        aO7.setTitle(firstClick)

    acts[teve].call(aO7, e)
}

        function selectCls(clasn){


    if (!aO7)
        aO7=snd.aO7snd = new AO7(snd, C)
        }
export const Bind = {
    init: function (clasn) {
        firstEve = true
        selectCls(clasn)
    },
    prepare: function (c, clasn) {
        C = c
        selector = `.`+clasn
        for (const eve in eves)
            document.addEventListener(eve, handler)
    },
}