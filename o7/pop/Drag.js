let C, div, raf, check, oldCursor;

const
    drag = Object.seal({ aO7div: null, lastT: 0, lastL: 0, lastW: 0, lastH: 0, }),
    dragLT = (v, dv, min, max) => {
        v += dv
        if (v < min) return min
        if (v > max) return max
        return v
    },
    sizeWH = (v, dv, side, min, max) => {
        if (side) v += dv
        else v -= dv
        const d = v < min ? min - v
            : (v > max ? max - v : 0)
        if (d)
            v += d
        return v
    }

export const Drag = {
    DRING: 'dragging',
    SIZE: 'resizing',
    SHIFT: 'isKey',
    pointerId: null,

    prepare: c => C = c,

    apply: function () {
        raf = 0
        Object.assign(div.style, {
            height: drag.lastH + 'px',
            width: drag.lastW + 'px',
            left: drag.lastL + 'px',
            top: drag.lastT + 'px',
        })
    },

    finish: function (e) {
        if (raf) {
            cancelAnimationFrame(raf)
            raf = 0
        }

        if (div) {
            document.body.style.cursor = oldCursor
            div.classList.remove(Drag.DRING, this.SIZE)
            if (div.hasPointerCapture(Drag.pointerId))
                try { div.releasePointerCapture(Drag.pointerId) }
                catch (e) {
                    console.error(`releasePointerCapture: `, e.message)
                }
        }

        Drag.pointerId = null
    },

    start: function (aO7div, resizeable, sideR, sideB, clientX, clientY, onhead) {
        let minX, maxX, minY, maxY, isKey, cls;
        const
            maxH = window.innerHeight,
            maxW = window.innerWidth,
            minH = 111,
            minW = 222,
            calcMXY = () => {
                const
                    bH2 = Math.max(aO7div.bar.offsetHeight * 0.8, 12),
                    bW2 = Math.max(aO7div.btns.offsetWidth * 0.7, 12)

                minY = bH2 - aO7div.div.offsetHeight
                minX = bW2 - aO7div.div.offsetWidth
                maxY = window.innerHeight - bH2
                maxX = window.innerWidth - bW2
            }

        if (Drag.pointerId !== null) {
            C.ConsoleError(`вызов start() при Drag.pointerId !== null`)
            return
        }

        div = aO7div.div
        check = (onhead || resizeable) ? -1 : 1 // -1 - не надо проверять; +1 - дождаться сдвига 3px
        oldCursor = document.body.style.cursor

        const r = div.getBoundingClientRect()
        Object.assign(drag, {
            aO7div: aO7div,
            lastT: r.top,
            lastL: r.left,
            lastW: r.width,
            lastH: r.height,
        })

        function setCursorClass() {
            isKey = drag.aO7div.isKey
            cls = resizeable ?
                isKey ? Drag.DRING : Drag.SIZE :
                isKey ? Drag.SIZE : Drag.DRING

            div.classList.remove(Drag.DRING, Drag.SIZE, Drag.SHIFT)
            div.classList.add(cls)
            if (cls === Drag.DRING)
                calcMXY()
        }

        function doAction(e) {

            if (check !== 0) {
                if (check > 0 &&
                    Math.hypot(e.clientX - clientX, e.clientY - clientY) < 3
                )
                    return

                check = 0
                Drag.pointerId = e.pointerId

                document.body.style.cursor = 'grabbing'
                div.setPointerCapture(Drag.pointerId)
                // document.body.style.cursor = 'grabbing'
            }

            if (isKey !== drag.aO7div.isKey)  // переключатель drag/resize
                setCursorClass()

            const dx = e.clientX - clientX
            if (dx) {
                if (cls === Drag.SIZE) {
                    const w = drag.lastW
                    drag.lastW = sizeWH(w, dx, sideR, minW, maxW)
                    if (!sideR)
                        drag.lastL -= drag.lastW - w
                } else
                    drag.lastL = dragLT(drag.lastL, dx, minX, maxX)

                clientX = e.clientX
            }

            const dy = e.clientY - clientY
            if (dy) {
                if (cls === Drag.SIZE) {
                    const h = drag.lastH
                    drag.lastH = sizeWH(h, dy, sideB, minH, maxH)
                    if (!sideB)
                        drag.lastT -= drag.lastH - h
                } else
                    drag.lastT = dragLT(drag.lastT, dy, minY, maxY)

                clientY = e.clientY
            }

            if (!raf)
                raf = requestAnimationFrame(Drag.apply)
        }

        setCursorClass()
        return doAction
    }
}