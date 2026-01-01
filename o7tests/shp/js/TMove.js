"use strict";
export class TMove {
    static head = ' Тестовый пример:  '
    static fmOK = "background: lightgray; color: black;"
    static fmErr = "background: yellow; color: black;"
    static #StopMove(e) {
        const
            o5Move = TMove.#o5Move,
            aO5 = o5Move.aO5,
            shp = aO5.cnst.shp,
            dif = o5Move.mousDiff,
            t = aO5.transform

        Object.assign(o5Move.div.style, { display: 'none', })
        shp.classList.remove('o-shpMoved')
        shp.style.outline = o5Move.divStrt.outline

        if (shp.classList.contains('is-moveable')) {
            t.x += dif.dx
            t.y += dif.dy
            shp.style.transform = `translate(${t.x}px, ${t.y}px)`
        }

        if (dif.dx > 1 || dif.dy > 1) {
            const
                p1 = shp.getBoundingClientRect(), // д.б. ПОСЛЕ  shp.style.transform = ... !!!
                aAlls = aO5.pBase.aAll,      //  document.body.pO5.aAlls
                errs = []

            let tag = o5Move.aO5.cnst.parent
            do {
                if (tag.pO5) {
                    const p2 = tag.getBoundingClientRect()
                    if (
                        p1.left < p2.left || p1.top < p2.top || p1.bottom > p2.bottom || p1.right > p2.right
                    ) {
                        errs.push(`выводить  ${aO5.name} за пределы видимости`)
                        break
                    }
                }
                tag = tag.parentElement
            } while (tag && tag.nodeName !== 'HTML')

            for (const xO5 of aAlls)
                if (xO5 !== aO5) {
                    const
                        pF = xO5.fixs,
                        p2 = (pF.T.xO5 || pF.L.xO5 || pF.R.xO5 || pF.B.xO5) ? xO5.posC
                            : xO5.cnst.shp.getBoundingClientRect()
                    if (
                        (
                            (p1.left <= p2.right && p1.right >= p2.left) ||
                            (p2.left <= p1.right && p2.right >= p1.left)
                        ) && (
                            (p1.top <= p2.bottom && p1.bottom >= p2.top) ||
                            (p2.top <= p1.bottom && p2.bottom >= p1.top)
                        )
                    )
                        errs.push(`накладывать ${aO5.name} на тег '${aO5.name}'`)
                }
            if (errs.length)
                window.olga7.C.ConsoleLog(TMove.head, ` Не следует ${errs.join('; ')}`, 1, e)
        }
        aO5.pBase.ReorderAO5s()
    }
    static #DoMove(e) {
        const o5Move = TMove.#o5Move
        Object.assign(o5Move.mousDiff, {
            dy: e.pageY - o5Move.mousStrt.y,
            dx: e.pageX - o5Move.mousStrt.x,
        })
        Object.assign(o5Move.div.style, {
            top: (o5Move.divStrt.y + o5Move.mousDiff.dy) + 'px',
            left: (o5Move.divStrt.x + o5Move.mousDiff.dx) + 'px',
        })
    }
    static #StartMove(e) {
        const
            o5Move = TMove.#o5Move,
            shp = e.currentTarget,
            aO5 = shp.aO5shp,
            nst = window.getComputedStyle(shp),
            p = aO5.shdw.getBoundingClientRect()

        o5Move.aO5 = aO5

        Object.assign(o5Move.mousDiff, { dy: 0, dx: 0, })

        Object.assign(o5Move.divStrt, {
            width: p.width,
            height: p.height,
            y: p.y,
            x: p.x,
            oy: shp.offsetTop - p.y,
            ox: shp.offsetLeft - p.x,
            outline: shp.style.outline,
        })
        shp.style.outline = "dashed blue 2px"  // надо перебить заданный

        Object.assign(o5Move.mousStrt, { x: e.pageX, y: e.pageY })

        Object.assign(o5Move.margs, {
            borderWidth: parseFloat(nst.borderTopWidth) + parseFloat(nst.borderRightWidth),
            borderHeight: parseFloat(nst.borderTopWidth) + parseFloat(nst.borderBottomWidth),
        })

        Object.assign(o5Move.div.style, {
            display: '',
            top: p.top + 'px',
            left: p.left + 'px',
            width: p.width + 'px',
            height: p.height + 'px',
        })

        shp.classList.add('o-shpMoved')
        // shp.classList.add('o_moved_' + + performance.now().toString(36))

        TMove.#DoMove(e)
    }
    constructor() {
        Object.assign(this, {
            div: document.createElement('div'),
            aO5: null, divStrt: {}, mousDiff: {}, mousStrt: {}, margs: {},
        })

        Object.seal(this)

        this.div.id = 'o5move'
        // this.div.classList.add('o5move')

        document.body.appendChild(this.div)
    }
    static IsInside(x, y, tag) {
        const
            p = tag.getBoundingClientRect(),
            x1 = p.left + tag.clientLeft,
            y1 = p.top + tag.clientTop,
            x2 = x1 + tag.clientWidth,
            y2 = y1 + tag.clientHeight
        return x > x1 && x < x2 && y > y1 && y < y2
    }
    static #o5Move = null
    static Start(e) {
        if (!TMove.IsInside(e.x, e.y, e.currentTarget))
            return

        e.preventDefault()
        e.stopPropagation()

        if (TMove.#o5Move) {
            console.log("%c%s", TMove.fmErr, TMove.head, 
                ` Не сброшен предыдущий o5Move для '${TMove.#o5Move.aO5.name}'`, '', 1, e)
            TMove.#StopMove(e)
        }
        TMove.#o5Move = new TMove()
        TMove.#StartMove(e)
        document.addEventListener('mousemove', TMove.#DoMove)
        document.addEventListener('mouseup', TMove.#Finish)
        document.addEventListener('mouseleave', TMove.#Finish)
    }
    static #Finish(e) {
        if (!TMove.#o5Move) {
            console.log("%c%s", TMove.fmErr, TMove.head, ` Завершение сдвига при пустом o5Move`, '', 1, e)
            return
        }
        document.removeEventListener('mouseleave', TMove.#Finish)
        document.removeEventListener('mouseup', TMove.#Finish)
        document.removeEventListener('mousemove', TMove.#DoMove)
        TMove.#StopMove(e)

        TMove.#o5Move.div.remove()
        TMove.#o5Move = null

        const pO5 = TMove.#o5Move?.aO5.pBase.pO5
        if (pO5)
            window.dispatchEvent(new CustomEvent('o_makeScroll',
                { detail: { scV: 0.1, scH: 0.1, pO5: pO5, revers: false } }
            ))
    }
}

