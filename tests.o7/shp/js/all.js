"use strict";
/* global window, document, console, TMove */

import { TMove } from './TMove.js';
import { TInit } from './TInit.js';

let o_debug;
class OO5 {
    frame = 'frame'
    pitch = 'pitch'
    pmark = 'pmark'
    level = 'level'
    alive = 'alive'
    C = null
    pitches = { 'O': 'наезд', 'P': 'сталк', 'C': 'стиск', 'S': 'сдвиг' }
    #BordNames = aO5 => {
        const ps = aO5.cnst.shp.getElementsByTagName('p'),
            cls = aO5.cls,
            puts = cls.puts,
            ss = []
        let
            s = '<b><u>' + aO5.name + '</u></b>' +
                `<br/>` +
                '<b>' + (puts.T ? 'T' : '') + (puts.L ? 'L' : '') + (puts.R ? 'R' : '') + (puts.B ? 'B' : '') + '</b>' +
                ',<b>' + cls.pitch + '</b>(<i>' + this.pitches[cls.pitch] + '</i>)' +
                (cls.alive ? ',<b>A</b><i>live</i>' : '') +
                ',<b>' + cls.level + '</b>' +
                `<br/>`

        for (const frame of aO5.frms.frames)
            ss.push(frame.pO5.name)
        s += 'fix: ' + ss.join(', ') + `<br/>`
        s += 'cut: ' + aO5.frms.tagCut.id

