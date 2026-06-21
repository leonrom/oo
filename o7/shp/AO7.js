/* global window, document, console, CustomEvent */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { AOcls } from './AOcls.js'
let C;
const
    p_ref = 'aO7shp',
    RecalcIndex = (pBases, dIndex) => {
        for (const pBase of pBases) {
            pBase.bChgs.zIndex += dIndex
            for (const iO5 of pBase.aAll)
                if (iO5.act.isfix)
                    iO5.cart.style.zIndex = parseInt(iO5.cart.style.zIndex) + dIndex
        }
    },
    T = ['T', 'L', 'R', 'B'],
    MakeT = (v) => Object.seal(
        Object.fromEntries(T.map(k => [k, typeof v === 'function' ? v() : v]))
    ),
    styleInChart = {
        top: 0, left: 0, width: '100%', height: '100%', margin: '0',
        outline: 'none', position: 'relative',
        transform: 'translate(0px, 0px, 0px)',
        boxSizing: 'border-box',
        // overflowX: 'visible',
        // overflowY: 'visible',
        transition: 'none',
    }

export class AO7 {
    static #nom = 0
    static observer= null
    
    static prepare (c) {
        C = c
        AOcls.prepare (c)
    }

    #state = Object.seal({ transition: '', scrollLeft: 0, scrollTop: 0, active: false, })
    name = ''       // вначале, чтобы было лучше "видно"
    tobased = false // отметска об обработке createO7 

    transform = Object.seal({ x: 0, y: 0, })
    attachss = MakeT(() => [])  // список: которые зафиксированы на этом
    canFixs = MakeT(null)
    canCuts = MakeT(null)
    hidden = MakeT(0)
    scops = MakeT(0)      //   копия из pO5 - координаты рабочей зоны контейнера
    outline = {}
    astyle = {}
    margin = {}
    origin = {}
    aO7s = {}           // списки aO7 в порядке удалённости с соттв. стороны  (т.е. от 'TLRB')
    fixs = {}           // состояние фиксированности по сторонам 'TLRB'

    frms = Object.seal({ tagCut: null, frames: new Set() })

    cart = null
    clon = null
    pBase = null
    posS = Object.seal({ top: 0, left: 0 })
    posC = Object.seal({ top: 0, left: 0, height: 0, width: 0, })
    posO = Object.seal({ top: 0, left: 0, height: 0, width: 0, right: 0, bottom: 0 })

    act = Object.seal({ isfix: false, ready: false, inited: false,  })

