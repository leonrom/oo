/* global window, console, IntersectionObserver */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
(function () {
    "use strict"

    /**
     * @module shp/DoInit
     * Инициализация скроллируемых объектов.
     *
     * Содержит функции:
     * - `Observe(entries)` — обработка появления элементов в области видимости.
     * - `Init()` — первичная инициализация обсерверов.
     */
    let observ;

    const
        olga5_modul = "shp",
        modulname = 'DoInit',
        C = window.o7.C,
        debug = C.consts.debug,
        state = {
            observer: null,
            elements: new Set,
        },
        DebugShowRez = oO5s => {
            const
                head = ` после "${Array.from(oO5s).map(aO5 => aO5.name).join(', ')}"`,
                rez = []

            for (const aO5 of oO5s)
                rez.push({
                    aO5: aO5.name,
                    tagCut: aO5.frms.tagCut.id,
                    base: aO5.pBase.pO5.name,
                    frms: Array.from(aO5.frms.frames).map(f => f.pO5.cnst.id).join(', ')
                })
            C.ConsoleInfo(`Обработка ${head}`, rez.length, rez)

            rez.length = 0
            for (const { bO5, pBase } of wshp.PBases.PBase)
                rez.push({
                    base: pBase.pO5.name,
                    pOuts: ' ' + (Array.from(pBase.pO5.pOuts)).map(p => p.name).join(', '),
                    // pIncs: ' ' + (Array.from(pBase.pO5.pIncs)).map(p => p.name).join(', '),
                    aAll: ' ' + pBase.aAll.map(tag => tag.id).join(', ')
                })
            C.ConsoleInfo(`Базы ${head}`, rez.length, rez)

            rez.length = 0
            for (const { bO5, pBase } of wshp.PBases.PBase)
                for (const pOut of pBase.pO5.pOuts)
                    rez.push({
                        base: pBase.pO5.name,
                        pOut: pOut.name,
                        pOuts: ' ' + (Array.from(pOut.pOuts)).map(p => p.name).join(', '),
                        // pIncs: ' ' + (Array.from(pOut.pIncs)).map(p => p.name).join(', ')
                    })
            C.ConsoleInfo(`pOuts ${head}`, rez.length, rez)


            rez.length = 0
            for (const { key, frame } of wshp.Frames.Frame) {
                rez.push({
                    key: key,
                    tcn: frame.typ + ':' + frame.cod + ':' + frame.num,
                    pO5: frame.pO5.name,
                    aO5fs: frame.aO5fs.map(a => a.name).join(', '),
                })
            }
            C.ConsoleInfo(`Фреймы ${head}`, rez.length, rez)
        },

        Init = () => {
            const mtags = C.SelectByClassName(wshp.W.class, olga5_modul)
            let found;

            for (const mtag of mtags) {
                if (
                    !mtag.tag.classList.contains('o-shpNone') &&
                    !mtag.quals.find(qual => !qual.includes('=') && qual.match(/n/i))
                ) {
                    if (!observ)
                        observ = CreateObserver({
                            root: null,
                            threshold: [0, 1],
                            rootMargin: '0px',
                            trackVisibility: false,
                        })
                    observ.observe(mtag.tag, mtag.quals)
                    found = true
                }
            }

            if (!found)
                console.log("%c%s", C.consts.fmtErr, `Контейнера с классом 'olga-start' не содержат '${wshp.W.class}'`,
                    `(либо вообще, либо без 'o-shpNone' и ':N')`)
        },

        ReadCls = (aO5, ss) => {
            const
                errs = [],
                cls = aO5.cls,
                puts = cls.puts,
                mselec = /[A-Z]|a-z]|[+-]?\d+/g

            Object.assign(cls, {           // для повторной инициализации (напр. в тестах)
                level: 0,
                pitch: 'S',
                nofx: false,
                alive: false,
            })
            puts.T = puts.L = puts.R = puts.B = false

            const cs = ss.toUpperCase().match(mselec)
            for (const c of cs)
                switch (c) {
                    case 'A': cls.alive = true
                        break
                    case 'C':                // сжимает предыдущий
                    case 'P':                // сталкивает предыдущий
                    case 'S':                // сдвигает предыдущий
                    case 'O': cls.pitch = c  // наезжает на предыдущий
                        break
                    case 'T':
                    case 'L':
                    case 'R':
                    case 'B': puts[c] = true
                        break
                    case 'N': cls.nofx = true; break    // не подвисает, но может сдвигать остальные
                    default:
                        if (!isNaN(c)) cls.level = Number(c)
                        else
                            errs.push(`c='${c}' в "${ss}"`)
                }
            if (!puts.T && !puts.L && !puts.R && !puts.B) puts.T = true

            if (errs.length)
                console.error("%c%s", C.consts.fmtErr, `Для ${aO5.name} не опр. квалиф.: ` + errs.join(', '))
        },

        ReadAttrs = aO5 => {
            const aquals = aO5.cls.quals.split(/[:;]/)
            let sclss = 'T', sdivs = '';
            switch (aquals.length) {
                case 0: break
                case 1:
                    if (aquals[0].indexOf('=') < 0) sclss = aquals[0]
                    else sdivs = aquals[0]
                    break
                case 2:
                    sclss = aquals[0]
                    sdivs = aquals[1]
                    break
                default:
                    sclss = aquals[0]
                    sdivs = aquals.slice(1).join(',')
            }

            ReadCls(aO5, sclss) // разделяющие запятые там просто игнорируются

            wshp.Frames.MakeFrames(aO5, sdivs.split(','))
        }

    const
        Observe = entries => {
            const newO5s = new Set(),
                reaO5s = new Set()

            for (const entry of entries) {
                const shp = entry.target
                let aO5 = shp.aO5shp,
                    ready = aO5 ? aO5.act.ready : 0

                if (entry.isIntersecting) {
                    if (!aO5) {
                        const el = observ.getel(shp)
                        aO5 = new wshp.AO5shp.AO5(shp, el.quals)
                        aO5.act.observer = state.observer
                        newO5s.add(aO5)
                    }

                    if (entry.intersectionRatio === 1)  //   && !aO5.act.isfix  (необязательно)
                        // if (!aO5.cls.badtag)
                        aO5.act.ready = true
                }
                else
                    if (aO5 && !aO5.act.isfix)
                        aO5.act.ready = false

                if (aO5) {
                    shp.classList.toggle('o-isready', aO5.act.ready)
                    if (ready !== aO5.act.ready)
                        reaO5s.add(aO5)
                }
            }

            if (newO5s.size > 0) {
                const bBases = new Set()
                let isNew = false
                for (const aO5 of newO5s) {
                    if (wshp.PBases.PBase.AddToBase(aO5))  // если добавилась новая база
                        isNew = true

                    ReadAttrs(aO5)
                    bBases.add(aO5.pBase)
                }

                for (const bBase of bBases)
                    bBase.ReorderAO5s()

                if (isNew)
                    for (const x of 'TL')
                        wshp.PBases.PBase.SetBorders(x, body.pO5)

                if (debug > 1)
                    DebugShowRez(newO5s)
            }

            if (newO5s.size > 0 || reaO5s.size > 0)     // для тестирования в frames.html
                window.dispatchEvent(new CustomEvent('o_activate', {
                    detail: { reaO5s: reaO5s, newO5s: newO5s }
                }))
            // oO5s.clear()
        }

    /**
     * создаёт наблюдателя за элементами
     * @function CreateObserver
     */
    function CreateObserver(options) {

        state.observer = new IntersectionObserver(Observe, options)

        function getel(tag) {
            for (const el of state.elements)
                if (el.tag === tag)
                    return el
        }

        return {
            observe: (tag, quals) => {
                state.elements.add({ tag: tag, quals: quals ? quals.join(':') : '' })
                state.observer.observe(tag)
            },
            unobserve: (tag) => {
                state.observer.unobserve(tag)
                const el = getel(tag)   // заменено!
                state.elements.delete(el)

                if (state.elements.length === 0) {
                    state.observer.disconnect()
                    state.observer = null
                    if (debug)
                        console.log("%c%s", C.consts.fmtOK, `observe: `, ` отключено полностью`)
                }
            },
            getel, // экспортируем в объект
            get observedElements() {
                return Array.from(state.elements)
            },
        }
    }
    const wshp = C.AddModuleSub(olga5_modul, modulname, [Init, ReadAttrs])
})();
/* global window, document, console, IntersectionObserver */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
(function () {              // ---------------------------------------------- shp/PBases ---
    "use strict"

    let wshp, ibase = 0

    const
        olga5_modul = "shp",
        modulname = 'PBases',
        C = window.o7.C,
        debug = C.consts.debug,
        opp = { T: 'B', L: 'R', R: 'L', B: 'T' },
        FindAndFill = (aO5, adds) => {
            let bO5, nst, scrls, tag = aO5.cnst.parent
            do {
                let p, c = ' ';
                if (tag.pO5) {               // уже был раньше создан
                    scrls = tag.pO5.scrls
                    if (scrls.V || scrls.H) {
                        p = tag.pO5
                        c = '+'
                    }
                }
                else {
                    nst = window.getComputedStyle(tag)
                    scrls = wshp.PO5shp.PO5.Scrls(tag, nst)
                    if (scrls.V || scrls.H) {
                        p = new wshp.PO5shp.PO5(tag, nst)
                        c = '~'
                    }
                }
                if (p && !bO5) bO5 = p

                if (debug)
                    adds.add(c + C.MakeObjName(tag))

                tag = tag.parentNode
            } while (tag && tag.nodeName !== 'HTML')

            return bO5
        },
        FillPOuts = bO5 => {
            let tag = bO5.cnst.tag, pTop = bO5, pO5;
            const pIncs = new Set([bO5])

            do {
                tag = tag.parentNode
                if (tag && (pO5 = tag.pO5)) {
                    for (const pOut of bO5.pOuts)
                        pOut.pOuts.add(pO5)

                    if (pO5.pOuts.done) {
                        for (const pOut of pO5.pOuts)
                            for (const pInc of pIncs)
                                pInc.pOuts.add(pOut)

                        break
                    }

                    pIncs.add(pO5)
                    pO5.pOuts.done = true

                    pTop = pO5
                }
            } while (tag && tag.nodeName !== 'HTML')
        },  
        GetMaxIndex = pbO5 => {
            let zIndex = 0
            for (const pOut of pbO5.pOuts) {
                const aO5 = pOut.cnst.el.aO5shp
                zIndex = Math.max(
                    zIndex,
                    pOut.cnst.zIndex,
                    (aO5 && aO5.act.isfix) ? aO5.cart.style.zIndex : 0)
            }
            return zIndex
        }
    /**
    * база - скроллируемый контейнер, содержащий общую информацию для подвисабельных объектов
    */
    class PBase {
        static #pbases = new Map()
        static #idn = 0
        tagCuts = new Set()
        aAll = []

        constructor(pO5) {
            this.pO5 = pO5
            this.idn = PBase.#idn++
            this.pBordss = { // список тех из pOut, которые оказались (соотв. стороной) внутри this.pO5
                T: [pO5], L: [pO5], R: [pO5], B: [pO5],
            }
            this.bChgs = { // въезжание вложенных контейнеров
                start: true,
                T: 0, L: 0, R: 0, B: 0,
                zIndex: GetMaxIndex(pO5)  
            }

            for (const nam of ['bChgs'])
                Object.seal(this[nam])

            this.bO5s = {}  // списки aO5 в порядке удалённости от соттв. края  (т.е. от 'TLRB')
            for (const m of 'TLRB') {
                this.bO5s[m] = new Set()
                Object.freeze(this.bO5s[m])
            }

            Object.freeze(this.pBordss)
            Object.freeze(this)

            PBase.#pbases.set(pO5, this)
        }
        static #sorters = {   // по возрастанию
            T: (a1, a2) => a1.posO.top - a2.posO.top,
            L: (a1, a2) => a1.posO.left - a2.posO.left,
            R: (a1, a2) => (a2.posO.left + a2.posO.width) - (a1.posO.left + a1.posO.width),
            B: (a1, a2) => (a2.posO.top + a2.posO.height) - (a1.posO.top + a1.posO.height),
        }
        ReorderAO5s() {
            for (const aO5 of this.aAll) {
                const p = aO5.shdw.getBoundingClientRect()
                Object.assign(aO5.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
            }

            for (const m of 'TLRB') {
                this.aAll.sort(PBase.#sorters[m])

                this.bO5s[m].clear()
                for (const aO5 of this.aAll) {
                    aO5.aO5s[m].clear()

                    const aO = aO5.posO
                    let i = this.aAll.indexOf(aO5)

                    while (i-- > 0) {
                        const iO5 = this.aAll[i],
                            iO = iO5.posO

                        if ('TB'.includes(m) ? (
                            !(iO.right < aO.left || iO.left > aO.right) &&              // в стороне от aO5
                            (m === 'T' ? (aO.top > iO.bottom) : (aO.bottom < iO.top))   // перекрываются с aO5
                        ) : (
                            !(iO.bottom < aO.top || iO.top > aO.bottom) &&              // в стороне от aO5
                            (m === 'L' ? (aO.left > iO.right) : (aO.right < iO.left))   // перекрываются с aO5
                        ))
                            aO5.aO5s[m].add(iO5)
                    }

                    if (debug > 2)
                        console.log(`${aO5.cnst.id}[${m}]: ` + Array.from(aO5.aO5s[m]).map(a => a.id).join(', '))
                    this.bO5s[m].add(aO5)
                }
            }

            if (debug > 1) {
                const ra = []
                for (const aO5 of this.aAll) {
                    const r = { aO5: aO5.cnst.id }
                    for (const m of 'TLRB')
                        r[m] = Array.from(aO5.aO5s[m]).map(a => a.id).join(', ')
                    const i = aO5.cnst.id.substr(-1)
                    ra[i] = r
                }
                C.ConsoleInfo(`Теги, расположенные с соотв. стороны от aO5  (по удалённости)`, ra.length, ra)
                const rb = []
                for (const m of 'TLRB')
                    rb.push({ m: m, aO5s: Array.from(this.bO5s[m]).map(a => a.id).join(', ') })
                C.ConsoleInfo(`Теги, с соотв. стороны в контейнеры (по удалённости)`, rb.length, rb)
            }
        }
        static AddToBase(aO5) {
            let pTop, newPs = 0;
            const
                adds = new Set(),
                bO5 = FindAndFill(aO5, adds)

            if (!bO5) {
                console.error("%c%s", C.consts.fmtErr, ` Тегу ${aO5.name} не найден базовый контейнер — пропускаем`)
                return
            }

            if (debug > 1)
                console.log(`AddToBase: ${aO5.name}: ${Array.from(adds).join(', ')} `)

            // подключаем (и создаём) pbase
            let pBase = PBase.#pbases.get(bO5)
            if (!pBase) {
                pBase = new PBase(bO5)   // там же и set()
                FillPOuts(bO5)
                newPs++
            }

            for (const pOut of bO5.pOuts)
                pOut.pBases.add(pBase)

            aO5.pBase = pBase
            if (!pBase.aAll.includes(aO5))
                pBase.aAll.push(aO5)

            return newPs
        }
        static SetBorders(x, pcO5) {
            for (const m of [x, opp[x]]) {
                const isTL = 'TL'.includes(m)

                for (const pBase of pcO5.pBases) {
                    const
                        pbO5 = pBase.pO5,
                        pBords = pBase.pBordss[m],
                        tis0 = pbO5.scops.time === 0
                    let chg = ''
                    if (pbO5.scops.isVisible) {
                        const vb = pbO5.scops[m]

                        for (const pOut of pbO5.pOuts) {
                            if (pOut === pbO5)
                                continue

                            const
                                v = pOut.scops[m],
                                iOut = pBords.indexOf(pOut),
                                inside = isTL ? vb < v : vb >= v

                            // chg: либо было пересечение а теперь граница  pOut стала внутри pbO5; 
                            // либо пересечения не было а pOut вышло из-нутри pbO5
                            if (iOut >= 0) {
                                if (!inside) {
                                    chg = `"удалил  '${pOut.name}'"`
                                    pBords.splice(iOut, 1)
                                }
                            }
                            else
                                if (inside) {
                                    let i = pBords.length
                                    while (i-- > 0)
                                        if (isTL ? pBords[i].scops[m] >= v : pBords[i].scops[m] < v)
                                            break

                                    pBords.splice(i, 0, pOut)
                                    chg = `"добавил '${pOut.name}'"`
                                }
                        }
                        // не вылезла ли граница за пределы?
                        if (!chg) {
                            let v, i = 1, vi = pBords[0].scops[m]
                            while (!chg && i < pBords.length) {
                                v = vi
                                vi = pBords[i].scops[m]
                                if (isTL ? v < vi : v >= vi)
                                    chg = `"изменил '${pBords[i].name}'"`
                                i++
                            }
                        }

                        if (chg || tis0)
                            pBords.sort((b1, b2) =>	 // по возрастанию						
                                isTL ? (b2.scops[m] - b1.scops[m]) : (b1.scops[m] - b2.scops[m]))
                    }
                    pBase.bChgs[m] = chg

                    if (debug > 1 && (chg || tis0))
                        console.log(
                            `скролл. ${pcO5.name} по [${m}] для ${pBase.pO5.cnst.id} '${chg}'   ` +
                            `${pBase.pBordss[m].map(b => b.name + ':' + ('' + b.scops[m]).padStart(4)).join(', ')}`
                        )
                }
            }
        }
        // делаем класс итерируемым
        static *[Symbol.iterator]() {
            for (const [pO5, pBase] of this.#pbases.entries()) {
                yield { pO5, pBase };
            }
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [PBase])
})();/* global window, document, console, CustomEvent */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp/AO5shp ---
    "use strict"
    let wshp = {} //, debugnames = ['moe4'] 	//'shp1-2', 

    const
        olga5_modul = "shp",
        modulname = 'AO5shp',
        C = window.o7.C,
        debug = C.consts.debug,
        DblClick = e => {
            if (e.currentTarget !== e.target && e.target.ondblclick) {
                if (debug > 0)
                    console.error("%c%s", C.consts.fmtErr, C.MakeObjName(e.target), ` - тег имеет свой dblclick-обработчик — пропускаем`)
                return
            }

            const aO5 = e.currentTarget.aO5shp  // т.е. расфиксирую всё
            aO5.DoFix()

            e.stopImmediatePropagation()

            if (debug > 0)
                console.log("%c%s", C.consts.fmtOK, `расфиксация '${aO5.cnst.id}' по событию '${e.type}'`)
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
                window.o7.C.ConsoleLog(aO5.name, ` - теги с ` + err + ` НЕ обрабатываются`, 1, 0, add)
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
                    el.dataset.origId = el.id       ??
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
            this.name = window.o7.C.MakeObjName(shp)
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
                    opacity: debug ? 0.22 : 0,
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
            if (debug) {
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

                if (debug) {
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
            window.dispatchEvent(new CustomEvent('o_testActFix', { detail: { aO5: this, fix: dofix } }))
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [AO5])
})();

/* global window, document, console, CustomEvent */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp/PO5shp ---11
    "use strict"
    let wshp, observer;
    const
        olga5_modul = "shp",
        modulname = 'PO5shp',
        C = window.o7.C,
        debug = C.consts.debug,
        saved = {
            last: {
                top: 0, left: 0, height: 0, width: 0,
                sV: 0, sH: 0, rV: 0, rH: 0,
                pO5: null,
                time: 0
            },
            dm: { V: 2, H: 2, dt: 100 },
            Act: (pO5, typ) => {
                const
                    scrll = pO5.scrll,
                    sl = saved.last

                if (sl.pO5 && sl.pO5 !== pO5) { // заканчиваю предыдущую цепочку скроллингов
                    if (debug > 2)
                        console.log("%c%s", C.consts.fmtOK, `scroll ${sl.pO5.cnst.id}: `, ' закончил!')

                    Object.assign(scrll, {
                        time: sl.time,
                        top: sl.top, left: sl.left, height: 0, width: 0
                    })
                    wshp.DoChgs.MakeScroll(
                        sl.sV || sl.rV,
                        sl.sH || sl.rH,
                        sl.pO5,
                        true
                    )
                    sl.pO5 = null
                }

                const
                    el = pO5.cnst.el,
                    dm = saved.dm,
                    now = performance.now(),
                    sV = el.scrollTop - scrll.top,
                    sH = el.scrollLeft - scrll.left,
                    rH = el.clientWidth - scrll.width,
                    rV = el.clientHeight - scrll.height,
                    dt = now - scrll.time >= dm.dt,
                    strt = scrll.time <= 0,
                    typS = typ === 'S'

                if (
                    Math.abs(sV) >= dm.V ||
                    Math.abs(sH) >= dm.H ||
                    Math.abs(rV) >= dm.V ||
                    Math.abs(rH) >= dm.H ||
                    dt
                ) {
                    if (debug > 2)
                        console.log("%c%s", C.consts.fmtOK, `saved ${pO5.cnst.id}: ${typ === 'S' ? 'скроллинг' : 'размеры'} ` +
                            `sV=${sV}, sH=${sH}, rV=${rV}, rH=${rH}, sT=${el.scrollTop}, aT=${scrll.top}, sL=${el.scrollLeft}, aL=${scrll.left}`)

                    Object.assign(scrll, {
                        time: now,
                        top: el.scrollTop, left: el.scrollLeft, width: el.clientWidth, height: el.clientHeight
                    })
                    const
                        dV = strt ? 0.1 : (typS ? sV : (rV ? 0.1 : 0)),
                        dH = strt ? 0.1 : (typS ? sH : (rH ? 0.1 : 0))
                    let blks
                    if (debug) {
                        const blk = document.getElementById('blockScroll')
                        blks = blk && blk.checked
                    }
                    if (window.o7.canDoScroll) {
                        window.o7.canDoScroll = false
                        blks = false
                    }

                    if ((dV || dH) && !blks)
                        wshp.DoChgs.MakeScroll(dV, dH, pO5, true)

                    sl.pO5 = null
                }
                else
                    if (sV || sH || rV || rH) {
                        Object.assign(sl, {
                            pO5: pO5,
                            time: now,
                            sV: sV, sH: sH, rV: rV, rH: rH,
                            top: el.scrollTop, left: el.scrollLeft, height: el.clientHeight, width: el.clientWidth
                        })
                    }
            },
            Resize: entries => {
                let n, p;
                for (const e of entries) { // ищу самый внешний контейнер
                    const
                        pO5 = e.target.pO5,
                        z = pO5.pOuts.size
                    // console.log(`${pO5.name}: ${Array.from(pO5.pOuts).map(p=>p.name).join(', ')}`)                        
                    if (n >= z || !p) {
                        n = z
                        p = pO5
                    }
                }
                if (p)
                    saved.Act(p, 'R')
            }
        },
        ro = new ResizeObserver(saved.Resize),
        Observe = entries => {
            for (const entry of entries) {
                const pO5 = entry.target.pO5
                pO5.scops.isVisible = entry.isIntersecting
            }
        },
        IsFinal = tag => {
            return tag.aO5shp ||            // контейнер сам является подвисабельным тегом
                tag.nodeName == 'BODY' ||   // контейнер является конечным
                tag.classList.contains('olga-start')
        },
        AbsoluteZIndex = (el, nst) => {
            let current = el, zTotal = 0, multiplier = 1;

            while (current && current !== document) {
                const                           // nst = window.getComputedStyle(current),
                    z = nst.zIndex,
                    pos = nst.position,
                    hasContext =
                        (pos !== 'static' && z !== 'auto') ||
                        ['transform', 'opacity', 'filter', 'perspective', 'willChange'].some(p => {
                            const v = nst[p]
                            return v && v !== 'none' && v !== '1'
                        })

                if (hasContext) {
                    const zNum = isNaN(parseInt(z)) ? 0 : parseInt(z);
                    zTotal += zNum * multiplier;
                    multiplier *= 1000 // каждый новый контекст — «новый порядок» уровней
                }
                current = current.parentElement
            }

            return zTotal
        }

    class PO5 {
        static Scrls(tag, nst) {
            const oxy = tag.nodeName == 'BODY' || (nst.overflow === 'auto')
            return {
                H: oxy || nst.overflowX === 'auto' || nst.overflow === 'scroll' || nst.overflowX === 'scroll',
                V: oxy || nst.overflowY === 'auto' || nst.overflow === 'scroll' || nst.overflowY === 'scroll',
            }
        }
        static pBody;
        name = ''       // вначале, чтобы было лучше "видно"

        constructor(tag, nst) {
            if (tag.pO5)
                C.ConsoleAlert(`Повтор создания 'pO5' для контейнера id='${tag.id}' [${tag.className.trim()}]`)

            const
                ibody = tag.nodeName == 'BODY',
                classList = Array.from(tag.classList),
                el = ibody ? document.documentElement : tag

            el.pO5 = this
            tag.pO5 = this
            if (ibody)
                PO5.pBody = this

            this.name = tag.id ? tag.id : C.MakeObjName(tag)

            Object.assign(this, {
                pOuts: new Set(),  // д.б. Set() иначе в AddToBase будут повторы  (скроллируемые pO5) все скроллируемых внешних контейнеров
                pBases: new Set(),  //   -"-    (скроллируемые pO5) все скроллируемых вложенных контейнеров 

                cnst: Object.freeze({
                    el: el,     //   tag и el различаются только у1 тега body
                    tag: tag,
                    id: tag.id,
                    ibody: ibody,
                    classOrigs: classList,
                    zIndex: AbsoluteZIndex(el, nst),
                }),
                borders: Object.freeze({
                    bgColor: nst.backgroundColor,
                    top: parseFloat(nst.borderTopWidth),
                    left: parseFloat(nst.borderLeftWidth),
                    right: parseFloat(nst.borderRightWidth),
                    bottom: parseFloat(nst.borderBottomWidth),
                }),
                scrls: Object.freeze(PO5.Scrls(tag, nst)),

                scrll: Object.seal({ // позиции скроллинга, видимые границы , текущие границы,  изменение границ от предыдущего              
                    time: -1,
                    top: el.scrollTop,
                    left: el.scrollLeft,
                    width: el.clientWidth,
                    height: el.clientHeight,
                }),
                scops: Object.seal({    //   координаты рабочей зоны контейнера
                    time: -1,
                    isVisible: true,
                    T: 0, L: 0, R: 0, B: 0
                }),
                cuts: Object.seal({
                    T: tag.pO5, L: tag.pO5, R: tag.pO5, B: tag.pO5,
                })
            })

            this.pOuts.done = false
            this.pOuts.add(this)

            Object.seal(this)

            this.CalcScope(0)

            if (this.scrls.H || this.scrls.V) {
                ro.observe(el);
                (ibody ? window : el).addEventListener('scroll', e => {
                    saved.Act(this, 'S')
                })
            }
            if (!observer)
                observer = new IntersectionObserver(Observe, {
                    root: null,
                    threshold: [0, 1],
                    rootMargin: '0px',
                    trackVisibility: false,
                }
                )
            observer.observe(tag)

            if (debug > 1)
                console.log(`PO5 создано ${this.name}`)
        }
        // name = ''    // еще и тут - чтобы сразу видеть в отладчике
        CalcScope(time) {   // видимост,- пересчитывается при скроллине в DoChgsconst
            if (this.scops.time === time)
                return

            const
                tag = this.cnst.tag,
                de = document.documentElement,
                p = this.cnst.ibody ?
                    { top: 0, left: 0, right: de.clientWidth, bottom: de.clientHeight } :
                    tag.getBoundingClientRect(),
                b = this.borders,
                atTo = tag.clientTop > b.top,         // полоса - вверху
                atLe = tag.clientLeft > b.left,       // полоса - слев       
                top = p.top + b.top + (atTo ? (tag.offsetHeight - tag.clientHeight) : 0),
                left = p.left + b.left + (atLe ? (tag.offsetWidth - tag.clientWidth) : 0)

            Object.assign(this.scops, {
                time: time,
                T: top,
                L: left,
                R: left + (this.cnst.ibody ? de.clientWidth : tag.clientWidth),
                B: top + (this.cnst.ibody ? de.clientHeight : tag.clientHeight)
            })
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [PO5])
})();
/* global window, document, console */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!!
(function () {              // ---------------------------------------------- shp/Frames ---
    "use strict"

    let wshp;
    const
        olga5_modul = "shp",
        modulname = 'Frames',
        C = window.o7.C,
        debug = C.consts.debug,
        MakeFrames = (aO5, ss) => {
            const
                errs = [],
                typs = 'cins',
                frms = aO5.frms,
                pBase = aO5.pBase,
                tagBase = pBase.pO5.cnst.tag,
                TagCheck = (t, typ, cod) => {
                    switch (typ) {
                        case 'n': return t.nodeName === cod
                        case 'i': return t.id === cod
                        case 'c':
                            for (const c of t.classList)
                                if (c == cod)
                                    return true
                    }
                }

            // удаляю старое использование
            for (const [key, frame] of Frame.frames) {
                const i = frame.aO5fs.indexOf(aO5)
                if (i >= 0) {
                    frame.aO5fs.splice(i, 1)
                    if (frame.aO5fs.length === 0)
                        Frame.frames.delete(key)
                }
            }
            // pBase.tagCuts.clear()  // а вот и НЕ надо очищать!
            frms.frames.clear()
            frms.tagCut = null

            // добавляю aO5  к frames
            for (const s of ss) {
                if (!s) continue

                let typ = 'i', cuu = s.trim()
                if (s.includes('=')) {
                    const cc = s.split('=')
                    typ = cc[0].trim().toLowerCase()[0]
                    cuu = cc[1].trim()
                }

                const
                    uu = cuu.split('/'),
                    cod = (uu[0] || '').trim(),
                    par = (uu[1] || '').trim(),
                    iscut = !!par.match(/c/i),
                    isfix = !iscut || par.match(/f/i)

                let num = par.replace(/[fc]/gi, '') || 0 // 'f' уже не используется и игнорируется                    

                if (!typs.includes(typ)) {
                    errs.push(`тип ссылки '${typ}' не начинается одним из '${typs}' заменен на 'i'`)
                    typ = 'i'
                }
                if (!Number.isInteger(num) || isNaN(num)) {
                    errs.push(`непонятное значение для num='${uu[1]}' (после символа '/'). Взято 0`)
                    nim = 0
                }

                if (iscut) {
                    let tag = frms.tagCut
                    if (!tag) {
                        let own = aO5.cnst.parent, n = num
                        if (cod === 'b' || cod === 'B')
                            tag = tagBase
                        else if (cod === 'w' || cod === 'W')
                            tag = body
                        else {
                            do {                        // ищу среди вложенных
                                if (TagCheck(own, typ, cod)) {
                                    tag = own
                                    if (--n <= 0)
                                        break
                                }
                                if (own === tagBase)
                                    break

                                own = own.parentNode
                            }
                            while (own.nodeName !== 'HTML')

                            if (!tag) {
                                own = pBase.pO5.cnst.tag, n = num
                                do {                    // ищу среди  ВСЕХ внешних 
                                    if (TagCheck(own, typ, cod)) {
                                        tag = own
                                        if (--n <= 0)
                                            break
                                    }
                                    own = own.parentNode
                                }
                                while (own.nodeName !== 'HTML')

                                if (tag && tag !== pBase.pO5.cnst.tag)
                                    console.log("%c%s", C.consts.fmtErr, `cut-контейнер '${tag.pO5?tag.pO5.name:C.MakeObjName(tag)}' для '${aO5.name}' `, ` найден снаружи базового контейнера '${pBase.pO5.name}'`)
                            }

                            if (!tag) {
                                errs.push(`${aO5.name}: не найден контейнер 'владелец' для "${s}" . Взял '${tagBase.pO5.name}'`)
                                tag = tagBase
                            }
                            else if (n > 0)
                                errs.push(`взял ${n}-й тег (вместо ${n0} для  "${s}") `)
                        }
                        frms.tagCut = tag
                        if (!tag.pO5)
                            new wshp.PO5shp.PO5(tag, window.getComputedStyle(tag))
                    }
                    else
                        errs.push(`несколько cut-квалификаторов (т.е. содержащих '/c')`)
                }

                if (isfix) {
                    const key = pBase.idn + ':' + typ + ',' + cod + ',' + num
                    let frame = Frame.frames.get(key)
                    if (!frame) {
                        let own = pBase.pO5.cnst.tag, n = num, tag;
                        if (cod === 'b' || cod === 'B')
                            tag = tagBase
                        else if (cod === 'w' || cod === 'W')
                            tag = body
                        else {
                            do {
                                if (TagCheck(own, typ, cod)) {
                                    tag = own
                                    if (--n <= 0)
                                        break
                                }
                                own = own.parentNode
                            }
                            while (own.nodeName !== 'HTML')

                            if (!tag) {
                                let found;
                                switch (typ) {
                                    case 'n': found = !!document.getElementsByTagName(cod); break
                                    case 'i': found = !!document.getElementById(cod); break
                                    case 'c': found = !!document.getElementsByClassName(cod)
                                }
                                const txt = found ? `найден НЕ скроллируемый` : `не найден скроллируемый`
                                errs.push(`${aO5.name}: ${txt}` + //  (или хотя  бы overflow: auto; / scroll;)    
                                    ` контейнер 'оператор' для typ=${typ} и cod='${cod}'. Взял '${pBase.pO5.name}'`)
                                tag = pBase.pO5.cnst.tag
                            }
                            else if (n > 0)
                                errs.push(`взял ${n}-й тег (вместо ${n0} для typ=${typ} и cod=${cod}) `)
                        }
                        frame = new Frame(key, typ, cod, num, tag.pO5)

                        Frame.frames.set(key, frame)

                        if (debug)
                            console.log(`Определил (и добавил в base.frames) фрейм "${key} на ${frame.pO5.name}" `)
                    }

                    frame.aO5fs.push(aO5)
                    frms.frames.add(frame)
                }
            }
            if (!frms.tagCut)
                frms.tagCut = tagBase

            pBase.tagCuts.add(frms.tagCut)

            if (errs.length)
                C.ConsoleError(`Ошибки определения фреймов для ${aO5.name}:`, errs.length, errs)
        }

    class Frame {
        static frames = new Map()
        constructor(key, typ, cod, num, pO5) {
            Object.assign(this, {
                typ: typ,
                cod: cod,
                num: num,
                pO5: pO5,
                aO5fs: [], // кто его использует
            })
            Object.seal(this)
        }

        // делаем класс итерируемым
        static *[Symbol.iterator]() {
            for (const [key, frame] of this.frames.entries()) {
                yield { key, frame };
            }
        }
    }

    wshp = C.AddModuleSub(olga5_modul, modulname, [Frame, MakeFrames])
})();/*jshint asi:true          */
/* global window, console, document */
/*jshint strict:true  */
/*jshint esversion: 6 */
//!
// Configure desktop -> Mouse Action -> Right-Button
(function () {              // ---------------------------------------------- shp/DoChgs ---
	"use strict"

	let wshp, time, D,
		tstO5, tstId = 'shp4', tstNam = 'bottom', tstVal = 481;

	// ---- batching ShowFix() per frame ----
	const FixUpdateQueue = new Set()
	let fixUpdateScheduled = false

	function ScheduleShowFixed(aO5) {
		FixUpdateQueue.add(aO5)
		if (!fixUpdateScheduled) {
			fixUpdateScheduled = true
			requestAnimationFrame(() => {
				for (const o of FixUpdateQueue)
					o.ShowFix()
				FixUpdateQueue.clear()
				fixUpdateScheduled = false
			})
		}
	}

	const
		olga5_modul = "shp",
		modulname = 'DoChgs',
		C = window.o7.C,
		debug = C.consts.debug,
		opp = { T: 'B', L: 'R', R: 'L', B: 'T' },

		CanFixsOn = (aO5, pO5) => {
			for (const frame of aO5.frms.frames)
				if (frame.pO5 === pO5)
					return true
		},
		FindExternalFixCuts = (m, pBase) => {
			const pBords = pBase.pBordss[m]
			for (const aO5 of pBase.aAll) {
				let xO5 = null
				if (aO5.cls.puts[m])
					for (const p of pBords)
						if (CanFixsOn(aO5, p)) {
							xO5 = p
							break
						}

				aO5.canFixs[m] = xO5
				aO5.canCuts[m] = pBords[0]

				// const fix = aO5.fixs[m]
				// if (fix.xO5 && fix.isP)
				// 	fix.xO5 = xO5

				if (debug > 2) console.log(`FindExternalFixCuts ${aO5.name} :  ` +
					`canFixs[${m}] = ${xO5 ? xO5.name : ' -  '},   ` +
					`canCuts[${m}] = ${aO5.canCuts[m] ? aO5.canCuts[m].name : ' -  '}`)
			}
		},
		GetV = (m, aX) => {
			switch (m) {
				case 'T': return aX.top
				case 'L': return aX.left
				case 'R': return aX.left + aX.width
				case 'B': return aX.top + aX.height
			}
		},
		SetV = (m, aX, v) => {
			switch (m) {
				case 'T': aX.top = v; break
				case 'L': aX.left = v; break
				case 'R': aX.left = v - aX.width; break
				case 'B': aX.top = v - aX.height; break
			}
		},
		ReAttach = (x, xTL, aO5) => {
			const
				o = opp[x],
				vC = GetV(o, aO5.posC)
			/**
			 *   Перепозиционировать уже приаттачеенные
			 */
			for (const iO5 of aO5.attachss[o]) {
				SetV(x, iO5.posC, vC)
				InternalTagCuts(o, iO5, 0, 0)

				ReAttach(x, xTL, iO5)
			}
		},
		AttachTo = (x, xTL, aO5) => {
			const
				o = opp[x],
				level = aO5.cls.level,
				vC = GetV(o, aO5.posC)
			/**
			 *   Если прилеплен к "верхнему" [x] bord'у, то
			 * 		подсоединяем те, что "снизу" [o] 
			 */
			for (const iO5 of aO5.aO5s[o]) {
				if (!iO5.act.ready || iO5.cls.level >= level || iO5.fixs[x].xO5)
					continue

				const vI = GetV(x, iO5.posC)
				if (xTL ? vC >= vI : vC <= vI) {
					iO5.DoFix(x, aO5)
					SetV(x, iO5.posC, vC)
					InternalTagCuts(o, iO5, 0, 0)
					aO5.attachss[o].push(iO5)

					AttachTo(x, xTL, iO5)
				}
				else
					break
			}
		},
		UnAttach = (x, xTL, aO5) => {
			const
				o = opp[x],
				vC = GetV(x, aO5.posC),
				attachs = aO5.attachss[x]
			/**
			 *  Если прилеплен к "нижнему" [o] bord'у, то
			 * 	отсоединяем те, что "сверху" [x] 
			 */
			for (const iO5 of attachs) {
				if (iO5.attachss[x].length)
					UnAttach(x, xTL, iO5)

				const vI = GetV(o, iO5.posO)
				if (xTL ? vI < vC : vI > vC) {
					const j = attachs.indexOf(iO5)
					attachs.splice(j, 1)
					iO5.DoFix(o)
				}
			}
		},
		CheckHidden = (aO5) => {
			if (aO5.posC.height <= 0) aO5.hidden.T = aO5.hidden.B = 1
			if (aO5.posC.width <= 0) aO5.hidden.L = aO5.hidden.R = 1

			if (!aO5.cls.alive)
				for (const x of 'TLRB')
					if (aO5.hidden[x]
						&& aO5.fixs[x].xO5
						&& aO5.fixs[x].isP
					) {
						aO5.DoFix(x, null)

						const
							o = opp[x],
							xTL = 'TL'.includes(x),
							attachs = aO5.attachss[o]
						let j = attachs.length
						while (j-- > 0) {
							const iO5 = attachs[j]
							attachs.splice(j, 1)
							iO5.DoFix(x)
							if (!ToFix(x, iO5, xTL))
								UnAttach(x, xTL, iO5)
						}
					}
		},
		ExternalFixCuts = (x, aO5) => {
			const
				v = aO5.canCuts[x].scops[x],
				aC = aO5.posC
			let d;
			switch (x) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = (aC.left + aC.width) - v; break
				case 'B': d = (aC.top + aC.height) - v; break
			}

			if (d > 0) {
				switch (x) {
					case 'T': aC.height -= d; aC.top += d; aO5.posS.top -= d; break
					case 'L': aC.width -= d; aC.left += d; aO5.posS.left -= d; break
					case 'R': aC.width -= d; break
					case 'B': aC.height -= d; break
				}
				return true
			}
		},
		InternalTagCuts = (o, aO5, scV, scH) => {
			const
				pO5 = aO5.frms.tagCut.pO5,
				v = pO5.scops[o],
				aC = aO5.posC

			let d;
			switch (o) {
				case 'T': d = v - aC.top; break
				case 'L': d = v - aC.left; break
				case 'R': d = aC.left + aC.width - v; break
				case 'B': d = aC.top + aC.height - v; break
			}

			if (d > 0) {
				switch (o) {
					case 'T': aC.height -= d; aC.top += d; break
					case 'L': aC.width -= d; aC.left += d; break
					case 'R': aC.width -= d; aO5.posS.left -= d; break		//  - scH
					case 'B': aC.height -= d; aO5.posS.top -= d; break		//  - scV
				}
				return true
			}
		},
		PitchBy = (x, xTL, aO5) => {
			const
				o = opp[x],
				level = aO5.cls.level,
				vC = GetV(o, aO5.posC)
			/**
			 * 	ищу тех, которы согут сдвинуть/сжать aO5
			 *  среди тех, которые находятся со стороны 'o'
			 */
			const pitchs = new Map()
			let vX, xO5, pitch = '', n = aO5.pBase.aAll.length
			do {
				vX = vC
				xO5 = null
				for (const iO5 of aO5.aO5s[o])
					if (iO5.cls.level > level
						&& !pitchs.get(iO5)
					) {
						const vI = GetV(x, iO5.posC)
						if (xTL ? vX > vI : vX < vI) {
							xO5 = iO5
							vX = vI
						}
						iO5.cnst.shp.style.zIndex = parseInt(iO5.cls.zIndex)  // 'обнуляю' индексы
					}

				if (xO5) {
					pitch = xO5.cls.pitch
					pitchs.set(xO5, true)

					const d = xTL ? (vC - vX) : (vX - vC), aC = aO5.posC, aS = aO5.posS
					switch (pitch) {
						case 'C':
							switch (x) {	// сжимает предыдущий	
								case 'T': aC.height -= d; break
								case 'L': aC.width -= d; break
								case 'R': aC.width -= d; aC.left += d; aS.left -= d; break
								case 'B': aC.height -= d; aC.top += d; aS.top -= d; break
							}
							break
						case 'P':
							switch (x) {	// сталкивает предыдущий
								case 'T': aC.height = 0; break
								case 'L': aC.width = 0; break
								case 'R': aC.width = 0; aC.left += aC.width; break
								case 'B': aC.height = 0; aC.top += aC.height; break
							}
							break
						case 'S':
							switch (x) {	// сдвигает предыдущий
								case 'T': aC.height -= d; aS.top -= d; break
								case 'L': aC.width -= d; aS.left -= d; break
								case 'R': aC.width -= d; aC.left += d; break
								case 'B': aC.height -= d; aC.top += d; break
							}
							break
						default: 	//case 'O' - наезжает на предыдущий // ничего не даформируется
							xO5.shp.style.zIndex = parseInt(cart.style.zIndex) + 1
					}
					CheckHidden(aO5)

					ReAttach(x, xTL, aO5)
				}
			} while (xO5 && pitch === 'O' && n-- > 0)

			for (const iO5 of aO5.attachss[o])
				if (PitchBy(x, xTL, iO5))
					pitch = '*'

			return pitch
		},
		SetPos = (x, v, aC, aO) => {
			switch (x) {
				case 'T': aC.top = v; break
				case 'L': aC.left = v; break
				case 'R': aC.left = v - aO.width; break
				case 'B': aC.top = v - aO.height; break
			}
		},
		ToFix = (x, aO5, xTL) => {
			if (aO5.cls.puts[x]
				&& !aO5.IsP(x, false)
			) {
				const pF = aO5.canFixs[x] || aO5.fixs[x].xO5
				if (pF
					&& pF === aO5.pBase.pBordss[x][0]
					&& (aO5.IsP(x, true) !== pF)
				) {
					const vF = pF.scops[x],
						vO = GetV(x, aO5.posO)
					if ((xTL ? (vO < vF) : (vO > vF)))
						aO5.DoFix(x, pF)
				}

			}

			if (aO5.IsP(x, true)) {
				SetPos(x, aO5.fixs[x].xO5.scops[x], aO5.posC, aO5.posO)
				return true
			}
		},
		UnFix = (o, aO5, xTL) => {
			const pF = aO5.canFixs[o] || aO5.fixs[o].xO5
			if (pF
				&& aO5.fixs[o].xO5 === pF
			) {
				const vF = pF.scops[o],
					vO = GetV(o, aO5.posO)
				if (xTL ? (vO >= vF) : (vO <= vF)) {//	тут не надо расфиксировать приаттаченные - они "отъехали" раньше
					aO5.DoFix(o, null)
					return true
				}
			}

			SetPos(o, aO5.fixs[o].xO5.scops[o], aO5.posC, aO5.posO)
		},
		CalcCurPozs = aO5 => {
			const p = aO5.shdw.getBoundingClientRect()

			Object.assign(aO5.posO, { top: p.top, left: p.left, height: p.height, width: p.width, right: p.right, bottom: p.bottom })
			Object.assign(aO5.posC, { top: p.top, left: p.left, height: p.height, width: p.width })
			Object.assign(aO5.posS, { top: 0, left: 0 })

			for (const x of 'TLRB')
				aO5.hidden[x] = 0
		},
		CalcFixPozs = (x, aO5) => {
			const
				o = opp[x],
				fx = aO5.fixs[x],
				fo = aO5.fixs[o],
				xO5 = fx.xO5,
				oO5 = fo.xO5

			if (xO5 || oO5) {
				const
					aO = aO5.posO,
					aC = aO5.posC,
					isT = x === 'T',
					vx = xO5 ? (fx.isP ? xO5.scops[x] : GetV(o, xO5.posC)) : GetV(x, aO),
					vo = oO5 ? (fo.isP ? oO5.scops[o] : GetV(x, oO5.posC)) : GetV(o, aO)

				if (xO5 && oO5)
					Object.assign(aC, isT ? { top: vx, height: vo - vx } : { left: vx, width: vo - vx })
				else if (oO5)
					Object.assign(aC, isT ? { top: vo - aO.height } : { left: vo - aO.width })
				else if (xO5)
					Object.assign(aC, isT ? { top: vx } : { left: vx })
			}
		},
		CalcPozs = (pBase) => {			// Расчет позиций фиксированных
			for (const aO5 of pBase.aAll)
				CalcCurPozs(aO5)
			for (const x of 'TL')
				for (const aO5 of pBase.bO5s[x])
					CalcFixPozs(x, aO5)
		}

	function MakeScroll(scV, scH, pcO5, fromExt) {
		if (debug > 1 && !D && fromExt) {	//	постоянный доступ из отладчика
			D = {}
			for (const pBase of pcO5.pBases) {
				let b = D[pBase.pO5.name] = {}
				for (const aO5 of pBase.aAll)
					b[aO5.name] = aO5	// .substr(3)
			}
		}

		const GAll = i => pcO5.pBases.values().next().value.aAll[i]
		time = performance.now()
		// направление движения объектов в контейнере - обратное ползунку скроллинга	
		let xs = ''
		if (scV > 0) xs += 'T'; else if (scV < 0) xs += 'B'
		if (scH > 0) xs += 'L'; else if (scH < 0) xs += 'R'

		for (const pBase of pcO5.pBases)
			if (pBase.pO5.scops.isVisible) {
				for (const tagCut of pBase.tagCuts)
					tagCut.pO5.CalcScope(time)
				for (const pOut of pBase.pO5.pOuts)
					pOut.CalcScope(time)
			}

		for (const x of xs)
			wshp.PBases.PBase.SetBorders(x, pcO5)

		for (const pBase of pcO5.pBases) {
			if (!pBase.pO5.scops.isVisible) continue

			CalcPozs(pBase)

			for (const m of 'TLRB')  // вообще-то достаточно "for (const x of xs)" + "[x, opp[x]]"
				if (pBase.bChgs[m] || pBase.bChgs.start || fromExt)
					FindExternalFixCuts(m, pBase)

			pBase.bChgs.start = false

			for (const x of xs) {
				// прямой ход и фиксация	по 'x' 
				const o = opp[x]
				let xTL = 'TL'.includes(x)
			/**
			 * фиксации
			 */
				for (const aO5 of pBase.bO5s[x]) {
					if (aO5.act.ready
						&& !aO5.hidden[o]
					) {
						const oldIsP = aO5.IsP(x, true)
						ToFix(x, aO5, xTL)
						const newIsP = aO5.IsP(x, true)
						if (newIsP) {						// переопр. размеров внутри
							// 					const piO5=aO5.shp.pO5
							// 					if (!oldIsP && piO5){

							// for (const pBase of piO5.pBases)
							// 	if (pBase.pO5.scops.isVisible) {
							// 		for (const tagCut of pBase.tagCuts)
							// 			tagCut.pO5.CalcScope(time)
							// 		for (const pOut of pBase.pO5.pOuts)
							// 			pOut.CalcScope(time)
							// 	}

							// for (const x of xs)
							// 	wshp.PBases.PBase.SetBorders(x, piO5)

							// 						for (const iBase of piO5.pBases)
							// 							CalcPozs(iBase)}
						}
						else
							if (aO5.canFixs[x] === aO5.canCuts[x])
								break
					}
					// // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!					
					// const m1 = aO5.act.ready
					// const m2 = !aO5.hidden[o]
					// const m3 = !ToFix(x, aO5, xTL)
					// const m4 = aO5.canFixs[x] === aO5.canCuts[x]

					// if (aO5.act.ready
					// 	&& !aO5.hidden[o]
					// 	&& !ToFix(x, aO5, xTL)
					// 	&& aO5.canFixs[x] === aO5.canCuts[x]
					// )
					// 	break
				}

				// расфиксация по [o]
				xTL = 'TL'.includes(o)
				for (const aO5 of pBase.bO5s[o])
					if (aO5.act.ready
						&& aO5.IsP(o, true)
					)
						UnFix(o, aO5, xTL)
			}
			/**
			 * обрезания внутренним и внешним контейнерами
			 */
			for (const aO5 of pBase.aAll)
				if (aO5.act.ready && aO5.act.isfix) {
					for (const x of 'TLRB') {
						const o = opp[x]
						if (aO5.fixs[x].xO5)	//   aO5.IsP(x, true))
							if (InternalTagCuts(o, aO5, scV, scH))
								ReAttach(o, 'TL'.includes(o), aO5)

						if (aO5.canCuts[x]) 	//  && !aO5.IsP(x, false))  // && !aO5.fixs[x]
							if (ExternalFixCuts(x, aO5))
								ReAttach(x, 'TL'.includes(x), aO5)
					}
					CheckHidden(aO5)
				}
			/**
			 * прилипания и сталкивания
			 * динамическая фиксация остальных на зависших элементах
			 */
			for (const x of xs) {
				const o = opp[x], q = { [x]: 1, [o]: 1 }
				let n = 5
				do {
					for (const m of [x, o]) {
						if (!q[m]) continue

						const xTL = 'TL'.includes(x),
							mTL = m === x ? xTL : !xTL
						for (const aO5 of pBase.bO5s[m])
							if (aO5.IsP(m, true)) {		// Если прилеплен к "верхнему" [x] bord'у, то
								if (m === x)
									AttachTo(x, xTL, aO5)	//	подсоединяем те, что "снизу" [o] 
								else
									UnAttach(x, xTL, aO5)
							}
							else
								if (aO5.canFixs[n] === aO5.canCuts[m])
									break

						q[m] = 0
						for (const aO5 of pBase.bO5s[m])
							if (aO5.IsP(m, true)) {
								const pitch = PitchBy(m, mTL, aO5)
								if (pitch) {
									if (pitch !== 'O' && pitch !== 'P')
										q[m] = 1
								} else
									break
							}
					}
					n--
				} while ((q.x || q.o) && n > 0)

				if (n <= 0)
					console.error("%c%s", C.consts.fmtErr, `динамическая фиксация по [${m}]`, ` не завершилась за ${n} шагов`)
			}
			// отображение зафиксированых
			for (const aO5 of pBase.aAll)
				if (aO5.act.isfix)
					ScheduleShowFixed(aO5)

			//   -----------------------  ОСТАВЬ для примера -------------------------------
			// 		let dbgstrt = false
			// if (dbgstrt && GAll(1).posC.height > 20)
			// 	console.log('-15-')
			// if (GAll(1).posC.height < 20)
			// 	dbgstrt = true
		}
	}
	wshp = C.AddModuleSub(olga5_modul, modulname, [MakeScroll])
})();﻿/* global document, window */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

