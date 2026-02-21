/**
 *  Обслущиавние всех аудио класса olga-snd
 * Comm.js
 * 
  */
import { Curr } from './Curr.1.js'

export class Comm {

    audio = new Audio()
    aO7 = null

? имя     playO7(aO7) {
        this.aO7 = aO7
        Curr.playByO7(aO7)
}
    // async playO7(aO7) {
    //     this.aO7 = aO7
    //     this.audio.src = aO7.url
    //     if (!this.url || this.loading) return
    //     this.loading = true

    //     await Urls.ensureLoaded(this.url)

    //     this.loading = false

    //     const doPlay = (this.hoverInside && this.modis.over)
    //         ? canPlayAfterClick(this)
    //         : this === comm.aO7

    //     if (doPlay) {
    //         console.log(`--- AO7.preload aO7=${this.name} prev=${comm.aO7.name}`)
    //         Curr.playByO7(aO7)
    //     }
    // }

    static destroy() {
        this.aO7 = null
        this.audio = null
    }
    // ─────────────────────────────────────────────
    // toggle
    // ─────────────────────────────────────────────
    toggle(url) {

        // тот же звук
        if (!commonAudio?.paused && curUrl === url) {
            commonAudio.pause()
            commonAudio.currentTime = 0
        }
        else
            play(url)
    }
    pause(url) {
        if (curUrl === url &&
            !commonAudio?.paused && !commonAudio?.ended
        ) {
            commonAudio.pause()
            return true
        }
    }
} 
