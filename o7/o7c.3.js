(function () {              // ---------------------------------------------- o7 ---
    'use strict';
    const
        dones={init:'init', load:'load', done:'done', err:'err'},
        AddScrpt = () => {  // структура контроля загрузки модуля
            const scrpt = Object.seal({
                parse: null,      // script который будет парситься для параметров
                msubs: null,        // надо ли что-то подгружать, и что именно
                timer: 0,           // таймаут загрузки если msubs=\ null
                done: dones.init,          // завершена/не-требуется загрузка подмодулей
                orig: '',           // модуль дозагружался если orig=\'' и "другое имя файла"
                err: '',
                fn: '',
                W: null,               // признак, что уже загружена основная часть модуля
            })
            return scrpt
        },
        ReadyModule = wshp => {
             if (wshp.scrpt.done===dones.done){   // уже нет незагруженных модулей (иначе см. AddModuleSub)
            C.DispatchEvent('o_modulLoad', wshp.W.cls.modul)}
        },
        IsCompiled = src => {
            const fn = src.slice(src.lastIndexOf('/')+1, src.lastIndexOf('.'))
            if (fn[0] === '!') return -1                // файл только для парсинга (нафига оно мне ?)
            if (fn[fn.length - 1] === '!') return 1     // скомпилированный файл
            return 0                                    // будем догружать
        },
        ParseModulSrc = src => {
            const
                fn = src.substring(src.lastIndexOf('/')),
                f = fn.slice(0, fn.lastIndexOf('.')),
                compiled=IsCompiled(f)>0,
                name=(f[0]==='+')?f.substring(1):f,
                modul=compiled?name.slice(0, name.length-1) : name

            return { modul, compiled , fn }
        },
        IsUnDefined = c => {
            return typeof c === 'undefined'
        },
        C = new class {
            fmtOK = "background: cornsilk; color: black;"
            fmtErr = "background: yellow; color: black;"    // border: solid 2px red;
            repQuotes = /^\s*((\\')|(\\")|(\\`)|'|"|`)?\s*|\s*((\\')|(\\")|(\\`)|'|"|`)?\s*$/g

            consts = Object.seal({
                timLoad: 3,
                debug: 0,
                nomnu: 0,
                noact: 0,
                doscr: 'olga5_sdone',
                depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
                pageLoads: 'readystatechange:d, message:u, inc_ready',
                pageDones: 'beforeunload, o_unloadPage',
            })

            cls = {}
            wconsts = {}        // дополнительные константы
            url_consts = {}

            constructor() {
                const
                    m = window.location.search.match(/(?:\?|&)debug(?:=([^&?]*))?(?=[&?]|$)/),
                    errs = [],
                    curScript = document.currentScript,
                    url = new window.URL(window.location),
                    path = curScript.src.match(/\S*\//)[0],
                    params = Object.fromEntries(new URLSearchParams(window.location.search))

                this.consts.debug = !m ? 0 : (m[1] === undefined || m[1] === "") ? 1 : (isNaN(+m[1]) ? 3 : +m[1])

                this.urlrfs = {
                    _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
                    _root: url.origin + '/',
                    _olga: curScript.src.match(/\S*\//)?.[0]
                }

                Object.assign(this.cls, Object.freeze({
                    path: path,
                    curScript: curScript,
                    compiled: IsCompiled(path),
                }))

                // сохраняю константы из адресной строки
                for (const nam in params)
                    if (IsUnDefined(this.consts[nam])) errs.push(nam)
                    else {
                        const v = this.TryToDigit(params[nam])
                        this.url_consts[nam] = v
                        this.wconsts[nam] = v
                    }
                if (errs.length && this.consts.debug)
                    console.log('%c%s', this.fmtErr, `Адресная строка`, `неопр. параметры: ${errs.join(', ')}.`)
            }
            Repname(name) {
                return name.trim().replaceAll('-', '_').toLowerCase()
            }
            TryToDigit(x) {
                if (IsUnDefined(x)) return 1		// true
                if (x === !!x) return x

                const val = ('' + x).replace(this.repQuotes, '')
                switch (val) {
                    case '': return 1
                    case 'true': return true
                    case 'false': return false
                    default: {
                        let v;
                        if ((v = parseInt(val)) == val) return v
                        if ((v = parseFloat(val)) == val) return v

                        const rez = val.replace(/\s*;\s*\n+\s*/g, ';').replace(/\s*\n+\s*/g, ';')
                        return rez.replace(/\t+/g, ' ').trim()
                    }
                }
            }
            DispatchEvent(eve, modulx, canrep) {
                if (this.consts.debug > 1 && !canrep) {
                    console.groupCollapsed(`DispatchEvent: '${eve}' ${modulx ? (' из  ' + modulx) : ''} `)
                    console.trace()
                    console.groupEnd()
                }
                const modul = modulx ? modulx : '',
                    e = new CustomEvent(eve, modul ? { detail: { modul: modul } } : {})
                window.dispatchEvent(e)
            }
            FillFromScript(wc) {
                const errs = [],
                    script = wc.cls.curScript,
                    consts = wc.consts,
                    urlrfs = wc.urlrfs,
                    AddFromDataset = dates => {
                        const needs = dates.needs?.replace(/[^\p{L}\p{N}+.,;_]+/gu, '').split(';') || []
                        for (const need of needs)
                            if (need) {
                                const ss = need.split('='), nam = ss[0]
                                if ((nam))
                                    dates[nam] = ss[1] || 1
                            }
                    }

                if (consts) {
                    const cnsts = script.dataset.consts?.split(';') ?? []
                    // обработка data-consts (список констант)
                    for (const cns of cnsts) {
                        const ss = cns.split('='),
                            c = ss[0].trim()
                        if (c)
                            if (!IsUnDefined(consts[c]) && consts !== C.consts)
                                errs.push(c)
                            else
                                if (!this.url_consts[c])
                                    consts[c] = this.TryToDigit(ss[1].trim())
                    }

                    // обработка data-<имя константы>
                    for (const name in script.dataset)
                        if (name !== 'consts' && name !== 'urlrfs')
                            consts[name] = script.dataset[name]

                    // обработка дополнительных констант
                    AddFromDataset(consts)
                }

                if (urlrfs) {
                    const urls = script.dataset.urlrfs?.split(';') ?? []
                    // обработка data-urlrfs
                    for (const cns of urls) {
                        const ss = cns.split('='),
                            c = ss[0].trim()
                        if (c)
                            if (c[0] === '_' && urlrfs !== C.urlrfs)
                                errs.push(c)
                            else
                                urlrfs[c] = ss[1].trim()
                    }

                    // обработка дополнительных url'ов
                    AddFromDataset(urlrfs)
                }
                if (errs.length) {
                    const fn = script.src.split('/').pop()
                    console.error("%c%s", this.fmtErr, `'${fn}': замена системных параметров`, errs.join(', '))
                }
            }
            AddModuleSub(modul, submod, funcs) {
                /**
                 * subscript м.б. либо подгруженным, либо скомпилированным в тело модуля
                 */
                const
                    wshp = window.olga7[modul] ??= { scrpt: AddScrpt() },
                    scrpt = wshp.scrpt,
                    errs = []

                if (wshp[submod])
                    errs.push(`Повтор подгрузки '${modul}/${submod}'`)

                scrpt.msubs ??= {}

let msub = scrpt.msubs[submod]
                if (msub) {   // был ранее создан в AddModule
                    if (!IsUnDefined(msub.timer))
                        clearTimeout(msub.timer)
                    msub.timer = 0
                }
                else
                    msub = scrpt.msubs[submod] = { timer: 0 }  // таймер не нужен

                if (scrpt.done === dones.load) {  // обрабатывается только после загрузки модуля!
                    scrpt.done = dones.done       // проверка,- а вдруг уже всё подмодули загружены
                    for (const nam in scrpt.msubs)
                        if (scrpt.msubs[nam].timer) {
                            scrpt.done = dones.err
                            break
                        }
                }

                if (funcs)  // м.б. либо объект {name, obj}, либо массивом функций [f1, f2...]  
                    if (Array.isArray(funcs)) {
                        for (const func of funcs) {
                            const name = func.name
                            if (msub[name]) errs.push(`Повтор функции '${name}'`)
                            else
                                msub[name] = func
                        }
                    }
                    else {
                        const name = funcs.name
                        if (!name) errs.push(`В объекте отсутствует 'name'`)
                        else
                            if (msub[name]) errs.push(`Повтор объекта/функции '${name}'`)
                            else
                                msub[name] = funcs.obj
                    }

                if (this.consts.debug) {
                    const names = Array.isArray(funcs)
                        ? funcs.map(f => f.name)
                        : [funcs.name];
                    console.log(`подключён ${modul}.${submod}: ${names.join(',')}`)
                }
                if (errs.length)
                    console.error('%c%s', this.fmtErr, `Ошибки добавления субмодуля ${submod} в `, W.cls.modul, errs)

                    ReadyModule(wshp)
                return wshp
            }
            AddModule(W) {
                const
                    modul = W.cls.modul,
                    wshp = window.olga7[modul] ??= { scrpt: AddScrpt() },
                    scrpt = wshp.scrpt

                if (scrpt.timer)
                    clearTimeout(scrpt.timer)

                scrpt.W = W
                scrpt.fn = W.cls.curScript.src
                scrpt.timer = 0
                scrpt.done = dones.done  // пока считаем что вроде бы закончил загрузку

                if (!scrpt.parse)   // не был задан в LoadModules
                    scrpt.parse = W.cls.curScript

                wshp.W = W
                this.FillFromScript(W)

                if (W.incls && !ParseModulSrc(scrpt.fn).compiled) {
                    scrpt.msubs ??= {}
                    for (const incl of W.incls) {
                        const msub = scrpt.msubs[incl] ??= {}
                        if (IsUnDefined(msub.timer)) {
                            scrpt.done = dones.load     // выяснил, что НЕ закончил загрузку
                            if (scrpt.iscomp)           // ждем, когда "выстрелит" в этом модуле
                                msub.timer = setTimeout(
                                    (scrpt, modul, incl) => {
                                        if (!scrpt.W) {
                                            scrpt.err = `Таймаут поиска подмодуля '${incl}'`
                                            console.error('%c%s', this.fmtErr, `${scrpt.err}`, ` в модуле ${modul}`);
                                        }
                                    },
                                    this.consts.timLoad * 1000
                                )
                            else {
                                const
                                    script = document.createElement('script'),
                                    src = W.cls.path + modul + '/' + incl + '.js'
                                msub.timer = StartLoad(script, scrpt, src, ` sub='${modul}/${incl}'`)
                                script.src = src
                            }
                        }
                    }
                }

                    ReadyModule(wshp)

                if (wshp && wshp.load > 0)
                    console.error('%c%s', this.fmtErr, `Повтор подключения модуля в  ${modul}`)

                if (this.consts.debug) {
                    console.log(`${scrpt.orig ? 'подставлен' : 'загружен  '}:  ${scrpt.fn}`,
                        scrpt.msubs ? `подмодули: ${Object.keys(scrpt.msubs).join(', ')}` : `без подмодулей`
                    )
                }

                return wshp
            }
        },
        StartLoad = function (script, scrpt, src, text) {
            const timer = setTimeout(() => {
                // if (scrpt.timer) {
                scrpt.err = `Таймаут загрузки модуля`
                console.error('%c%s', C.fmtErr, `${scrpt.err}`, ` ${text} (src: ${src})`);
            }, C.consts.timLoad * 1000);

            script.onerror = e => {
                scrpt.err = `Ошибка загрузки`
                // не нужно:  console.error('%c%s', C.fmtErr, `${scrpt.err}`, ` ${text} (src: ${src})`);
            }

            script.src = src

            return timer
        },
        LoadModules = function () {
            for (const script of document.scripts) {
                const orig = script.dataset.src
                if (orig && orig[0] === '+') {
                    const
                        md = ParseModulSrc(orig),
                        wshp = window.olga7[md.modul] ??= { scrpt: AddScrpt() },
                        scrpt = wshp.scrpt

                    scrpt.orig = orig
                    scrpt.parse = script

                    if (!C.cls.compiled) {      // а вот по 'refonly'  - не проверяю
                        scrpt.orig = orig
                        if (!scrpt.timer) {
                            const src = C.urlrfs._olga + orig.substring(1)
                            scrpt.timer = StartLoad(script, script, src, ` модуль '${md.modul}'`)
                        }
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

    window.olga7 ??= {}
    window.olga7.C = C // объект 'C' отличается от модулей отсутствием поля 'W'

    /**
     *  параметры вызова скрипта
     */
    C.FillFromScript(C);

    /**
     *   вызов LoadModules только после парсинга скриптов - т.е. после загрузки документа 
     */
    (fn => {
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();
    })(LoadModules);       //  загрузка подключаемых скриптов

    if (C.consts.debug > 2)
        setTimeout(
            () => {
                for (const modul in window.olga7) {
                    const
                        wshp = window.olga7[modul],
                        scrpt = wshp?.scrpt,
                        msubs = [],
                        consts = [],
                        urlrfs = [],
                        Fill = nam => {
                            if (scrpt[nam])
                                for (const [key, val] of Object.entries(scrpt[nam]))
                                    [nam].push(`${key}:${val}`)
                        }

                    if (scrpt) {
                        Fill('msubs')
                        Fill('consts')
                        Fill('urlrfs')

                        if (wshp.W?.consts)
                            for (const [key, val] of Object.entries(wshp.W.consts))
                                consts.push(`${key}:${val}`)

                        console.log(`${modul.padEnd(12)}: [${msubs.join(', ')}]`,
                            `\n\t  timer=${scrpt.timer}, done='${scrpt.done}', orig='${scrpt.orig}', err='${scrpt.err}'`,
                            `\n\t  ${scrpt.parse.dataset.src.padEnd(12)} ${scrpt.parse.src}`,
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