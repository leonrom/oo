
/**
 * Show.js 
 * Отображаются состояния звучания
 * только для тегов, у которых задан класс olga-snd (т.е. установлено aO7.isOlgaSnd)
 */

let C;

const
    logName = 'snd.Show: '

export const Show = Object.freeze({
    NONE: '',    
    PLAY: 'play',
    PAUSE: 'pause',
    ENDED: 'ended',
    PLAYING: 'playing',

    prepare: function (c) {
        C = c
    },

    showSound: function (stt, aO7) {
        if (!aO7.isOlgaSnd)
            return
console.log(stt)
        let cls = ''
        for (const e in this)
            if (typeof this[e] === 'string') {
                if (!cls && stt && stt === this[e])
                    cls = 'o-' + stt
                aO7.tag.classList.remove('o-' + this[e])
            } else
                break

        if (cls) {
            aO7.act.stt = stt
            aO7.tag.classList.add(cls)
        } 
        else  // если stt  пусто - просто сброс
            if (stt) {
                console.error("%c%s", C.consts.fmtErr, logName, `непредусмотренное stt='${stt}'`)
                debugger
            }
    },
})