(function () {              // ---------------------------------------------- shp ---
	"use strict";

	const
		C = window.o7.C,
		olgaShp = 'olga-shp',
		W = Object.seal({
			cls: Object.freeze({
				modul: 'shp',
				Init: ShpInit,
				curScript: document.currentScript,
				incls: ['DoInit', 'PBases', 'AO5shp', 'PO5shp', 'Frames', 'DoChgs'],
			}),
		}),
		o5css = `
			.o-shpCart {
                margin: 0;
				cursor: pointer; 
				position: fixed;
				background: none;
				overflow: hidden;
				transform: translate(0px, 0px);
			}
			.o-shpClon {
				display:none;
			}
	    `,
		wshp = C.AddModule(W)

	function ShpInit() {

		C.ParamsFill(W, o5css)

		const excls = document.getElementsByClassName('o-shpNone')
		for (const excl of excls) {
			const exs = excl.querySelectorAll(`[class *=${olgaShp}]`)
			for (const ex of exs)
				ex.classList.add('o-shpNone')
		}

		wshp.DoInit.Init()

		C.DispatchEvent('o_scriptDone', W.cls.modul)

		wshp.activated = false 	// признак, что было одно из activateEvents 
		const activateEvents = ['click', 'keyup', 'resize'],
			wd = window, // document
			SetActivated = () => {
				wshp.activated = true
				activateEvents.forEach(activateEvent => wd.removeEventListener(activateEvent, SetActivated))
			}

		activateEvents.forEach(activateEvent => wd.addEventListener(activateEvent, SetActivated))
	}

	wshp.Map = class extends Map {
		constructor(cc = "|") {
			super()
			this.cc = cc
		}
		#normalizeKey(key) { return Array.isArray(key) ? key.join(this.cc) : key }
		set(key, value) { return super.set(this.#normalizeKey(key), value) }
		get(key) { return super.get(this.#normalizeKey(key)) }
		has(key) { return super.has(this.#normalizeKey(key)) }
		delete(key) { return super.delete(this.#normalizeKey(key)) }
	}

	wshp.IntersectionObserver = class extends IntersectionObserver {
		constructor(callback, options) {
			super(callback, options)
			this.tags = new Set() // Используем Set, чтобы не было дубликатов
			this.aO5s = new Set() // все контролируемые aO5
		}
		observe(tag) {
			if (!this.tags.has(tag)) {
				super.observe(tag)
				this.tags.add(tag)
				// const aO5s = tag.pO5.aO5xs.T
				// for (const aO5 of aO5s)
				// 	this.aO5s.add(aO5)
			}
		}
		unobserve(tag) {
			if (this.tags.has(tag)) {
				super.unobserve(tag)
				this.tags.delete(tag)

				this.aO5s.length = 0
				for (const tag of this.tags) {
					const aO5s = tag.pO5.aO5ps.T
					for (const aO5 of aO5s)
						this.aO5s.add(aO5)
				}
			}
		}
		disconnect() {
			super.disconnect()
			this.tags.length = 0
		}
	}
})();
