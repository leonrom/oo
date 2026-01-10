/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o7 ---    
    'use strict';
    let debug = 1
    const
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;",
        mdebug = true

    class LM {         //  контроль загрузки подмодулей модуля - элелменты Load.incls[] 
        /**
         *  Общий Загрузчик
         *  таймер не нужен - контролируется общим таймером  
         */
        #Fun = null         // функция после загрузки 
        done = false   // завершена/не-требуется загрузка подмодулей
        name = '?'            // условное имя "для протоколу"
        src = '?'            // путь загрузки 

        Done(err = null) {
            if (this.done) return

            this.done = true

            if (this.#Fun && !err) { // иначе callback-функции игнорирутся
                this.#Fun()
                this.#Fun = null
            }

            if (debug)
                console.log(`${this.name} загружен: ${this.src}`)
        }
        LoadScript(time, Fun) {
            if (debug > 1)
                console.log(`Загружаю ${this.name}`)

            if (this.done) return

            this.#Fun = Fun

            script.addEventListener('load', () => this.Done(''), { once: true })
            // не нужно script.addEventListener('error'... -  браузер сам напишет в консоли
            //  не нужно this.#timer = setTimeout(() ... - общий таймер даст список недозагруженных

            const script = document.createElement('script')
            script.src = this.src
            document.head.append(script)
        }
        constructor(name, src) {
            this.name = name
            if (src)
                this.src = src
        }
    }

    class Madd extends LM {         //  контроль загрузки подмодулей модуля - элелменты Load.incls[]        
        constructor(name, src) {
            super(name, src)
        }
    }

    class Load extends LM {        //  контроль загрузки модулей
        static loads = {}       // загрузчики - для каждого модуля
        dataset = {}            // копия из <script>
        // ready = false           // готовность модуля
        madds = []              // надо ли что-то подгружать, и что именно
        modul = ''              // имя модуля в window.o7[
        omod = null             // обратная ссылка на 
        orig = ''               // относительный адрес - для Истории

        constructor(modul, addr) {
            super(modul, addr?.src)
            Object.seal(this)
            // this.orig = orig
            this.modul = modul
            if (addr) {
                this.src = addr.src
                this.orig = addr.orig
            }
            else
                this.done = !!addr

            if (Load.loads[modul])
                console.error('%c%s', this.fmtErr, `Повторная загрузка модуля '${modul}'`, orig)
            else
                Load.loads[modul] = this
        }
        // OnDone(err) {

        // }
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
        CurScr = () => {
            const
                curScript = document.currentScript,
                src = curScript?.src ?? '',
                path = src.replace(/[^/]+$/, ''),
                name = src.match(/([^/]+)\.[^.]+$/)?.[1] ?? '',
                isComp = name[name.length - 1] === '!',
                curScr = {
                    dataset: curScript ? { ...curScript.dataset } : {},
                    src: src,
                    path: path,
                    name: name,
                    isComp: isComp,
                    // modul: isComp ? name.slice(0, name.length - 1) : name
                }
            return curScr
        },
        FillFromScript = (Z, _dataset, _consts) => {  //  здесь Z м.б. W или C, а _dataset, _consts - из C  
            const
                dataset = (Z.load && Z.load.dataset) ? Z.load.dataset : _dataset,
                FromNamedData = name => {      // поиск констант, заявленных в needs
                    const needs = Z[name].needs?.replace(/[^\p{L}\p{N}+.,;_]+/gu, '').split(';') || []
                    for (const need of needs) {
                        const
                            ss = need.split('='),
                            nam = ss[0]
                        if (nam) {
                            Z[name][nam] ??= ss[1]  // не был найден среди name (cobsts или urlrfs)
                            for (const name in dataset)
                                if (nam === name)
                                    Z[name][nam] = dataset[name]
                        }
                    }
                },
                FromCommonData = name => {   // обработка data-consts и data-urlrfs
                    const
                        cnsts = dataset[name]?.split(';') ?? [],
                        isconst = name === 'consts'
                    for (const cns of cnsts) {
                        const
                            ss = cns.split('='),
                            c = ss[0].trim()
                        if (c && c[0] !== '#') {
                            const v = ss[1].trim()
                            if (isconst) Z[name][c] = TryToDigit(v)
                            else
                                if (v && v[0] !== '#')
                                    Z[name][c] = v
                        }
                    }
                }

            for (const name of ['consts', 'urlrfs']) {
                FromCommonData(name)
                FromNamedData(name)
            }

            // "полировка" константами адресной строки
            for (const c in _consts)
                Z['consts'][c] = _consts[c]
        },
        C = new class {
            consts = {
                debug: 0, nomnu: 0, noact: 0, timLoad: 3,
                fmtOK: fmtOK, fmtErr: fmtErr,
                doscr: 'olga5_sdone',
                pageDones: 'beforeunload, o_unloadPage',
                pageLoads: 'readystatechange:d, message:u, inc_ready',
                depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
            }
            #urlcns = {}     // константы из адресной строки
            #curScr = Object.freeze(CurScr())
            #timer = 0 // будет задан и установлен в constructor после FillFromScript

            constructor() {
                const url = new window.URL(window.location)
                this.urlrfs = {
                    _root: url.origin + '/',
                    _olga: this.#curScr.src.match(/\S*\//)?.[0],
                    _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
                }

                // сохраняю константы из адресной строки
                const params = Object.fromEntries(new URLSearchParams(window.location.search))
                for (const nam in params)
                    this.#urlcns[nam] = TryToDigit(params[nam])

                FillFromScript(this, this.#curScr.dataset, this.#urlcns);

                this.#timer = setTimeout(this.Finish, this.consts.timLoad * 1000)
                debug = this.consts.debug
            }
            AddModuleSub(modul, submod, funcs) {
                /**
                 * subscript м.б. либо подгруженным, либо скомпилированным в тело модуля
                 * вызывается еще до фиксации в классе
                 */
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
                            if (omod[name]) errs.push(`Повтор объекта '${name}'`)
                            else
                                omod[name] = funcs.obj
                    }

                if (errs.length)
                    console.error('%c%s', this.fmtErr, `Ошибки добавления субмодуля ${submod} в `, modul, errs)

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
                    if (W.ready) return

                    Object.assign(W, CurScr(), { consts: {}, urlrfs: {}, ready: true })

                    for (const name of ['consts', 'urlrfs']) // копируем из корневого модуля
                        for (const c in C[name])
                            W[name][c] = C[name][c]

                    FillFromScript(W, this.#curScr.dataset, this.#urlcns)
                    Object.freeze(W)
                }

                Load.loads[modul].done = true

                let ready = true
                for (const modul in Load.loads)
                    if (modul !== 'C' && !Load.loads.done) {
                        ready = false
                        break
                    }
                if (ready) 
                    Finish()                

                // load.Done()     // уже не нужно (будет проверяться W.ready), но для порядку
                // информация для запускальщика программ инициализации модулей
                const e = new CustomEvent('o_modulLoad', modul ? { detail: { modul: modul } } : {})
                window.dispatchEvent(e)
            }
            OnLoadIncl(modul) {
                for (const madd of Load.loads[modul].madds)
                    if (!madd.done)    //finalized
                        return

                C.RegisterModul(modul)
            }
            OnLoadModul(modul) {
                const
                    W = window.o7[modul]?.W,
                    load = Load.loads[modul]

                if (!W) {
                    const fs = [], ms = []
                    for (const name in Load.loads) fs.push((name))
                    for (const name in window.o7) ms.push((name))
                    console.error('%c%s', this.fmtErr, `Отсутствует добавляемый модуль '${modul}'  `,
                        `(несовпадение имен файла и W.modul ?)`,
                        `\n\t файлы : ` + fs.join(', '),
                        `\n\t модули: ` + ms.join(', '),
                    )
                    return
                }

                if (W.isComp || !W.incls)    // C.DispatchEvent('o_modulLoad', modul)
                    C.RegisterModul(modul)
                else {
                    const
                        path = C.urlrfs._olga + modul + '/',
                        lname = load.name

                    for (const incl of W.incls) {
                        const madd = new Madd(`${lname}.${incl}`, path + incl + '.js')
                        load.madds.push(madd)
                        madd.LoadScript(C.consts.timLoad, () => C.OnLoadIncl(modul))
                    }
                }

                if (debug > 2) {
                    const orig = Load.loads[modul].orig
                    console.log('%c%s', fmtOK, orig ? `загружен из ${orig} ` : `взят из 'o7'`,
                        load.madds.length ? `подмодули: ${load.madds.map(m => m.name).join(', ')}` : `без подмодулей`
                    )
                }
            }

            Finish() {
                if (this.#timer)
                    clearTimeout(this.#timer)

                if (C.consts.debug > 1)
                    OutDebug()

                const errs = []
                for (const modul in Load.loads) {
                    const load = Load.loads[modul]
                    if (load.done) {
                        const ers = []
                        for (const madd of load.madds)
                            if (!madd.done)
                                ers.push(madd.name)
                        errs.push(modul + ers.length ? ` [${ers.join(', ')}]` : ``)
                    }
                    load.madds.length=0
                    delete (load)
                }

                if (errs.length > 0)
                    console.error('%c%s', fmtOK, `Незавершены загрузки: `, errs.join('; '))
                else
                    if (debug)
                        console.log('%c%s', fmtOK, `Загружены все модули !`)
            }
        };

    /**
     *  этот модуль в скомпилированном д.б. последним - выполниться после всех остальных
     *  а его скрипт должен находиться после всех скриптов в заголовке
     */
    (window.o7 ??= {}).C = C

    // в load добавляю модули, которые уже находятся в скомпилированном
    for (const modul in window.o7)
        new Load('o7?', modul)

    // перебор всех описаний скриптов и создание load  если не был добавлен
    // Загрузчики - одноразовые, повторные вызовы не поддерживаются
    for (const script of document.scripts) {
        if (script === document.currentScript) break // этот - д.б. последним

        const orig = script.dataset?.src?.trim()
        if (!(orig && orig[0] === '+')) continue

        const
            name = orig.substring(1),
            src = C.urlrfs._olga + name,
            modul = orig.match(/[^\/ +]+(?=\.[^.]*$)/)[0],
            load = Load.loads[modul] ||
                new Load(modul, { src, orig })

        for (const [key, val] of Object.entries(script.dataset))
            load.dataset[key] = val
    }

    for (const modul in Load.loads) {
        const load = Load.loads[modul]
        if (load.done)
            C.OnLoadModul(modul)    // после копиравания соотв. dataset
        else
            if (load.src)
                load.LoadScript(C.consts.timLoad, () => C.OnLoadModul(modul))
    }

    // отладка - убрать ---------------------------------------------------------
    function OutDebug() {
        const Fill = (name, omod) => {
            const arr = [],
                aomod = omod.W[name]
            if (!aomod)
                console.error(`? нету aomod для '${name}'`)
            else
                for (const [key, val] of Object.entries(aomod))
                    arr.push({ key, val })
            return arr
        }
        for (const modul in window.o7)
            if (modul !== 'C') {
                const
                    omod = window.o7[modul],
                    load = Load.loads[modul]
                if (load) {
                    const
                        consts = Fill('consts', omod),
                        urlrfs = Fill('urlrfs', omod),
                        src = omod.W?.dataset?.src || '??'
                    console.groupCollapsed("%c%s", fmtOK, modul,
                        load.madds.map(m => m.name).join(', '),
                        `\n\t  W...src= ${src.padEnd(12)}, done= '${load.done}', orig='${load.orig}'`
                    )
                    console.table(consts)
                    console.table(urlrfs)
                    console.groupEnd()
                }
                else
                    console.error(`? нету load для '${modul}'`)
            }
        console.log('==============================================')
    }

})();