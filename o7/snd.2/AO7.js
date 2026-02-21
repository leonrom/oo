/**
 * 3. Класс AO7 (создаётся при первом hover)
 */
// AO7.js
import { Cur } from './Cur.js'

export class AO7 {

    constructor(el) {
        this.el = el
        this.url = el.dataset.sound || el.getAttribute('data-sound')
        this.over = el.hasAttribute('data-over')

        this.hoverInside = false
        this.loading = false
    }

    async preload() {
        if (!this.url) return
        if (this.loading) return
        this.loading = true

        await Cur.ensureLoaded(this.url)

        this.loading = false

        if (this.hoverInside && this.over)
            Cur.play(this.url)
    }

    onEnter() {
        this.hoverInside = true
        this.preload()
    }

    onLeave() {
        this.hoverInside = false
    }

    onClick() {
        Cur.toggle(this.url)
    }
}
/*
Что значит «приоритет клика»

Клик должен:

Всегда побеждать hover

Отменять hover-play

Не давать hover-stop сразу после клика

Как это делается

В AO7 вводится флаг:

this.clickedAt = 0


В onClick:

this.clickedAt = performance.now()


В onLeave:

if (performance.now() - this.clickedAt < 150)
    return


То есть:

клик произошёл → игнорируем ближайший leave
*/
