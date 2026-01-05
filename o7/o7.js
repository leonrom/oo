/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o7 ---    
    'use strict';
    const dones = Object.freeze({ init: 'init', load: 'load', done: 'done' }),
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;",
        mdebug = true

    class LM {         //  контроль загрузки подмодулей модуля - элелменты Load.incls[]   
        #timer = 0           // таймаут загрузки если madds=\ null      
        #done = dones.init   // завершена/не-требуется загрузка подмодулей
        #Fun = null         // функция после загрузки
        src = '?'            // путь загрузки 
        Done(err = null) {
            //два madd.Done() прилетят почти одновременно или или Done() вызван по timeout, а потом по load
            if (this.#done === dones.done)
                return false

            this.#done = dones.done

            if (this.#timer) {
                clearTimeout(this.#timer)
                this.#timer = 0
            }

            if (this.#Fun && !err)  // иначе callback-функции игнорирутся
                this.#Fun()
            this.#Fun = null

            if (err)
                console.error('%c%s', fmtErr, `'${this.name}': ${err} `, ` (src: ${this.src})`);
            else
                if (mdebug)
                    console.log('%c%s', fmtOK, `загружен: ${this.name}`, this.src)
            return true
        }
        StartLoad(script, time, Fun) {

            if (mdebug)
                console.log('%c%s', fmtOK, `StartLoad`, this.src)
            let err = ''

            if (typeof Fun === 'function')
                this.#Fun = Fun
            else {
                const type = typeof Fun
                if (type !== 'undefined')
                    err += `Fun (${type}) не 'function' для "${this.src}"; `
            }
            if (this.#done === dones.init) {

                this.#done = dones.load
                this.#timer = setTimeout(() => { this.Done(`? таймаут`) }, time * 1000)

                if (script) {
                    script.addEventListener('load', () => this.Done(null), { once: true })
                    script.addEventListener('error', () => this.Done('? ошибка загрузки'), { once: true })

                    script.src = this.src
                }
            }
            else
                err += `Повтор (загрузки скрипта) при #done /='init' для "${this.src}"`

            if (err)
                console.log("%c%s", fmtErr, err)
        }
        get done() {
            return this.#done
        }
    }

    class Madd extends LM {         //  контроль загрузки подмодулей модуля - элелменты Load.incls[]
        name = '?'              // как оно называется для  console.error
        constructor(name, src) {
            super()
            this.name = name
            if (src)
                this.src = src
        }
    }

    class Load extends Madd {        //  контроль загрузки модулей
        static _loads = {}      // загрузчики - для каждого модуля
        dataset = {}            // копия из <script>
        madds = []              // надо ли что-то подгружать, и что именно
        modul = ''              // имя модуля в window.o7[
        omod = null             // обратная ссылка на 
        orig = ''               // модуль дозагружался если orig=\'' и "другое имя файла"                

        constructor(name, orig, modul) {
            super(name)
            this.orig = orig
            this.modul = modul

            Load._loads[modul] = this
        }
    }

    const
        IsUnDefined = c => typeof c === 'undefined',
        _CurScr = script => {
            const
                src = script?.src ?? '',
                path = src.replace(/[^/]+$/, ''),
                name = src.match(/([^/]+)\.[^.]+$/)?.[1] ?? '',
                isComp = name[name.length - 1] === '!',
                curScr = {
                    dataset: script ? { ...script.dataset } : {},
                    src: src,
                    path: path,
                    name: name,
                    isComp: isComp,
                    modul: isComp ? name.slice(0, name.length - 1) : name
                }
            return curScr
        },
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
        C = new class { // border: solid 2px red;
            consts = {
                debug: 0,
                nomnu: 0,
                noact: 0,
                timLoad: 3,
                fmtOK: fmtOK,
                fmtErr: fmtErr,
                doscr: 'olga5_sdone',
                pageDones: 'beforeunload, o_unloadPage',
                pageLoads: 'readystatechange:d, message:u, inc_ready',
                depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
            }

            #consts = {}     // константы из адресной строки
            #curScr = Object.freeze(_CurScr(document.currentScript))

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
                    this.#consts[nam] = TryToDigit(params[nam])
            }
            DispatchEvent(eve, modulx, canrep) {
                if (mdebug && !canrep) {
                    console.groupCollapsed(`DispatchEvent: '${eve}' ${modulx ? (' из  ' + modulx) : ''} `)
                    console.trace()
                    console.groupEnd()
                }
                const modul = modulx ? modulx : '',
                    e = new CustomEvent(eve, modul ? { detail: { modul: modul } } : {})
                window.dispatchEvent(e)
            }
            FillFromScript(Z) {
                const
                    dataset = (Z.load && Z.load.dataset) ? Z.load.dataset : this.#curScr.dataset,
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
                    if (Z !== C) { // копируем из корневого модуля
                        for (const c in C[name])
                            Z[name][c] = C[name][c]
                    }
                    FromCommonData(name)
                    FromNamedData(name)
                }

                // "полировка" константами адресной строки
                for (const c in this.#consts)
                    Z['consts'][c] = this.#consts[c]

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

                if (mdebug) {
                    const names = Array.isArray(funcs)
                        ? funcs.map(f => f.name)
                        : [funcs.name];
                    console.log(`подключён ${modul}.${submod}: ${names.join(',')}`)
                }

                return omod
            }
            AddModule(W) {
                const
                    modul = W.modul,
                    omod = window.o7[modul],
                    load = Load._loads[modul],
                    madds = load.madds,
                    CheckFinish = () => {
                        let alldone = true       // проверка,- а вдруг уже всё подмодули загружены
                        for (const madd of load.madds)
                            if (madd.done !== dones.done) {
                                alldone = false
                                break
                            }

                        if (alldone) {      // информация для запускальщика программ инициализации модулей
                            if (load.Done())
                                C.DispatchEvent('o_modulLoad', load.modul)
                        }
                    }

                // load.Done()         // done = dones.done

                omod.W = W
                this.FillFromScript(W)
                Object.freeze(W)

                if (W.isComp || !W.incls)   // C.DispatchEvent('o_modulLoad', modul)
                    load.Done()
                else {
                    const
                        curScript = document.currentScript,
                        parentNode = curScript.parentNode

                    for (const incl of W.incls) {
                        const
                            src = W.path + modul + '/' + incl + '.js',
                            name = `${modul}.${incl}`,
                            madd = new Madd(name, src),
                            script = document.createElement('script')

                        madds.push(madd)
                        if (parentNode)
                            parentNode.insertBefore(script, curScript)

                        madd.StartLoad(script, C.consts.timLoad, CheckFinish)
                    }
                }
                if (mdebug) {
                    const orig = Load._loads[modul].orig
                    console.log('%c%s', fmtOK, orig ? `загружен из ${orig} ` : `взят из 'o7'`,
                        madds.length ? `подмодули: ${madds.map(m => m.name).join(', ')}` : `без подмодулей`
                    )
                }

                return omod
            }

            CurScr(script) {
                const curScr = _CurScr(script)
                curScr.consts = {}
                curScr.urlrfs = {}
                return Object.freeze(curScr)
            }
        },
        LoadModules = function () {
            for (const script of document.scripts) {
                const orig = script.dataset.src.replace((/\s+/g, ''))
                if (orig && orig[0] === '+') {
                    const
                        f = orig.slice(orig.lastIndexOf('/') + 1, orig.lastIndexOf('.')),
                        compiled = f[f.length - 1] === '!',
                        fnam = (f[0] === '+') ? f.substring(1) : f,
                        modul = compiled ? fnam.slice(0, fnam.length - 1) : fnam,
                        name = `модуль '${modul}'`,
                        load = new Load(name, orig, modul)

                    for (const [key, val] of Object.entries(script.dataset))
                        load.dataset[key] = val

                    let omod = window.o7[modul]
                    if (omod) { //  уже есть в (частично) скомпилир., только дополнить его dataset'ы
                        load.src = script.src
                        load.omod = omod
                        load.Done()
                    } else {
                        load.src = C.urlrfs._olga + orig.substring(1)
                        load.omod = window.o7[modul] = {}
                        load.StartLoad(script, C.consts.timLoad)
                    }
                }
            }
        }

    window.o7 = { C }

    C.FillFromScript(C);

    //   вызов LoadModules только после парсинга скриптов - т.е. после загрузки документа  
    (fn => {
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();
    })(LoadModules);       //  загрузка подключаемых скриптов

    // отладка - убрать ---------------------------------------------------------
    if (mdebug)
        setTimeout(
            () => {
                const Fill = (name, omod) => {
                    const arr = [],
                        aomod = omod.W[name]
                    for (const [key, val] of Object.entries(aomod))
                        arr.push({ key, val })
                    return arr
                }
                for (const modul in window.o7)
                    if (modul !== 'C') {
                        const
                            omod = window.o7[modul],
                            load = Load._loads[modul]
                        if (load) {
                            const
                                consts = Fill('consts', omod),
                                urlrfs = Fill('urlrfs', omod)
                            console.groupCollapsed("%c%s", fmtOK, load.name,
                                load.madds.map(m => m.name).join(', '),
                                `\n\t  W...src= ${omod.W.dataset.src.padEnd(12)}, done= '${load.done}', orig='${load.orig}'`
                            )
                            console.table(consts)
                            console.table(urlrfs)
                            console.groupEnd()
                        }
                        else
                            console.error(`? нету load для '${modul}'`)
                    }
                console.log('==============================================')
            },
            2222
        )

})();