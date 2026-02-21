
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

function handler(e) {
    const snd = e.target.closest('[data-sound]'),
        teve = eves[e.type]

    if (!teve || !snd || !document.contains(snd))
        return

    const notO7 = !snd.aO7
    if (
        (notO7 && teve === 'leave') ||      // пока - не надо обрабатывать
        (e.relatedTarget && snd.contains(e.relatedTarget))      // игнор перехода внутри того же элемента
    )
        return

    if (notO7)
        snd.aO7 = new AO7(snd)

    acts[teve].call(snd.aO7, e)
}

export const Bind = {
    init: function () {
        for (const eve in eves)
            document.addEventListener(eve, handler)
    },
    destroy: function () {
        for (const eve in eves)
            document.removeEventListener(eve, handler)
    }
}

/*
Чтобы элемент ловил focus:

<span data-sound="a.mp3" tabindex="0">...</span>

Если хочешь подсветку при фокусе:

[data-sound]:focus {
    outline: 2px solid #999;
}
*/