        if (ps && ps.length > 0)
            ps[0].innerHTML = s
        else
            window.olga5.C.ConsoleLog(
                TMove.head, `shpX_BordNames(): объект ${aO5.name} не содержит тег <p>`,
                { x: (aO5.posC.left + 10), y: (aO5.posC.top - 16), }, 1)
    }
    #SetaO5 = b5 => {
        const
            pmarks = [],
            pitchs = [],
            levels = [],
            alives = [],
            frames = [],
            aO5 = b5.aO5,
            bs = b5.div.aO5bs

        for (const b of bs) {
            const
                b5 = b.b5,
                txt = b.innerText.trim()

            // if (b.id === 'div4-b1')
            //     console.log(1)
            switch (b5.key) {
                case this.pitch: pitchs.push(txt); break
                case this.pmark: pmarks.push(txt); break
                case this.level: levels.push(b.value); break
                case this.alive: alives.push(b.checked); break    // //  aO5.cls.level + (aO5.cls.alive ? ':A' : ''), 
                case this.frame:
                    if (txt) {
                        let f5 = frames.find((f => f.nam === b5.nam))
                        if (!f5) {
                            f5 = { nam: b5.nam, cut: b5.cut }
                            frames.push(f5)
                        }
                        f5[txt] = txt
                    }
            }
        }

        aO5.cls.quals =
            pmarks.join('') +
            pitchs.join('') +
            alives.map(f => f ? 'A' : '').join('') +
            levels.join('') + ':' +
            frames.map(f => `i=${f.nam}${f.cut ? '/c' : ''}`).join(',')

        window.olga5.shp.DoInit.ReadAttrs(aO5)

        for (const x of 'TLRB')
            if (aO5.fixs[x].isP) {
                const
                    p = aO5.fixs[x].xO5,
                    name = p ? p.name.substring(1) : ''
                if (name && !frames.find(frame => frame.nam === name && !frame.cut))
                    aO5.DoFix(x)
            }

        if (o_debug)
            console.log("%c%s", TMove.fmtOK, TMove.head, `изменено ${aO5.name}`)
        this.#BordNames(aO5)

        window.dispatchEvent(new CustomEvent('o5_makeScroll',
            { detail: { scV: 0.1, scH: 0.1, pO5: aO5.pBase.pO5, revers: true } }
        ))
    }
    constructor() {
        this.outlin = { e: '', eOffset: '' }
        this.dshps = new Set()
    }
    CallScroll = m => {  // вызывается из HTML
        const
            btn = document.getElementById('btnScrollHead'),
            step = document.getElementById('btnScrollStep'),
            stp = parseInt(step.value) + 0.1,
            nam = btn.value,
            bord = document.getElementById(nam)
        let scV = 0, scH = 0
        switch (m) {
            case 'T': scV = stp; break
            case 'L': scH = stp; break
            case 'R': scH = -stp; break
            case 'B': scV = -stp; break
        }
        if (stp < 1)
            window.dispatchEvent(new CustomEvent('o5_makeScroll',
                { detail: { scV: scV, scH: scH, pO5: bord.pO5, revers: false } }
            ))
        else
            bord.pO5.cnst.el.scrollBy(scH, scV)
    }
    CbLevel = e => {
        const
            inp = e.target,
            b5 = inp.b5

        b5.aO5.cls.level = inp.value
        inp.title = `${b5.title}= ${b5.aO5.cls.level}`
        this.#SetaO5(b5)
    }
    CbAlive = e => {
        const
            cb = e.target,
            b5 = cb.b5

        b5.aO5.cls.alive = cb.checked
        if (cb.checked)
            for (const x of 'TLRB')
                b5.aO5.hidden[x] = false

        cb.title = `${b5.title}= '${b5.aO5.cls.alive ? 'ДА' : 'нет'}'`
        this.#SetaO5(b5)
    }
    CbMark = e => {
        const
            cb = e.target,
            b5 = cb.b5
        if (b5) {
            if (cb.innerHTML === '&nbsp;') cb.innerHTML = b5.val      // переключение
            else {
                cb.innerHTML = '&nbsp;'
                /*					 
                    расфиксация по 'o' 				
                */
                const o = b5.val,
                    aO5 = b5.aO5
                if (aO5.IsP(o, true)) {
                    aO5.DoFix(o)

                    if ('TB'.includes(o)) aO5.posC.top = aO5.posO.top
                    else aO5.posC.left = aO5.posO.left
                }
            }

            this.#SetaO5(b5)
        }
    }
    CbPitch = e => {
        const
            cb = e.target,
            b5 = cb.b5
        if (b5) {
            const
                bs = b5.div.aO5bs,
                key = cb.b5.key

            cb.innerHTML = b5.val
            for (const b of bs)
                if (b !== cb && b.b5.key === key)
                    b.innerHTML = '&nbsp;'
            this.#SetaO5(b5)
        }
    }
    CbFramC = e => {
        const cb = e.target,
            key = this.frame,
            pdiv = cb.b5.div.getElementsByClassName(key)[0],
            ps = Array.from(pdiv.getElementsByTagName('p'))
        for (const p of ps)
            if (p.style.display !== 'none') {
                const b = Array.from(p.getElementsByTagName('b'))[1]
                b.innerHTML = '&nbsp;'
                b.b5.cut = ''
            }
        cb.b5.cut = cb.innerHTML = 'c'
        this.#SetaO5(cb.b5)
    }
    CbFramF = e => {
        const cb = e.target,
            f = cb.innerHTML === 'f'

        cb.innerHTML = f ? '&nbsp;' : 'f'
        cb.b5.val = f ? '' : 'f'

        this.#SetaO5(cb.b5)
    }
    CbVisible = cbx => {
        const
            forclons = cbx.id === 'clons',
            opas = cbx.checked ? 1 : (forclons ? 0.22 : 0.11),
            objs = document.getElementsByClassName(forclons ? 'o-shpClon' : 'o-shpCart')

        for (const obj of objs)
            obj.style.opacity = opas
    }
    OutLines = cbx => {
        const
            outlin = this.outlin,
            objs = document.querySelectorAll('.olga-shp, .o-shpCart')

        if (outlin.e == '')
            for (const obj of objs) {
                const nst = window.getComputedStyle(obj)
                if (parseFloat(nst.outlineWidth) > 0.1) {
                    outlin.e = nst.outlineColor + ' ' + nst.outlineStyle + ' ' + nst.outlineWidth
                    outlin.eOffset = nst.outlineOffset
                    break
                }
            }

        for (const obj of objs)
            Object.assign(obj.style, {
                outline: cbx.checked ? outlin.e : 'none',
                outlineOffset: cbx.checked ? outlin.eOffset : '0',
            })
    }
    Activate = e => {
        for (const aO5 of e.detail.newO5s) {
            const shp = aO5.cnst.shp
            let div = e.detail.div
            if (!div)
                for (const dshp of this.dshps)
                    if (dshp.shp === shp) {
                        div = dshp.div
                        break
                    }
            if (div) {
                div.style.opacity = 1
                TInit.InitCtrls(aO5, div, this)
                this.#BordNames(aO5)
            }
            else
                console.error(`Activate - не найден div для aO5=${aO5.name}`)

            this.ActFix({ detail: { aO5: aO5, fix: shp.classList.contains('o-fixed') } })   // , activate: true
        }

        for (const aO5 of e.detail.reaO5s) {
            const classList = aO5.cnst.shp.classList
            if (classList.contains('is-moveable'))
                classList.toggle('is-ready', aO5.act.ready)
        }
    }
    ActFix = e => {
        const
            aO5 = e.detail.aO5,             // объект с изменённой фиксацией
            fix = e.detail.fix,             // зафиксировано или расфиксировано
            // activate = e.detail.activate,   // при активации а all.js
            shp = aO5.cnst.shp

        if (shp.classList.contains('is-moveable')) {
            const fixed = shp.classList.contains('o-fixed')
            if (fix) {
                shp.removeEventListener('mousedown', TMove.Start)
                if (!fixed)
                    shp.classList.add('o-fixed')
            }
            else {
                shp.addEventListener('mousedown', TMove.Start)
                if (fixed)
                    shp.classList.remove('o-fixed')
            }
        }
    }
    InitShp = () => {
        const
            elements = document.querySelectorAll('[class*="olga-shp"]'),
            tags = Array.from(elements).filter(element => {
                return element.className.match(/olga-shp[\s:]/) && !element.classList.contains('o-shpNone')
            }),
            divE = document.getElementById('div-etalon'),
            clons = document.getElementById('clons'),
            carts = document.getElementById('carts'),
            outli = document.getElementById('outli'),
            SetWindow = () => {    // w0, h0
                const
                    ref1 = document.getElementById('ref1'),
                    ref0 = document.getElementById('ref0')
                ref1.scrollIntoView({ behavior: 'smooth', block: 'start' })
                ref1.addEventListener('click', e => {
                    ref0.scrollIntoView({ behavior: 'smooth', block: 'start' })
                })

                if (window.name.indexOf('o-popup') < 0) // если НЕ было открыто из родителя ---
                    return

                // this.C.E.AddEventListener('beforeunload', function () {
                window.addEventListener('beforeunload', function () {
                    window.opener.postMessage(window.name, '*')
                })
                document.addEventListener('blur', function () {
                    window.focus()
                })

                const show1 = '***',
                    nam = window.document.title,
                    focusTimer = window.setInterval(function () {
                        try {
                            window.document.title = (window.document.title == show1) ? nam : show1
                        } catch (e) {
                            window.olga5.C.ConsoleLog(
                                TMove.head, `Прекращено 'focusTimer': "` + e.message + '"',
                                { x: (aO5.posC.left + 10), y: (aO5.posC.top - 16) }, 1)
                            window.clearInterval(focusTimer);
                        }
                    }, 888)
                return true
            }

        // this.wshp = window.olga5.shp
        this.C = window.olga5.C
        o_debug = this.C.consts.o_debug

        SetWindow()

        clons.checked = false
        carts.checked = true
        outli.checked = false

        this.CbVisible(clons)
        this.CbVisible(carts)
        this.OutLines(outli)

        for (const tag of tags) {
            if (tag.classList.contains('o-shpNone')) continue

            const
                shp = tag,
                id = shp.id,
                nst = window.getComputedStyle(shp),
                divX = document.createElement('div'),
                div = divE.parentNode.appendChild(divX)

            if (nst.position === 'relative' || nst.position === 'static')
                tag.classList.add('is-moveable')

            div.classList.add('o-shpDiv')
            div.innerHTML = divE.innerHTML
            div.style.opacity = 0.5
            div.aO5bs = []
            div.shp = shp

            const dname = div.getElementsByClassName('name')[0]
            dname.innerText = id.substring(3, 4)
            div.title = dname.title = `тег ${id}`

            this.dshps.add({ shp, div })
        }

        if (o_debug)
            console.log("%c%s", TMove.fmtOK, TMove.head, `  --- инициирован скрипт тестового примера --- `)

        window.addEventListener('o5_activate', this.Activate)
        window.addEventListener('o5_testActFix', this.ActFix)
        window.addEventListener('o5_makeScroll', this.MakeScroll)

    }
    MakeScroll(e) {
        const
            d = e.detail,
            wshp = window.olga5.shp
        wshp.DoChgs.MakeScroll(d.scV, d.scH, d.pO5, true)
        if (d.revers)
            wshp.DoChgs.MakeScroll(-d.scV, -d.scH, d.pO5, true)
    }
}

window.oo5 = new OO5()

window.addEventListener('o5_isInited', oo5.InitShp)
window.addEventListener("wheel", function (event) {
    if (event.deltaX !== 0) {
        event.preventDefault(); // Останавливает горизонтальную прокрутку
    }
}, { passive: false })