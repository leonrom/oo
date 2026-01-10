/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o7 ---    
    'use strict';
    let debug = 1
    const
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;"

    class LoadMI {         //  контроль загрузки подмодулей модуля - элелменты LoMod.incls[] 
        /**
         *  Общий Загрузчик
         *  таймер не нужен - контролируется общим таймером  
         */
        done = false   // завершена/не-требуется загрузка подмодулей
        name = '?'            // условное имя "для протоколу"
        src = '?'            // путь загрузки 
        Fun          // функция после загрузки 

        Done(err = null) {
            this.done = true
            if (this.Fun && !err) { // иначе callback-функции игнорирутся
                this.Fun()
                this.Fun = null
            }
            Object.freeze(this)     // контроль,- чтобы больше не трогали

            if (debug)
                console.log(`${this.name} ${err ? 'ошибка загрузки' : 'загружен'}: ${this.src}`)
        }
        LoadScript() {
            if (debug > 1)
                console.log(`Загружаю ${this.name}`)

            const script = document.createElement('script')
            script.addEventListener('load', () => this.Done(), { once: true })
            script.addEventListener('error', () => this.Done(true), { once: true })

            script.src = this.src
            document.head.append(script)
        }
        constructor(name, src, Fun) {
            this.name = name
            this.src = src
            this.Fun = Fun
            if (src)
                this.LoadScript()
            else
                this.done = true
        }
    }

    class LoIncl extends LoadMI {         //  контроль загрузки подмодулей модуля - элелменты LoMod.incls[]        
        constructor(name, src, Fun) {
            super(name, src, Fun)
        }
    }

    const loMods = {}       // загрузчики - для каждого модуля
    class LoMod extends LoadMI {        //  контроль загрузки модулей
        loIncls = {}            // подгружаемые Incls
        constructor(name, isComp, src, Fun) {
            super(name, src, Fun)
            this.isComp = isComp
            // this.modul = name

            if (!loMods[name]) loMods[name] = this
            else
                console.error('%c%s', fmtErr, `Повторная загрузка модуля '${name}'`, orig)
        }
        get modul() {
            alert('modul')
        }
    }

    const
        IsUnDefined = c => typeof c === 'undefined',
        TryToDigit = x => {
            if (IsUnDefined(x)) return 1
            const
                val = ('' + x).replace(/^(['"`])([\s\S]*)\1$/, '$2'),
                vf = parseFloat(val)
            if (vf == val) {
                const vc = parseInt(val)
                if (vc == val) return vc
                return vf
            }
            else
                switch (val) {
                    case '': return 1
                    case 'true': return true
                    case 'false': return false
                    default:
                        return val
                            .replace(/\s*\n+\s*/g, ';')
                            .replace(/\t+/g, ' ')
                            .trim();
                }
        },
        FillFromScript = (Z, _dataset, _consts) => {  //  здесь Z м.б. W или C, а _dataset, _consts - из C  
            const
                dataset = (Z.load && Z.load.dataset) ? Z.load.dataset : _dataset,
                ForNeedData = z => {      // поиск констант, заявленных в needs
                    const needs = z.needs.replace(/[^\p{L}\p{N}+.,;_]+/gu, '').split(';')
                    for (const need of needs) {
                        const
                            ss = need.split('='),
                            nam = ss[0]
                        if (nam && !z[nam]) {
                            z[nam] = ss[1]  // не был найден среди name (consts или urlrfs)
                            for (const name in dataset)
                                if (nam === name)
                                    z[nam] = dataset[name]  // перебираю все - беру последний
                        }
                    }
                },
                FromNamedData = z => {      // доминирования заявленых индивидуально
                    for (const name in dataset)
                        if (!IsUnDefined(z[name]))
                            z[name] = dataset[name]
                },
                FromCommonData = (z, name) => {   // обработка data-consts и data-urlrfs
                    const
                        cnsts = dataset[name]?.split(';') ?? [],
                        isconst = name === 'consts'
                    for (const cns of cnsts) {
                        const
                            ss = cns.split('='),
                            c = ss[0].trim()
                        if (c && c[0] !== '#') {
                            const v = ss[1].trim()
                            if (isconst) z[c] = TryToDigit(v)
                            else
                                if (v && v[0] !== '#')
                                    z[c] = v
                        }
                    }
                }

            for (const name of ['consts', 'urlrfs']) {
                const z = Z[name]
                FromCommonData(z, name)
                FromNamedData(z)
                if (z.needs)
                    ForNeedData(z)
            }

            // "полировка" константами адресной строки
            for (const c in _consts)
                Z['consts'][c] = _consts[c]
        },
        CurScr = () => {
            const
                curScript = document.currentScript,
                src = curScript?.src ?? '',
                path = src.replace(/[^/]+$/, ''),
                name = src.match(/([^/]+)\.[^.]+$/)?.[1] ?? ''
            // isComp = name[name.length - 1] === '!'

            return {
                dataset: curScript ? { ...curScript.dataset } : {},
                src: src,
                path: path,
                name: name,
                // isComp: isComp,
                // modul: isComp ? name.slice(0, name.length - 1) : name
            }
        },
        cc = {
            urlcns: {},     // константы из адресной строки
            curScr: Object.freeze(CurScr()),
            timer: 0, // будет задан и установлен в constructor после FillFromScript
        },
        C = new class {
            consts = {
                debug: 0, nomnu: 0, noact: 0, timLoad: 3, fmtOK: fmtOK, fmtErr: fmtErr,
                doscr: 'olga5_sdone',
                pageDones: 'beforeunload, o_unloadPage',
                pageLoads: 'readystatechange:d, message:u, inc_ready',
                depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
            }
            scrpts = []
            constructor() {
                const url = new window.URL(window.location)
                this.urlrfs = {
                    _root: url.origin + '/',
                    _olga: cc.curScr.src.match(/\S*\//)?.[0],
                    _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
                }

                // сохраняю константы из адресной строки
                const params = Object.fromEntries(new URLSearchParams(window.location.search))
                for (const nam in params)
                    cc.urlcns[nam] = TryToDigit(params[nam])
                Object.freeze(cc.urlcns)

                FillFromScript(this, cc.curScr.dataset, cc.urlcns)

                Object.freeze(this.consts)
                Object.freeze(this.urlrfs)

                cc.timer = setTimeout(() => this.Finish('таймер'), this.consts.timLoad * 1000)
                debug = this.consts.debug
            }
            AddModuleSub(modul, submod, funcs) {
                /**
                 * subscript м.б. либо подгруженным, либо скомпилированным в тело модуля
                 * вызывается еще до фиксации в классе
                 */
                const
                    // modul = m[m.length - 1] === '!' ? m.slice(0, m.length - 1) : m,
                    omod = window.o7[modul],
                    errs = []
                if (!omod)
                    console.log()
                if (omod[submod])
                    errs.push(`Повтор подгрузки '${modul}/${submod}'`)

                if (funcs)  // м.б. либо объект {name, obj}, либо массивом функций [f1, f2...]  
                    if (Array.isArray(funcs)) {
                        for (const func of funcs) {
                            const name = func.name
                            if (omod[name]) errs.push(`Повтор функции '${name}'`)
                            else
                                omod[name] = func
                        }
                    }
                    else {
                        const name = funcs.name
                        if (!name)  // тупо сразу исполнить
                            funcs()
                        else
                            if (omod[name]) errs.push(`Повтор объекта '${name}'`)
                            else
                                omod[name] = funcs.obj
                    }

                if (errs.length)
                    console.error('%c%s', fmtErr, `Ошибки добавления субмодуля ${submod} в `, modul, errs)

                if (debug > 2) {
                    const names = Array.isArray(funcs)
                        ? funcs.map(f => f.name)
                        : [funcs.name];
                    console.log(`подключён ${modul}.${submod}: ${names.join(',')}`)
                }

                return omod
            }
            RegisterModul(modul) {
                const W = window.o7[modul]?.W
                if (W) {
                    // if (W.ready) return

                    Object.assign(W, CurScr(), { consts: {}, urlrfs: {}, }) // ready: true })

                    for (const name of ['consts', 'urlrfs']) // копируем из корневого модуля
                        for (const c in C[name])
                            W[name][c] = C[name][c]

                    FillFromScript(W, cc.curScr.dataset, cc.urlcns)
                    Object.freeze(W)
                }

                // loMods[modul].done = true

                let ready = true
                for (const modul in loMods)
                    if (!loMods[modul].done) {
                        ready = false
                        break
                    }

                if (ready)
                    this.Finish()

                // // информация для запускальщика программ инициализации модулей
                // const e = new CustomEvent('o_modulReady', modul ? { detail: { modul: modul } } : {})
                // window.dispatchEvent(e)
            }
            OnLoadIncl(modul) {
                if (loMods._isfinih) return
                const loIncls = loMods[modul].loIncls
                for (const incl in loIncls)
                    if (!loIncls[incl].done)
                        return

                C.RegisterModul(modul)
            }
            OnLoadModul(modul) {
                if (loMods._isfinih) return
                const
                    // modul = m[m.length - 1] === '!' ? m.slice(0, m.length - 1) : m,
                    W = window.o7[modul]?.W,
                    loMod = loMods[modul]

                if (!W) {
                    const fs = [], ms = []
                    for (const name in loMods) fs.push((name))
                    for (const name in window.o7) ms.push((name))
                    console.error('%c%s', fmtErr, `Отсутствует добавляемый модуль '${modul}'  `,
                        `(несовп. имен файла и W.modul? или синтаксис в W.modul?)`,
                        `\n\t файлы : ` + fs.join(', '),
                        `\n\t модули: ` + ms.join(', '),
                    )
                    return
                }

                if (loMod.isComp || !W.incls)    // C.DispatchEvent('o_modulReady', modul)
                    C.RegisterModul(modul)
                else {
                    const path = C.urlrfs._olga + modul + '/'

                    for (const incl of W.incls)
                        loMod.loIncls[incl] =
                            new LoIncl(`${loMod.name}.${incl}`,
                                path + incl + '.js',
                                () => C.OnLoadIncl(modul)
                            )
                }

                if (debug > 1) {
                    const incls = []
                    for (const incl in loMod.loIncls) incls.push(incl)
                    console.log('%c%s', fmtOK, ` ${modul.padEnd(8)} `, ` [${incls.join(', ')}]`, loMod.src)
                }
            }

            Finish(err) {
                if (loMods._isfinih) return
                if (cc.timer) {
                    clearTimeout(cc.timer)
                    cc.timer = 0
                }

                const errs = []
                for (const modul in loMods) {
                    const loMod = loMods[modul],
                        ers = []
                    if (!loMod.done) ers.push(modul)
                    for (const incl in loMod.loIncls) {
                        const loIncl = loMod.loIncls[incl]
                        if (!loIncl.done)
                            ers.push(`${modul}.${incl}`)
                    }
                    const ready = loMod.done && ers.length === 0 && !err
                    this.scrpts.find(m => modul === m.modul).ready = ready

                    if (!ready)
                        errs.push((loMod.done ? `?` : modul) + (ers.length ? ` [${ers.join(', ')}]` : ``))
                }

                if (errs.length > 0)
                    console.error('%c%s', fmtErr, `Незавершены (${err ? 'таймер' : '??'}) загрузки: `, errs.join('; '))
                else
                    if (debug) {
                        console.log('%c%s', fmtOK, `Загружены все модули !`)
                        if (C.consts.debug > 1)
                            OutDebug()
                    }
                for (const modul in loMods)
                    delete (loMods[modul])

                loMods._isfinih = true
                Object.freeze(this)

                const e = new CustomEvent('o_allIsReady', {})
                window.dispatchEvent(e)
            }
            ListModuls() {
                for (const modul in window.o7) // добавляю которые уже в скомпилированном
                    if (modul !== 'C') {
                        new LoMod(modul, true)
                        C.scrpts.push({ modul, ready: true })
                    }

                for (const script of document.scripts) { // перебор описаний скриптов и добавление отсутствующих
                    if (script === document.currentScript) break // этот - д.б. последним

                    const orig = script.dataset?.src?.replace(/\s+/g, '')
                    if (orig && orig[0] === '+') {
                        const
                            fn = orig.substring(1),
                            src = C.urlrfs._olga + fn,
                            name = fn.replace(/\.[^.]+$/, ''),
                            isComp = name[name.length - 1] === '!',
                            modul = isComp ? name.slice(0, name.length - 1) : name

                        if (!loMods[modul]) {
                            new LoMod(modul, isComp, src, () => C.OnLoadModul(modul))
                            C.scrpts.push({ modul, ready: false })
                        }
                    }
                }
            }
        };

    /**
     *  этот модуль в скомпилированном д.б. последним - выполниться после всех остальных
     *  а его скрипт должен находиться после всех скриптов в заголовке
     */
    (window.o7 ??= {}).C = C


    // отладка - убрать ---------------------------------------------------------
    function OutDebug() {
        const Fill = (name, modul) => {
            const arr = [],
                attrib = window.o7[modul].W[name]
            if (!attrib)
                console.error('%c%s', fmtErr, `? В window.o7.${modul}.W нет атрибута '${name}'`)
            else
                for (const [key, val] of Object.entries(attrib))
                    arr.push({ key, val })
            return arr
        }
        for (const modul in window.o7)
            if (modul !== 'C') {
                const loMod = loMods[modul]
                if (loMod) {
                    const
                        incls = [],
                        consts = Fill('consts', modul),
                        urlrfs = Fill('urlrfs', modul),
                        src = window.o7[modul].W?.dataset?.src || '??'

                    for (const incl in loMod.loIncls)
                        incls.push(`${incl}${loMod.loIncls[incl].done ? '' : '=false'}`)
                    console.groupCollapsed("%c%s", fmtOK, modul, incls.join(', '),
                        `\n\t  W...src= ${src.padEnd(12)}, done= '${loMod.done}', orig='${loMod.orig}'`
                    )
                    console.table(consts)
                    console.table(urlrfs)
                    console.groupEnd()
                }
                else
                    console.error('%c%s', fmtErr, `? В 'loMods' нет объекта '${modul}'`)
            }
        console.log('==============================================')
    }

})();