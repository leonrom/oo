/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

let _div, debug;
const
    W = {
	needs: {getall=true,}
    },
    incls = {},
    o_include = 'o_include',
    o_includeHist = '_o_include',
    msg = {
        clrs: {	//	копия из CConsole
            'E': "background: yellow; color: black;border: solid 1px gold;",
            'I': "background: beige;  color: black;border: solid 1px bisque;",
        },
        Head: src => `${W.modul}:  '${src}'`,
        Msg: (fmt, head, txt, rezs) => {
            if (rezs) {
                console.groupCollapsed("%c%s", fmt, head, txt)
                console.table(rezs)
                {
                    console.groupCollapsed('')
                    console.trace()
                    console.groupEnd()
                }
                console.groupEnd()
            }
            else {
                console.groupCollapsed("%c%s", fmt, head, txt)
                console.trace()
                console.groupEnd()
            }
        },
        Info: (src, txt, rezs) => msg.Msg(msg.clrs['I'], msg.Head(src), txt, rezs),
        Error: (src, txt, rezs) => msg.Msg(msg.clrs['E'], msg.Head(src), txt, rezs),
    },
    InclFinish = () => {
        let ok = true
        for (const url in incls)
            if (incls[url].err) {
                ok = false
                break
            }
        if (!ok || debug > 0) {
            const src = `обработка 'CInclude'`,
                rezs = []

            for (const url in incls) {
                const incl = incls[url]
                rezs.push({ ori: incl.ori, url: incl.url, err: incl.err || 'OK', })
            }

            if (ok) msg.Info(src, 'всё загружено', rezs)
            else
                msg.Error(src, 'есть ошибки:', rezs)
        }

        if (C.avtonom) {
            // const e = new CustomEvent('o_incReady', { modul: W.modul })
            const e = new CustomEvent('o_incReady', { detail: { modul: W.modul } })
            window.dispatchEvent(e)
        }
        else
            // передавать имя "источника"			
            C.DispatchEvent('o_incReady', W.modul + "-источник")
    },
    AddIncls = tags => {
        // console.log(`INC_1 `)
        const
            errs = [],
            IsDisplay = tag => {
                let div = tag
                while (div && div.nodeType === 1) {
                    const nst = window.getComputedStyle(div),
                        display = nst.getPropertyValue('display')
                    if (display == 'none') {
                        return false
                    }
                    div = div.parentNode
                }
                return true
            }

        for (const tag of tags) // группировка по url'ам, чтобы не грузить лишнее
            if (W.consts.getall || IsDisplay(tag)) {    // загружать со стиль "displa = 'none'"
                const ref = tag.getAttribute(o_include)

                tag.removeAttribute(o_include)
                tag.setAttribute(o_includeHist, ref)  // так... для истории

                const
                    ss = ref.split(/[?!]/),
                    ori = ss[0].trim(),
                    url = C.decodeUrl(ori) || ori,
                    sel = ss.length > 1 ? ss.at(-1) : ''

                let incl = incls[url]
                if (!incl) {
                    incl = {
                        ori: ori,
                        url: url,
                        mtags: [], err: '', text: '', done: false, isent: false,
                        xhr: new XMLHttpRequest(),
                    }
                    Object.seal(incl)
                    incls[url] = incl

                    Object.assign(incl.xhr, {
                        incl: incl,
                        onload: PageLoad,
                        onerror: OnError,
                        timeout: 10000,
                        responseType: 'text',
                        // withCredentials: true,  - CORS ломается даже там, где мог бы работать
                    })
                    incl.xhr.open("get", url, true)
                }
                incl.mtags.push({ tag: tag, sel: sel.trim(), outer: ref.indexOf('!') >= 0 }) // на случай если и '?' и '&'
            }

        let n = 0
        for (const url in incls) {
            const incl = incls[url]
            if (!incl.isent) {
                incl.isent = true
                incl.xhr.send()
                n++
            }
            else
                if (incl.done)	//	но если файл уже был загружен, то не надо ждать					
                    DoLoad(incl)
        }

        if (errs.length > 0) {
            C.ConsoleError(`'inc' - ошибки`, errs.length, errs)
            errs.length = 0
        }

        if (!n)
            InclFinish()
    },
    AskFinish = (incl, ok) => {
        let done = true

        for (const url in incls)
            if (!incls[url].done) {
                done = false
                break
            }

        if (!ok)
            msg.Error('AskFinish', `ошибка загрузки ${incl.xhr.status}   ${incl.xhr.responseURL}`)
        else
            if (debug > 1)
                msg.Info('AskFinish', `вставлен URL ${done ? '(последний!)' : ''}  ${incl.xhr.responseURL}`)

        if (done)
            InclFinish()
    },
