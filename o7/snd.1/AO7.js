/**
 * 3. Класс AO7 (создаётся при первом hover)
 */
// AO7.js
import { AudioCore } from './audioCore.js'

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

        await AudioCore.ensureLoaded(this.url)

        this.loading = false

        if (this.hoverInside && this.over)
            AudioCore.play(this.url)
    }

    onEnter() {
        this.hoverInside = true
        this.preload()
    }

    onLeave() {
        this.hoverInside = false
    }

    onClick() {
        AudioCore.toggle(this.url)
    }
}
