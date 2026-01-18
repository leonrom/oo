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

    class LoadMI {         //  универсальный контроль загрузки 
        /**
         *  Общий Загрузчик
         *  таймер не нужен - контролируется общим таймером  
         */
        name = '?'      // условное имя "для протоколу"
        src = '?'       // путь загрузки 
        done = 0        // завершена/не-требуется загрузка подмодулей
        Fun = null            // функция после загрузки 

        Done(ok) {
            this.done = ok ? 1 : -1

            if (debug)
                console.log(`${this.name} ${ok ? 'загружен' : 'ошибка загрузки'}`)

            if (this.Fun) {
                this.Fun(ok)
                this.Fun = null
            }
            Object.freeze(this)     // контроль,- чтобы больше не трогали
        }
        LoadScript() {
            if (debug > 1)
                console.log(`загружаю ${this.name.padEnd(16)}  ${this.src}`)

            const script = document.createElement('script')
            script.addEventListener('load', () => this.Done(true), { once: true })
            script.addEventListener('error', () => this.Done(), { once: true })

            script.src = this.src
            document.head.append(script)
        }
        constructor(name, src, Fun) {
            this.name = name
            this.src = src
            this.Fun = Fun
            this.LoadScript()
        }
    }

    class LoIncl extends LoadMI {         //  контроль загрузки подмодулей модуля - элелменты LoMod.incls[]        
        constructor(name, src, Fun) {
            super(name, src, Fun)
        }
    }

    class LoMod extends LoadMI {        //  контроль загрузки модулей
        loIncls = {}            // подгружаемые Incls
        constructor(name, isComp, src, Fun) {
            super(name, src, Fun)
            this.isComp = isComp
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
                ForNeedData = z => {      // поиск констант, заявленных в _needs
                    const _needs = z._needs
                        .replaceAll(/\n|;|[#|\/\/].*$/gm, ',')
                        .replace(/,\s*,|\s+,\s+/g, ',')
                        .split(',')
                    for (const need of _needs) {
                        const
                            ss = need.split('='),
                            nam = ss[0].trim()
                        if (nam && !z[nam]) {
                            z[nam] = ss[1].trim()  // не был найден среди name (consts или urlrfs)
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
                if (z._needs)
                    ForNeedData(z)
            }

            // "полировка" константами адресной строки
            for (const c in _consts)
                Z['consts'][c] = _consts[c]
        },
        CurScr = (script, _olga) => {
            const orig = _olga ? script.dataset?.src?.replace(/\s+/g, '') : ''
            if (_olga && !orig.startsWith('+')) // это файл не модуль для o7  
                return

            const
                src = _olga ? _olga + orig.substring(1) : script.src,
                name = src.match(/([^/]+)\.[^.]+$/)?.[1] ?? '',
                isComp = name.endsWith('!')

            return Object.freeze({
                dataset: script ? { ...script.dataset } : {},
                path: src.replace(/[^/]+$/, ''),
                src: src,
                name: name,
                orig: orig,
                isComp: isComp,
                modul: isComp ? name.slice(0, -1) : name,
            })
        },
        Freeze = obj => {
            for (const field of Object.getOwnPropertyNames(obj)) {
                if (!field.startsWith('_')) continue

                const desc = Object.getOwnPropertyDescriptor(obj, field)
                desc.configurable = false
                if ('value' in desc)
                    desc.writable = false

                Object.defineProperty(obj, field, desc)
            }
            return obj
        },
        cc = {
            urlcns: {},     // константы из адресной строки
            curScr: CurScr(document.currentScript, ''),
            timer: 0, // будет задан и установлен в constructor после FillFromScript
        }

    let _finished = false
    class C {
        consts = {
            debug: 0, nomnu: 0, noact: 0, timLoad: 3, fmtOK: fmtOK, fmtErr: fmtErr,
            doscr: 'olga5_sdone',
            pageDones: 'beforeunload, o_unloadPage',
            pageLoads: 'readystatechange:d, message:u, inc_ready',
            depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
        }
        constructor() {

            // //    для вылавливания !
            // this._id = Math.random().toString(36).slice(2)
            // console.log('C created', this._id, '=====================================')

            const url = new window.URL(window.location)
            this.urlrfs = {
                _root: url.origin + '/',
                _olga: cc.curScr.src.match(/\S*\//)?.[0],
                _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
            }
            //    для вылавливания !
            // Object.defineProperty(this, 'scrpts', {
            //   set(v) {
            //     console.trace('scrpts reassigned', v)
            //     this._scrpts = v
            //   },
            //   get() {
            //     return this._scrpts
            //   }
            // })
            this.scrpts = {}

            // сохраняю константы из адресной строки
            const params = Object.fromEntries(new URLSearchParams(window.location.search))
            for (const nam in params)
                cc.urlcns[nam] = TryToDigit(params[nam])
            Object.freeze(cc.urlcns)

            FillFromScript(this, cc.curScr.dataset, cc.urlcns)

            Object.freeze(this.consts)
            Object.freeze(this.urlrfs)

            this.ListModuls()

            cc.timer = setTimeout(() => this.Finish('таймер'), this.consts.timLoad * 1000)
            debug = this.consts.debug
            console.log('C created', this)
        }
        Freeze = obj => Freeze(obj)
        AddModuleSub(modul, submod, funcs) {
            const
                omod = window.o7[modul],
                errs = []

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
                        if (!omod[name]) omod[name] = funcs.obj
                        else
                            errs.push(`Повтор объекта '${name}'`)
                }

            if (errs.length)
                console.log('%c%s', fmtErr, `Ошибки добавления субмодуля ${submod} в `, modul, errs)
            else
                if (debug > 2) {
                    const names = Array.isArray(funcs)
                        ? funcs.map(f => f.name)
                        : [funcs.name];
                    console.log(`подключён ${modul}.${submod}: ${names.join(',')}`)
                }

            return omod
        }
        RegisterModul(modul, scrpt) {
            const W = window.o7[modul]?.W
            if (W) {
                if (debug > 1)
                    console.log(`Регистрируется модуль '${modul}'`)

                Object.assign(W, scrpt.curScr, { consts: {}, urlrfs: {}, })

                for (const name of ['consts', 'urlrfs']) // копируем из корневого модуля
                    for (const c in this[name])
                        W[name][c] = this[name][c]

                FillFromScript(W, cc.curScr.dataset, cc.urlcns)
                Object.freeze(W)
            }

            let sready = this.CheckUnload().length ? '' : ' - финальный!'

            if (!W)
                console.error('%c%s', fmtErr, `Не найден 'W' для файла (модуля) '${modul}'`, sready)
            else
                if (debug)
                    console.log('%c%s', fmtOK, `Зарегистрирован модуль '${modul}'`, sready)

            const e = new CustomEvent('o_modulReady', modul ? { detail: { modul: modul } } : {})
            window.dispatchEvent(e)

            if (sready)
                this.Finish()
        }
        OnLoadIncl(modul, ok) {
            if (_finished) return

            const
                scrpt = this.scrpts[modul],
                loMod = scrpt._loMod,
                loIncls = loMod.loIncls

            let iready = 1, done = true
            for (const incl in loIncls) {
                // console.log(incl, loIncls[incl].done)
                const idone = loIncls[incl].done
                if (idone === 0) {
                    done = false
                    break
                }
                if (idone < iready)
                    iready = idone
            }

            if (done)      // т.е.   все как-то завершились
                this.RegisterModul(modul, scrpt)   //, scrpt, iready)
        }
        OnLoadModul(modul, ok) {
            if (_finished) return
            const
                W = window.o7[modul]?.W,
                scrpt = this.scrpts[modul],
                loMod = scrpt._loMod    // loMods[modul] 

            if (!W) {
                const fs = [], ms = []
                for (const name in this.scrpts) fs.push((name))
                for (const name in window.o7) ms.push((name))
                console.error('%c%s', fmtErr, `Отсутствует добавляемый модуль '${modul}'  `,
                    `(несовп. имен файла и W.${modul}? или синтаксис в нём?)`,
                    `\n\t файлы : ` + fs.join(', '),
                    `\n\t модули: ` + ms.join(', '),
                )
                return
            }

            if (loMod.isComp || !W.incls)
                this.RegisterModul(modul, scrpt)   //, scrpt)
            else {
                const path = this.urlrfs._olga + modul + '/'

                for (const incl of W.incls)
                    loMod.loIncls[incl] =
                        new LoIncl(`${loMod.name}.${incl}`,
                            path + incl + '.js',
                            ok => this.OnLoadIncl(modul, ok)
                        )
            }

            if (debug > 1) {
                const aincls = []
                for (const incl in loMod.loIncls) aincls.push(incl)
                console.log(` ${modul.padEnd(8)} `, ` [${aincls.join(', ')}]`, loMod.src)
            }
        }
        CheckUnload() {
            const errs = []
            for (const [modul, scrpt] of Object.entries(this.scrpts)) {
                const loMod = scrpt._loMod
                if (loMod) {
                    const ers = []
                    if (loMod.done <= 0) ers.push(modul)
                    for (const incl in loMod.loIncls) {
                        const loIncl = loMod.loIncls[incl]
                        if (loIncl.done <= 0)
                            ers.push(`${modul}.${incl}`)
                    }
                    const ready = loMod.done !== 0 && ers.length === 0
                    this.scrpts[modul].iready = ready ? 1 : -1   // загружен но с ошибкой

                    if (!ready)
                        errs.push(modul + (ers.length ? ` [${ers.join(', ')}]` : ``))
                }
            }
            return errs
        }

        Finish(err) {
            if (_finished) return
            if (cc.timer) {
                clearTimeout(cc.timer)
                cc.timer = 0
            }

            const errs = this.CheckUnload()
            if (errs.length > 0)
                console.log('%c%s', fmtErr, `Незавершены загрузки:\n`, errs.join(';\n'))
            else
                if (err)
                    console.error('%c%s', fmtErr, `Незавершен таймер`, ' ?при завершенных загрузках !')
                else
                    if (debug) {
                        console.log('%c%s', fmtOK, `Загружены все модули !`)
                        if (this.consts.debug > 1)
                            OutDebug()
                    }

            _finished = true

            const IMMUTABLE = { writable: false, configurable: false, enumerable: true }
            for (const field of Object.getOwnPropertyNames(this))
                Object.defineProperty(this, field, { ...IMMUTABLE, value: this[field] })

            const e = new CustomEvent('o_allIsReady', {})
            window.dispatchEvent(e)
        }
        ListModuls() {
            for (const modul in window.o7)      // добавляю которые уже в скомпилированном (делать отдельно от "for (const script of document.scripts) ")
                if (modul !== 'C')
                    this.scrpts[modul] = { _isComp: true, _src: '', _orig: 'o7', iready: 1, _loMod: null }

            for (const script of document.scripts) { // перебор описаний скриптов и добавление отсутствующих                
                if (script === document.currentScript) break // этот - д.б. последним

                const c = CurScr(script, this.urlrfs._olga)
                if (c) {
                    const cc = { _isComp: c.isComp, _src: c.src, _orig: c.orig, }
                    if (this.scrpts[c.modul])
                        Object.assign(this.scrpts[c.modul], cc)
                    else
                        this.scrpts[c.modul] = {
                            ...cc,
                            iready: 0,
                            _loMod: new LoMod(c.modul, c.isComp, c.src, ok => this.OnLoadModul(c.modul, ok))
                        }
                }
            }

            for (const modul in this.scrpts)
                Freeze(this.scrpts[modul])
            Object.freeze(this.scrpts)
        }
    };

    /**
     *  этот модуль в скомпилированном д.б. последним - выполниться после всех остальных
     *  а его скрипт должен находиться после всех скриптов в заголовке
     */
    (window.o7 ??= {}).C = new C()


    // отладка - убрать ---------------------------------------------------------
    function OutDebug() {
        const
            C = window.o7.C,
            Fill = (name, modul) => {
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
                const scrpt = C.scrpts[modul],
                    loMod = scrpt?._loMod
                if (loMod) {        // т.е. 
                    const
                        aincls = [],
                        consts = Fill('consts', modul),
                        urlrfs = Fill('urlrfs', modul),
                        src = scrpt._src || '??'

                    for (const incl in loMod.loIncls)
                        aincls.push(`${incl}${loMod.loIncls[incl].done > 0 ? '' : '=false'}`)

                    console.groupCollapsed("%c%s", fmtOK, modul, ` orig='${scrpt._orig}', done= '${loMod.done}', ${src.padEnd(12)}, [${aincls.join(', ')}]`); {
                        console.groupCollapsed(`константы`); {
                            console.table(consts)
                            console.groupEnd()
                        }
                        console.groupCollapsed(`адреса`); {
                            console.table(urlrfs)
                            console.groupEnd()
                        }
                        console.groupEnd()
                    }
                }
                else
                    console.error('%c%s', fmtErr, `? В 'scrpts' нет объекта '${modul}'`)
            }
        const moduls = []
        for (const modul in window.o7)
            moduls.push(modul)

        console.groupCollapsed('%c%s', fmtOK, `API`, moduls.join(', '))

        for (const modul in window.o7) {
            const wshp = window.o7[modul],
                names = []
            for (const name in wshp)
                names.push(name)
            console.log('%c%s', fmtOK, modul.padEnd(6), names.join(', '))
        }
        console.groupEnd()

        console.log('==============================================')
    }
    //-----------------
})();