    constructor(tag, atr) {
        this.name = C.getObjName(tag)
        this.shdw = tag

        Object.assign(this, {
            cnst: Object.freeze({
                parent: tag.parentElement,   // запоминаю исходное
                nom: AO7.#nom++,
                id: tag.id,
                shp: tag,
                tag: tag,   // да-да, тут дублирование
            }),
            cls: Object.seal({
                ori: atr.ori,       // запоминаю для activateAO7
                quals: atr.quals,               // меняю в тестах для ReadAttrs         
                puts: MakeT(false),             // инициализация puts будет в ReadCls(this, ss) 
                zIndex: tag.style.zIndex,   // для PitchBy 
                level: 0, pitch: 0, nofx: 0, alive: 0,
            }),
        })
        AOcls.ReadCls(this, this.cls.quals)

        for (const m of 'TLRB') {
            this.aO7s[m] = Object.freeze(new Set())
            this.fixs[m] = Object.seal({ xO5: null, isP: '' })
        }
        Object.freeze(this.aO7s)
        Object.freeze(this.fixs)

        tag[p_ref] = this
        C.propagate(tag, this, p_ref, tag[p_ref + C.p_ref] ?? null)
        Object.seal(this)

    }
    erase() {
        C.propagate(this.tag, null, p_ref, tag[p_ref + C.p_ref] ?? null)
    }
    IsP(x, isP) {
        const fix = this.fixs[x]
        if (fix.xO5)
            if (fix.isP === isP)
                return fix.xO5
            else return false
        else return null
    }
    ShowFix() {
        const
            posC = this.posC,
            pw = (posC.width > 0) ? posC.width : 0,
            ph = (posC.height > 0) ? posC.height : 0

        Object.assign(this.cart.style, {
            display: (pw === 0 || ph === 0) ? 'none' : '',
            top: posC.top + 'px',
            left: posC.left + 'px',
            width: pw + 'px',
            height: ph + 'px',
        })

        const cart = this.cart,   // это вместо FixScrollbarGutter(cart, shp)
            dx = cart.offsetWidth - cart.clientWidth,
            dy = cart.offsetHeight - cart.clientHeight
        Object.assign(this.cnst.shp.style, {
            width: `${this.posO.width - dx}px`,
            height: `${this.posO.height - dy}px`,
            transform: `translate(${this.posS.left}px, ${this.posS.top}px)`
        })
    }
    StoreState() {
        const shp = this.cnst.shp
        const ae = document.activeElement
        Object.assign(this.#state, {
            transition: shp.style.transition,
            scrollLeft: shp.scrollLeft,
            scrollTop: shp.scrollTop,
            active: ae && ae !== document.body && shp.contains(ae) ? ae : null,
        })
    }
    RestoreState() {
        const
            shp = this.cnst.shp,
            state = this.#state

        requestAnimationFrame(() => {               // rAF #1 — после DOM/layout
            shp.scrollLeft = state.scrollLeft
            shp.scrollTop = state.scrollTop
            requestAnimationFrame(() => {           // rAF #2 — после scroll settle
                shp.scrollLeft = state.scrollLeft
                shp.scrollTop = state.scrollTop
                if (state.active
                    && state.active.isConnected
                    && document.activeElement !== state.active)
                    try {
                        state.active.focus({ preventScroll: true })
                    } catch {
                        state.active.focus()
                    }
                // восстанавливать - если усер НЕ сделал "Эффекты анимации → выкл"
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                    shp.style.transition = state.transition
            })
        })
    }
    ApplyFix() {
        const
            shp = this.cnst.shp,
            nom = this.cnst.nom,
            clon = this.clon = shp.cloneNode(true)

        AOcls.ClearClone(clon)

        clon.id = `${nom}.clon_${shp.id || ''}`
        clon.classList.add('o-shpClon')
        clon.aO7shp = this
        Object.assign(clon.style,
            {
                opacity: C.consts.debug ? 0.22 : 0,
                transform: shp.style.transform,
            }
        )

        const cart = this.cart = document.createElement('div')
        cart.id = `${nom}.cart_${shp.id || ''}`
        cart.classList.add('o-shpCart')
        cart.aO7shp = this
        Object.assign(cart.style,           //   см. также css в shp.js
            {
                zIndex: this.pBase.bChgs.zIndex + 1,
                // overflowX: this.origin.overflowX,
                // overflowY: this.origin.overflowY,
            },
            this.outline,
        )

        if (shp.pO5)
            RecalcIndex(shp.pO5.pBases, 1)

        requestAnimationFrame(() => {

            clon.setAttribute(C.myInclude, '1')
            shp.parentNode.insertBefore(clon, shp)
            clon.style.display = this.origin.display

            document.body.appendChild(cart)
            cart.appendChild(shp)

            Object.assign(shp.style, styleInChart)
            AO7.observer.unobserve(shp)
            AO7.observer.observe(clon)

            this.shdw = clon
        })
    }
    RemoveFix() {
        const shp = this.cnst.shp
        if (shp.pO5)
            RecalcIndex(shp.pO5.pBases, -1)

        requestAnimationFrame(() => {
            Object.assign(shp.style, this.astyle, this.margin)
            const t = this.transform
            shp.style.transform = `translate(${t.x}px, ${t.y}px)`

            this.clon.style.display = 'none'

            shp.setAttribute(C.myInclude, '1')
            this.cnst.parent.insertBefore(shp, this.clon)
            this.clon.remove()
            this.cart.remove()
            this.shdw = shp

            AO7.observer.unobserve(this.clon)
            AO7.observer.observe(shp)
        })
    }
    DoFix(x, xO5) {
        const
            act = this.act,
            fixs = this.fixs
        let fold;
        if (C.consts.debug) {
            const xOld = fixs[x].xO5
            fold = xOld ? xOld.name : ''
            if (this.act.isfix && !(fixs.T.xO5 || fixs.L.xO5 || fixs.R.xO5 || fixs.B.xO5))
                console.log("%c%s", C.consts.fmtErr, `DoFix ${this.name} отмечено фиксированным`, ' хотя fixs пусто')

            if (x && xOld === xO5)
                console.log("%c%s", C.consts.fmtErr,
                    `DoFix ${this.name}: повтор 'dofix' для  ${xO5 ? xO5.name : 'null'}[${x}]`)
        }
        if (x) {
            if (xO5)
                Object.assign(fixs[x], { xO5: xO5, isP: xO5.constructor.name === 'PO5shp' })
            else
                fixs[x].xO5 = null
        }
        else fixs.T.xO5 = fixs.L.xO5 = fixs.R.xO5 = fixs.B.xO5 = null

        const dofix = !!(fixs.T.xO5 || fixs.L.xO5 || fixs.R.xO5 || fixs.B.xO5)
        if (act.isfix !== dofix) {

            if (!act.inited && AOcls.InitStyle(this))    // ???
                return

            if (C.consts.debug) {
                const op = x ?
                    (xO5 ?
                        ((fold ? `перефиксация с '${fold}'` : `фиксация  `) + ` на '${xO5.name}'`)
                        : `расфиксация с '${fold || 'старт'}'`
                    ) : `полная расфиксация`
                console.log(`DoFix ${this.name}: по [${x}] ${op}`)
            }

            this.StoreState()
            dofix ?
                this.ApplyFix() :
                this.RemoveFix()

            act.isfix = dofix
            this.RestoreState()

            Object.assign(this.hidden, { T: 0, L: 0, R: 0, B: 0 })
        }
        window.dispatchEvent(new CustomEvent('o-testActFix', { detail: { aO7: this, fix: dofix } }))
    }
}

