/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
(function () {              // ---------------------------------------------- o7 ---    
    'use strict';
    const dones = { init: 'init', load: 'load', done: 'done' },
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;",
        mdebug = true

    class LM {         //  контроль загрузки подмодулей модуля - элелменты Load.incls[]        
        done = dones.init   // завершена/не-требуется загрузка подмодулей
        timer = 0           // таймаут загрузки если madds=\ null 
        error = '?'          // т.е. пока хз
        load = null          // кому принадлежит
        name = '?'           // как оно называется для  console.error
        src = '?'            // путь загрузки 
        Fun                  // функция после загрузки
        Done(err = null) {
            this.error = err
            this.done = dones.done

            if (this.timer) {
                clearTimeout(this.timer)
                this.timer = 0
            }

            if (this.Fun)
                this.Fun()

            if (err)
                console.error('%c%s', fmtErr, `'${this.name}': ${err} `, ` (src: ${this.src})`);
            else
                if (mdebug)
                    console.log('%c%s', fmtOK, `загружен: ${this.name}`, this.src)
        }
        StartLoad(src, script, time, Fun) {

            if (mdebug)
                console.log('%c%s', fmtOK, `StartLoad`, src)

            this.Fun = Fun
            this.done = dones.load
            this.timer = setTimeout(() => { this.Done(`? таймаут`) }, time * 1000)

            script.addEventListener('load', () => this.Done(null), { once: true })
            script.addEventListener('error', () => this.Done('? ошибка загрузки'), { once: true })

            script.src = src
        }
        constructor(mds) {
            for (const md in mds)
                if (md in this)
                    this[md] = mds[md]

            this.load?.madds.add(this)
        }
    }

    class Madd extends LM {         //  контроль загрузки подмодулей модуля - элелменты Load.incls[]
        StartLoad(src, script, time) {
            const madds = this.load.madds
            super.StartLoad(src, script, time, () => {
                let
                    alldone = true       // проверка,- а вдруг уже всё подмодули загружены

                for (const madd of madds)
                    if (madd.done !== dones.done) {
                        alldone = false
                        break
                    }

                if (alldone) {      // информация для запускальщика программ инициализации модулей
                    // text = ''
                    this.load.done = dones.done
                    clearTimeout(this.load.timer)
                    this.load.timer = 0
                    C.DispatchEvent('o_modulLoad', this.load.W.modul)
                }
            })
        }

        constructor(mds) {
            super(mds)
            Object.seal(this)
            for (const md in mds)
                this[md] = mds[md]
        }
    }

    class Load extends LM {        //  контроль загрузки модулей
        madds = new Set()   // надо ли что-то подгружать, и что именно
        orig = ''           // модуль дозагружался если orig=\'' и "другое имя файла"                
        W = null            // признак, что уже загружена основная часть модуля            
        constructor(mds) {
            super(mds)
            Object.seal(this)
            for (const md in mds)
                this[md] = mds[md]
        }
    }

    const
        IsUnDefined = c => typeof c === 'undefined',
        CurScr = script => {
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
            return Object.freeze(curScr)
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
                fmtErr: fmtErr,
                fmtOK: fmtOK,
                timLoad: 3,
                debug: 0,
                nomnu: 0,
                noact: 0,
                doscr: 'olga5_sdone',
                depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
                pageLoads: 'readystatechange:d, message:u, inc_ready',
                pageDones: 'beforeunload, o_unloadPage',
            }

            #consts = {}     // константы из адресной строки
            #curScr = CurScr(document.currentScript)

            constructor() {
                const url = new window.URL(window.location)
                this.urlrfs = {
                    _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
                    _root: url.origin + '/',
                    _olga: this.#curScr.src.match(/\S*\//)?.[0]
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
            FillFromScript(consts, urlrfs, dtst) {
                const
                    // chgs = [],
                    // adds = [],
                    dataset = dtst ? dtst : this.#curScr.dataset
                // AddFromDataset = dates => {
                //     const needs = dates.needs?.replace(/[^\p{L}\p{N}+.,;_]+/gu, '').split(';') || []
                //     for (const need of needs)
                //         if (need) {
                //             const
                //                 ss = need.split('='),
                //                 nam = ss[0]
                //             if (nam)
                //                 dates[nam] = ss[1] || 1
                //         }
                // }

                // !!! исправить !!! !!! исправить !!! !!! исправить !!! !!! исправить !!! !!! исправить !!! !!! исправить !!! !!! исправить !!!
                if (consts) {
                    if (consts !== C.consts) // копируем из корневого модуля
                        for (const c in C.consts)
                            consts[c] = C.consts[c]

                    // обработка data-consts (список констант)
                    const cnsts = dataset.consts?.split(';') ?? []
                    for (const cns of cnsts) {
                        const ss = cns.split('='),
                            c = ss[0].trim()
                        if (c)
                            // IsUnDefined(consts[c])?adds.push(c):chgs.push(c)
                            consts[c] = TryToDigit(ss[1].trim())
                    }
                    // // обработка дополнительных констант
                    // AddFromDataset(consts)
                }

                if (urlrfs) {
                    const urlrs = dataset.urlrfs?.split(';') ?? []
                    // обработка data-urlrfs
                    for (const cns of urlrs) {
                        const ss = cns.split('='),
                            c = ss[0].trim()
                        if (c)
                            if (c[0] === '_' && urlrfs !== C.urlrfs)
                                errs.push(c)
                            else
                                urlrfs[c] = ss[1].trim()
                    }
                    // // обработка дополнительных url'ов
                    // AddFromDataset(urlrfs)
                }

                // обработка data-<имя константы>
                for (const name in dataset)
                    if (name !== 'consts' && name !== 'urlrfs') {
                        const
                            isurl = name[0] === '_',
                            c = isurl ? name.substring(1) : name
                        if (isurl && urlrfs)

                            consts[c] = TryToDigit(dataset[c])
                    }

                // "полировка" константами адресной строки
                if (consts)
                    for (const c in this.#consts)
                        consts[c] = this.#consts[c]

                // if (errs.length) {
                //     const fn = this.#curScr.src.split('/').pop()
                //     console.error("%c%s", this.fmtErr, `'${fn}': замена системных параметров`, errs.join(', '))
                // }
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
                        if (!name)
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
                    load = omod.load

                load.W = W
                load.done = dones.done

                omod.W = W
                this.FillFromScript(W.consts, W.urlrds, W.dataset)

                if (W.isComp || !W.incls) C.DispatchEvent('o_modulLoad', modul)
                else {
                    const
                        curScript = document.currentScript,
                        parentNode = curScript.parentNode
                    for (const incl of W.incls) {
                        const
                            src = W.path + modul + '/' + incl + '.js',
                            name = `${modul}.${incl}`,
                            madd = new Madd({ src, name, load }),
                            script = document.createElement('script')

                        if (parentNode)
                            parentNode.insertBefore(script, curScript)
                        madd.StartLoad(src, script, C.consts.timLoad,)
                    }
                }
                if (mdebug) {
                    const orig = omod.load.orig
                    console.log('%c%s', fmtOK, orig ? `загружен из ${orig} ` : `взят из 'o7'`,
                        load.madds.size ? `подмодули: ${Object.keys(load.madds).join(', ')}` : `без подмодулей`
                    )
                }

                return omod
            }
            CurScr = CurScr
        },
        LoadModules = function () {
            for (const script of document.scripts) {
                const orig = script.dataset.src
                if (orig && orig[0] === '+') {
                    const
                        f = orig.slice(orig.lastIndexOf('/') + 1, orig.lastIndexOf('.')),
                        compiled = f[f.length - 1] === '!',
                        fnam = (f[0] === '+') ? f.substring(1) : f,
                        modul = compiled ? fnam.slice(0, fnam.length - 1) : fnam,
                        name = `модуль '${modul}'`

                    let omod = window.o7[modul]
                    if (omod) { //  уже есть в (частично) скомпилир., только дополнить его dataset'ы
                        const dataset = omod.W.dataset
                        for (const [key, val] of Object.entries(script.dataset))
                            dataset[key] = val

                        omod.load = new Load({ src: orig, orig: '', name, done: dones.done })
                    } else {
                        const
                            src = C.urlrfs._olga + orig.substring(1),
                            load = new Load({ src, orig, name, done: dones.load, })

                        window.o7[modul] = { load }
                        load.StartLoad(src, script, C.consts.timLoad)

                        script.src = src        // ! после load.StartLoad
                    }
                }
            }
        }
    /**
     *          варианты загрузки модуля, где 'xxx' - имя модуля
     *                      проверка в AddModule(W)
     * data-src = xxx.js    есть timer              | надо дозагружыть
     * data-src = xxx!.js   -"-                     | не надо
     * src = xxx.js         нету timer              | надо дозагружыть
     * src = xxx!.js        -"-                     | не надо
     * в составе o7c!.js    W.cls.curScript=C.cls.curScript | не надо , проверка в #AddScrpt
    */

    window.o7 = { C }

    /**
     *  параметры вызова скрипта
     */
    C.FillFromScript(C.consts, C.urlrfs);

    /**
     *   вызов LoadModules только после парсинга скриптов - т.е. после загрузки документа 
     */
    (fn => {
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();
    })(LoadModules);       //  загрузка подключаемых скриптов

    if (mdebug)
        setTimeout(
            () => {
                for (const modul in window.o7)
                    if (modul !== 'C') {
                        const
                            omod = window.o7[modul],
                            load = omod?.load,
                            madds = load.madds,
                            consts = [],
                            urlrfs = [],
                            Fill = nam => {
                                if (load[nam])
                                    for (const [key, val] of Object.entries(load[nam]))
                                        [nam].push(`${key}:${val}`)
                            }

                        if (load) {
                            // Fill('madds')
                            Fill('consts')
                            Fill('urlrfs')

                            if (omod.W?.consts)
                                for (const [key, val] of Object.entries(omod.W.consts))
                                    consts.push(`${key}:${val}`)

                            console.log(`${modul.padEnd(12)}: [${Array.from(madds).map(m => m.name).join(', ')}]`,
                                `\n\t  timer=${load.timer}, done='${load.done}', orig='${load.orig}'`,
                                `\n\t  ${omod.W.dataset.src.padEnd(12)} `,
                                // `\n\t  ${wshp.W.cls.curScr.dataset.src.padEnd(12)} `,  // ${scrpt.parse.src}
                                `\n\t  consts=${consts.join(', ')}`,
                                `\n\t  urlrfs=${urlrfs.join(', ')}`
                            )
                        }
                    }
                console.log('==============================================')
            },
            2222
        )

})();