(function () {              // ---------------------------------------------- o7 ---
    'use strict';
    let C;
    const
        m = window.location.search.match(/(?:\?|&)debug(?:=([^&?]*))?(?=[&?]|$)/),
        debug = !m ? 0 : (m[1] === undefined || m[1] === "") ? 1 : (isNaN(+m[1]) ? 3 : +m[1])

    class TC {
        fmtOK = "background: cornsilk; color: black;"
        fmtErr = "background: yellow; color: black;"    // border: solid 2px red;
        repQuotes = /^\s*((\\')|(\\")|(\\`)|'|"|`)?\s*|\s*((\\')|(\\")|(\\`)|'|"|`)?\s*$/g

        consts = Object.seal({
            timLoad: 3,
            debug: debug,
            nomnu: 0,
            noact: 0,
            doscr: 'olga5_sdone',
            depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
            pageLoads: 'readystatechange:d, message:u, inc_ready',
            pageDones: 'beforeunload, o_unloadPage',
        })
        wconsts = {}        // дополнительные константы
        url_consts = {}

        scrpts = {}   // перечень загруженных скриптов (модулей) и их подмодулей со статусом готовности

        cls = Object.freeze({
            curScript: document.currentScript,
        })

        constructor() {
            const errs = [],
                url = new window.URL(window.location),
                params = Object.fromEntries(new URLSearchParams(window.location.search))

            this.urlrfs = {
                _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
                _root: url.origin + '/',
                _olga: this.cls.curScript.src.match(/\S*\//)[0]
            }

            // сохраняю константы из адресной строки
            for (const nam in params)
                if (this.IsUnDefined(this.consts[nam])) errs.push(nam)
                else {
                    const v = this.TryToDigit(params[nam])
                    this.url_consts[nam] = v
                    this.wconsts[nam] = v
                }
            if (errs.length && debug)
                console.log('%c%s', this.fmtErr, `Адресная строка`, `неопр. параметры: ${errs.join(', ')}.`)
        }

        Repname(name) {
            return name.trim().replaceAll('-', '_').toLowerCase()
        }
        IsUnDefined(c) {
            return typeof c === 'undefined'
        }
        TryToDigit(x) {
            if (this.IsUnDefined(x)) return 1		// true
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
            if (debug > 1 && !canrep) {
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
                                dates[nam] = val = ss[1] || 1
                        }
                }

            if (consts) {
                const cnsts = script.dataset.consts?.split(';') ?? []
                // обработка data-consts (список констант)
                for (const cns of cnsts) {
                    const ss = cns.split('='),
                        c = ss[0].trim()
                    if (c)
                        if (!this.IsUnDefined(consts[c]) && consts !== C.consts)
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
        /**
         *  создание ссsлки на модуль
         */
        #AddScript(w, modul, script, src) {
            return Object.seal({
                cls: Object.freeze({
                    script: script,
                    orig: src,
                }),
                W: w,
                load: 0,
                start: 0,
                timera: 0,
                msubs: {}
            })
        }
        AddModuleSub(modul, submod, funcs) {
            const wshp = window.olga7[modul] ??= {},
                errs = []

            if (wshp[submod])
                errs.push(`Повтор подгрузки '${modul}/${submod}'`)

            const sub = wshp[submod] ??= {},
                scrpt = this.scrpts[modul] ??= this.#AddScript(null, modul, C.cls.curScript, ''),
                msub = scrpt.msubs[submod] ??= {}

            msub.load = 1

            /**
             *  funcs м.б. либо объект {name, obj}, либо массивом функций [f1, f2...]  
             */
            if (funcs)
                if (Array.isArray(funcs)) {
                    for (const func of funcs) {
                        const name = func.name
                        if (sub[name]) errs.push(`Повтор функции '${name}'`)
                        else
                            sub[name] = func
                    }
                }
                else {
                    const name = funcs.name
                    if (!name) errs.push(`В объекте отсутствует 'name'`)
                    else
                        if (sub[name]) errs.push(`Повтор объекта/функции '${name}'`)
                        else
                            sub[name] = funcs.obj
                }

            if (debug > 1) {
                const names = Array.isArray(funcs)
                    ? funcs.map(f => f.name)
                    : [funcs.name];
                console.log(`подключён ${modul}.${submod}: ${names.join(',')}`)
            }
            if (errs.length)
                console.error('%c%s', this.fmtErr,
                    `Ошибки добавления субмодуля ${submod} в `, W.cls.modul, errs)
            return wshp
        }
        AddModule(W) {
            const
                modul = W.cls.modul,
                wshp = window.olga7[modul] ??= {}

            if (wshp && wshp.load > 0)
                console.error('%c%s', this.fmtErr, `Повтор подключения модуля в  ${modul}`)

            const scrpt = this.scrpts[modul] ??= this.#AddScript(W, modul, C.cls.curScript, '')
            scrpt.load = 1

            if (W.incls)
                for (const submod of W.incls) {
                    const msub = scrpt.msubs[submod] ??= {}
                    if (!msub.load)
                        msub.load = 0
                }

            wshp.load = 1
            wshp.W = W
            this.FillFromScript(W)

            Object.assign(this.scrpts[modul], { W: W, need: true })

            if (debug)
                console.log(`${this.cls.curScript.src.indexOf(`/${modul}.`) > 0 ? 'загружен  ' : 'включён   '}:  ${modul}.js`)

            this.DispatchEvent('o_modulLoad', modul)

            return wshp
        }
        LoadScripts() {
            for (const script of document.scripts) {
                const orig = script.dataset.src
                if (orig && orig[0] === '+') {
                    const
                        modul = orig.slice(orig.lastIndexOf('/') + 1, orig.lastIndexOf('.')).replace(/[+!.]/, ''),
                        wshp = window.olga7[modul] ??= {}

                    wshp.load = 0                // статус загруженности скрипта                  
                    this.scrpts[modul] = this.#AddScript(null, modul, script, orig)

                    script.onerror = (e) => {
                        wshp.load = -1;  // помечаем как ошибочный
                        console.error('%c%s', this.fmtErr, `Ошибка загрузки модуля '${modul}' (src: ${src})`, e);
                    }
                    script.src = this.urlrfs._olga + orig.substring(1)
                }
            }
        }
    }

    C = new TC()
    window.olga7 ??= {}
    window.olga7.C = C // объект 'C' отличается от модулей отсутствием поля 'W'

    /**
     *  параметры вызова скрипта
     */
    C.FillFromScript(C);

    /**
     *   вызов LoadScripts только после парсинга скриптов - т.е. после загрузки документа 
     */
    (fn => {
        document.readyState === 'loading'
            ? document.addEventListener('DOMContentLoaded', fn, { once: true })
            : fn();
    })(C.LoadScripts);       //  загрузка подключаемых скриптов

})();