?цикли !!!    
    DoLoad = (incl, errs) => {
        const es = [],
            mm = incl.xhr.responseText.match(/<body[^>]*>/),
            i = mm ? mm.index : 0,
            IA =( tag, txt) => {
                    tag.insertAdjacentHTML('beforeEnd', `<div data-o5-inc>${txt}</div>`)
                }

        _div.innerHTML = incl.xhr.responseText.substring(i)

        msg.Info('DoLoad  ', `обрабатывается фрагмент ${i}`, _div.innerHTML)

        const tags = []
        for (const mtag of incl.mtags)
            if (!mtag.done) {
                mtag.done = true
                const
                    sel = mtag.sel,
                    tag = mtag.tag

                let srcs = null,
                    outer = mtag.outer
                if (sel) {
                    switch (sel[0]) {
                        case '[': srcs = _div.querySelectorAll(sel)
                            break
                        case '#': srcs = _div.querySelectorAll(`[id='${sel.substring(1)}']`)
                            break
                        case '.': {
                            const s = sel.substring(1),
                                ss = s.split(/\s*:\s*/g),
                                cc = ss[0],
                                qs = _div.querySelectorAll(`[class *= '${cc}']`),
                                mcc = new RegExp('\\b' + cc + '\\b(:\\w*)*', 'g')
                            if (qs)
                                for (const q of qs) {
                                    const m = q.className.match(mcc)
                                    if (m) {
                                        const mm = m[0].split(/\s*:\s*/g)
                                        let kv = true
                                        for (let i = 1; i < ss.length; i++) {
                                            let ok = false
                                            for (let j = 1; j < mm.length; j++)
                                                if (mm[j] == ss[i]) {
                                                    ok = true
                                                    break
                                                }
                                            if (!ok) {
                                                kv = false
                                                break
                                            }
                                        }
                                        if (kv) {
                                            if (!srcs) srcs = []
                                            srcs.push(q)
                                        }
                                    }
                                }
                            break
                        }
                        default: srcs = _div.getElementsByTagName(sel)
                    }
                    if (!srcs || srcs.length == 0) {
                        es.push(sel)
                        continue
                    }
                }
                else {
                    srcs = [_div]  // для всего "тела" 1ищвн 2 не включаем
                    outer = false
                }

                for (const src of srcs) {
                    if (debug > 1)
                        IA(src, `\n<!-- вставка с id='${src.id}' -->`)

                    if (outer)
                        IA(src, '\n')

                    const s = outer ? src.outerHTML : src.innerHTML
                    IA(src, s.trimEnd() + '\n') // тут '\n' надо для "красоты" в тестах)
                }
                tags.push(...tag.querySelectorAll(`div[${o_include}]`))
            }
        if (es.length > 0) {
            incl.err = `не опр. '${es.join(', ')}'`
            errs.push(incl.err)
        }
        if (tags && tags.length > 0)
            AddIncls(tags)
    },
    PageLoad = function () {
        const
            xhr = this,
            incl = xhr.incl

        if (debug > 1)
            msg.Info('PageLoad', `загружена страница  (с рез.=${xhr.status})  ${incl.xhr.responseURL}`, xhr.responseText)

        incl.done = true


        if (xhr.status == 200)
            DoLoad(incl)
        else
            incl.err = `статус загрузки = (рез.=${xhr.status})`

        AskFinish(incl, xhr.status === 200)
    },
    OnError = function () {
        const incl = this.incl
        incl.err = 'ошибка загрузки (блокировано by CORS ?)'
        incl.done = true
        AskFinish(incl, false)
    }

export function prepare(C) {
    debug = C.consts.debug
}

export function execute() {
    const tags = document.querySelectorAll(`div[${o_include}]`)

    if (tags && tags.length > 0)
        AddIncls(tags)
}