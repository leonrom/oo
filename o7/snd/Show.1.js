
/**
 * Show.js 
 * Отображаются состояния звучания
 * только для тегов, у которых задан класс olga-snd (т.е. установлено aO7.isOlgaSnd)
 */

let C;

const
    logName = 'snd.Show: '
// getClass = eve => {
//     switch (eve) {
//         case Show.PLAY: return Show.cPLAY
//         case Show.PAUSE: return Show.cPAUSE
//         case Show.ENDED: return Show.cENDED
//         case Show.PLAYING: return Show.cPLAYING
//     }
//     console.error("%c%s", C.consts.fmtErr, logName, `непредусмотренное eve='${eve}'`)
//     debugger
// }

export const Show = Object.freeze({

    PLAY: 'play',
    PAUSE: 'pause',
    ENDED: 'ended',
    PLAYING: 'playing',

    prepare: function (c) {
        C = c
        // clasn = W.clasn
    },

    showSound: function (stt, aO7) {
        if (!aO7.isOlgaSnd)
            return

        let cls = ''
        for (const e in this)
            if (typeof this[e] === 'string') {
                if (!cls && stt && stt === this[e])
                    cls = 'o-' + stt
                aO7.tag.classList.remove('o-' + this[e])
            } else
                break

        if (cls) {
            aO7.stt = stt
            aO7.tag.classList.add(cls)
        } 
        else
            if (stt) {
                console.error("%c%s", C.consts.fmtErr, logName, `непредусмотренное stt='${stt}'`)
                debugger
            }
        // if (eve === this.PLAYING) aO7.audio.addEventListener(this.ENDED, onEnded)
        // else
        //     aO7.audio.removeEventListener(this.ENDED, onEnded)
    },
})