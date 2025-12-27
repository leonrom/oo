/* global window, document, console, CustomEvent */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp/AO5shp ---
    "use strict"
    let wshp = {} //, debugnames = ['moe4'] 	//'shp1-2', 

    const
        olga5_modul = "shp",
        modulname = 'AO5shp',
        C = window.olga5.C,
        o_debug = C.consts.o_debug,
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;",
        DblClick = e => {
            if (e.currentTarget !== e.target && e.target.ondblclick) {
                if (o_debug > 0)
                    console.error("%c%s", fmtErr, C.MakeObjName(e.target), ` - тег имеет свой dblclick-обработчик — пропускаем`)
                return
            }

            const aO5 = e.currentTarget.aO5shp  // т.е. расфиксирую всё
            aO5.DoFix()

            e.stopImmediatePropagation()

            if (o_debug > 0)
                console.log("%c%s", fmtOK, `расфиксация '${aO5.cnst.id}' по событию '${e.type}'`)
        },
        IsOnlyTranslate = nst => {
            const t = nst.transform;
            if (!t || t === 'none') {
                return { x: 0, y: 0 };
            }
            // --- 2D ---
            const eps = 1e-6,
                m2 = t.match(/^matrix\(([^)]+)\)$/)
            if (m2) {
                const v = m2[1].split(',').map(Number)
                /*    matrix2d:
                  [ 1  0  ]
                  [ 0  1  ]
                   tx ty 
                */  if (
                    Math.abs(v[0] - 1) < eps &&
                    Math.abs(v[1]) < eps &&
                    Math.abs(v[2]) < eps &&
                    Math.abs(v[3] - 1) < eps
                )
                    return { x: v[4], y: v[5] }
            }
            else {
                // --- 3D ---
                const m3 = t.match(/^matrix3d\(([^)]+)\)$/)
                if (m3) {
                    const v = m3[1].split(',').map(Number)
                    /*    matrix3d:
                      [ 1  0  0  0 ]
                      [ 0  1  0  0 ]
                      [ 0  0  1  0 ]
                      [ tx ty tz 1 ]
                    */
                    if (
                        Math.abs(v[0] - 1) < eps &&
                        Math.abs(v[1]) < eps &&
                        Math.abs(v[2]) < eps &&
                        Math.abs(v[3]) < eps &&

                        Math.abs(v[4]) < eps &&
                        Math.abs(v[5] - 1) < eps &&
                        Math.abs(v[6]) < eps &&
                        Math.abs(v[7]) < eps &&

                        Math.abs(v[8]) < eps &&
                        Math.abs(v[9]) < eps &&
                        Math.abs(v[10] - 1) < eps &&
                        Math.abs(v[11]) < eps &&

                        Math.abs(v[15] - 1) < eps
                    )
                        return { x: v[12], y: v[13] }
                }
            }
        },
        Init = aO5 => {
            const shp = aO5.cnst.shp,
                nst = window.getComputedStyle(shp),
                t = IsOnlyTranslate(nst),
                z = nst.zoom

            aO5.act.inited = true

            if (!t || !(z === "normal" || Number(z) === 1)) {
                const
                    err = !t ? `'transform'` : `'zoom'`,
                    add = !t ? `(кроме "translation")` : `(кроме "zoom = 1")`
                window.olga5.C.ConsoleLog(aO5.name, ` - теги с ` + err + ` НЕ обрабатываются`, 1, 0, add)
                console.log(`DoFix ${aO5.name}: расфиксировалось (навсегда)`)
                aO5.act.observer.unobserve(shp)
                aO5.act.ready = false
                return true
            }

            Object.assign(aO5.transform, t)

            Object.assign(aO5.origin, {
                display: nst.display,
                overflowX: nst.overflowX,
                overflowY: nst.overflowY,
            })
            Object.assign(aO5.margin, {
                margin: nst.margin,
                marginTop: nst.marginTop,
                marginLeft: nst.marginLeft,
                marginRight: nst.marginRight,
                marginBottom: nst.marginBottom,
            })
            Object.assign(aO5.outline, {
                outlineWidth: nst.outlineWidth,
                outlineStyle: nst.outlineStyle,
                outlineColor: nst.outlineColor,
                outlineOffset: nst.outlineOffset,
            })

            const a = shp.style
            Object.assign(aO5.astyle, {
                top: a.top,
                left: a.left,
                width: a.width,
                height: a.height,
                margin: a.margin,
                border: a.border,
                outline: a.outline,
                position: a.position,
                overflowX: a.overflowX,
                overflowY: a.overflowY,
                boxSizing: a.boxSizing,
            })
        },
        ClearClone = clon => {
            const EVENTS = [
                'onclick', 'ondblclick',
                'onmousedown', 'onmouseup',
                'onmousemove', 'onmouseover', 'onmouseout',
                'onkeydown', 'onkeyup', 'onkeypress',
                'onchange', 'oninput', 'onsubmit',
                'onfocus', 'onblur',
                'oncontextmenu'
            ],
                all = [clon, ...clon.querySelectorAll('*')];

            for (const el of all) {
                for (const ev of EVENTS)
                    el.removeAttribute(ev)

                if (el.id) {
                    el.dataset.origId = el.id
                    el.id = ''
                }
            }
        },
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

    class AO5 {
        static #nom = 0

        #state = Object.seal({ transition: '', scrollLeft: 0, scrollTop: 0, active: false, })
        name = ''       // вначале, чтобы было лучше "видно"

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
        aO5s = {}           // списки aO5 в порядке удалённости с соттв. стороны  (т.е. от 'TLRB')
        fixs = {}           // состояние фиксированности по сторонам 'TLRB'

        frms = Object.seal({ tagCut: null, frames: new Set() })

        cart = null
        clon = null
        pBase = null
        posS = Object.seal({ top: 0, left: 0 })
        posC = Object.seal({ top: 0, left: 0, height: 0, width: 0, })
        posO = Object.seal({ top: 0, left: 0, height: 0, width: 0, right: 0, bottom: 0 })

        act = Object.seal({ isfix: false, ready: false, inited: false, observer: null, })

        constructor(shp, quals) {
            shp.aO5shp = this
            this.name = window.olga5.C.MakeObjName(shp)
            this.shdw = shp

            Object.assign(this, {
                cnst: Object.freeze({
                    parent: shp.parentElement,   // запоминаю исходное
                    nom: AO5.#nom++,
                    id: shp.id,
                    shp: shp,
                }),
                cls: Object.seal({
                    quals: quals,               // меняю в тестах для ReadAttrs         
                    puts: MakeT(false),             // инициализация puts будет в ReadCls(this, ss) 
                    zIndex: shp.style.zIndex,   // для PitchBy 
                    level: 0, pitch: 0, nofx: 0, alive: 0,
                }),
            })
            for (const m of 'TLRB') {
                this.aO5s[m] = Object.freeze(new Set())
                this.fixs[m] = Object.seal({ xO5: null, isP: '' })
            }
            Object.freeze(this.aO5s)
            Object.freeze(this.fixs)

            Object.seal(this)
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

            ClearClone(clon)

            clon.id = `${nom}.clon_${shp.id || ''}`
            clon.classList.add('o-shpClon')
            clon.aO5shp = this
            Object.assign(clon.style,
                {
                    opacity: o_debug ? 0.22 : 0,
                    transform: shp.style.transform,
                }
            )

            const cart = this.cart = document.createElement('div')
            cart.id = `${nom}.cart_${shp.id || ''}`
            cart.classList.add('o-shpCart')
            cart.aO5shp = this
            Object.assign(cart.style,           //   см. также o5css в shp.js
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
                shp.parentNode.insertBefore(clon, shp)
                clon.style.display = this.origin.display

                document.body.appendChild(cart)
                cart.appendChild(shp)

                Object.assign(shp.style, styleInChart)

                shp.addEventListener('dblclick', DblClick, true)
                this.act.observer.unobserve(shp)
                this.act.observer.observe(clon)

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
                this.cnst.parent.insertBefore(shp, this.clon)
                this.clon.remove()
                this.cart.remove()
                this.shdw = shp

                shp.removeEventListener('dblclick', DblClick, true)
                this.act.observer.unobserve(this.clon)
                this.act.observer.observe(shp)
            })
        }
        DoFix(x, xO5) {
            const
                act = this.act,
                fixs = this.fixs
            let fold;
            if (o_debug) {
                const xOld = fixs[x].xO5
                fold = xOld ? xOld.name : ''
                if (this.act.isfix && !(fixs.T.xO5 || fixs.L.xO5 || fixs.R.xO5 || fixs.B.xO5))
                    console.log("%c%s", fmtErr, `DoFix ${this.name} отмечено фиксированным`, ' хотя fixs пусто')

                if (x && xOld === xO5)
                    console.log("%c%s", fmtErr,
                        `DoFix ${this.name}: повтор 'dofix' для  ${xO5 ? xO5.name : 'null'}[${x}]`)
            }
            if (x) {
                if (xO5)
                    Object.assign(fixs[x], { xO5: xO5, isP: xO5.constructor.name === 'PO5' })
                else
                    fixs[x].xO5 = null
            }
            else fixs.T.xO5 = fixs.L.xO5 = fixs.R.xO5 = fixs.B.xO5 = null

            const dofix = !!(fixs.T.xO5 || fixs.L.xO5 || fixs.R.xO5 || fixs.B.xO5)
            if (act.isfix !== dofix) {

                if (!act.inited)
                    if (Init(this))
                        return

                if (o_debug) {
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
            window.dispatchEvent(new CustomEvent('o5_testActFix', { detail: { aO5: this, fix: dofix } }))
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [AO5])
})();

