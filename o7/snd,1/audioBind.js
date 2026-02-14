/**
 * 4. Привязка к элементам
 * Создание AO7 при первом hove
 */
// audioBind.js
import { AO7 } from './AO7.js'

export function bindAudioHover(root = document) {

    function ensureAO7(el) {
        if (!el.aO7)
            el.aO7 = new AO7(el)
        return el.aO7
    }

    function enter(e) {
        const el = e.currentTarget
        ensureAO7(el).onEnter()
    }

    function leave(e) {
        const el = e.currentTarget
        if (el.aO7) el.aO7.onLeave()
    }

    function click(e) {
        const el = e.currentTarget
        ensureAO7(el).onClick()
    }

    const nodes = root.querySelectorAll('[data-sound]')

    nodes.forEach(el => {
        el.addEventListener('mouseenter', enter)
        el.addEventListener('mouseleave', leave)
        el.addEventListener('click', click)
    })

    return () => {
        nodes.forEach(el => {
            el.removeEventListener('mouseenter', enter)
            el.removeEventListener('mouseleave', leave)
            el.removeEventListener('click', click)
        })
    }
}
