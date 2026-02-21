/**
 * 3. Класс AO7 (создаётся при первом hover)
 */
// AO7.js
import { Cur } from './Cur.js'

const
    fillModis = (quals) => {
        const m = Object.seal({ alive: false, free: false, loop: false, over: false, none: false, })
        for (let i = 0; i < quals.length - 1; i++) {
            const qual = quals[i]
            for (const c of qual)
                switch (c) {
                    case 'A': m.alive = true; break  //звучание не прекращается после увода курсора с тега 
                    case 'F': m.free = true; break  //не использовать встроенный класс olga_snd для отображения тега;
                    case 'L': m.loop = true; break  //звучание зацикливается;
                    case 'O': m.over = true; break  // звучание начинается по наведению курсора.
                    case 'N': m.none = true; break  //не обрабатывать звучание
                    default: console.error(`Непонятныо '${c}'`, `в квалификаторе qual='${qual}'`)
                }
        }
        return m
    },
    getOri = (quals, snd) => {
        const u = quals.at(-1)
        switch (u.toLowerCase()) {
            case 'href': return snd.getAttribute('href')
            case 'src': return snd.getAttribute('src')
            case 'n': return ''
        }
        return u
    }

export class AO7 {
    constructor(snd, C) {
        const
            ms = snd.className.match(/(?<=olga-snd:)[^\s]+/),
            quals = ms[0].split(/\:|,|;/),
            ori = getOri(quals, snd)

        this.url = ori ? C.decodeUrl(ori, this.name) : ''


        this.modis = Object.freeze(fillModis(quals))

        this.snd = snd

        this.hoverInside = false
        this.loading = false
    }
    atitle = { title: '', state: 0 }
    setTitle(firstClick) {
        if (this.atitle.state > 0) return
        if (!firstClick && this.atitle.state === 0) {
            this.atitle.state = -1
            this.atitle.title = snd.title
            snd.title = 'чтобы началось звучание - кликните на странице'
        }
        else
            if (firstClick && this.atitle.state < 0) {
                this.atitle.state = 1
                snd.title = this.atitle.title
            }
    }

    async preload() {
        if (!this.url) return
        if (this.loading) return
        this.loading = true

        await Cur.ensureLoaded(this.url)

        this.loading = false

        if (this.hoverInside && this.modis.over)
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
