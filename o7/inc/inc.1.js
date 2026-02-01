/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

let debug;
const
    errs = [],
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
        if (errs.length > 0) {
            C.ConsoleError(`'inc' - ошибки`, errs.length, errs)
            errs.length = 0
        }

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
    DoLoad = incl => {
        const
            es = [],
            newTags = [],
            parser = new DOMParser(),
            doc = parser.parseFromString(incl.text, 'text/html'),
            root = doc.body || doc,
            insInTag = (tag, txt) => {
                tag.insertAdjacentHTML('beforeEnd', `<span ${C.myInclude}>${txt}</span>`)
            }

        msg.Info('DoLoad  ', `обрабатывается фрагмент `, root.innerHTML)

        for (const mtag of incl.mtags) {
            if (mtag.done) continue

            mtag.done = true
            const
                sel = mtag.sel,
                outer = mtag.outer && sel,
                srcs = sel ? getText(root, sel) : [root]

            if (!srcs || srcs.length == 0)
                es.push(sel)
            else
                for (const src of srcs) {
                    if (debug > 1)
                        insInTag(src, `\n<!-- вставка с id='${src.id}' -->`)

                    if (outer)
                        insInTag(src, '\n')

                    const s = outer ? src.outerHTML : src.innerHTML
                    insInTag(src, s.trimEnd() + '\n') // тут '\n' надо для "красоты" в тестах)
                }
            newTags.push(...mtag.tag.querySelectorAll(`div[${o_include}]`))
        }
        if (es.length > 0) {
            incl.err = `не опр. '${es.join(', ')}'`
            errs.push(incl.err)
        }
        if (newTags && newTags.length > 0)
            AddIncls(newTags)
    },
    loadTextXHR = (url, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('GET', url, true)
            xhr.timeout = timeout
            xhr.responseType = 'text'
            // xhr.withCredentials = false

            xhr.onload = () => {
                if (xhr.status === 200)
                    resolve(xhr.responseText)
                else
                    reject({ type: 'http', status: xhr.status })
            }

            xhr.onerror = () => reject({ type: 'network' })
            xhr.ontimeout = () => reject({ type: 'timeout' })

            xhr.send()
        })
    },
    loadIncl = incl => {
        loadTextXHR(incl.url)
            .then(text => {
                incl.text = text
                incl.done = true

                DoLoad(incl)
                AskFinish(incl)
            })
            .catch(err => {
                incl.err =
                    err.type === 'timeout' ? 'timeout' :
                        err.type === 'network' ? 'network error' :
                            `HTTP ${err.status}`
                incl.done = true
                AskFinish(incl)
            })
    },
    AddIncls = tags => {
        // console.log(`INC_1 `)
        const
            IsDisplay = tag => {
                return tag.getClientRects().length === 0
                // let div = tag
                // while (div && div.nodeType === 1) {
                //     const nst = window.getComputedStyle(div),
                //         display = nst.getPropertyValue('display')
                //     if (display == 'none') {
                //         return false
                //     }
                //     div = div.parentNode
                // }
                // return true
            },
            isDone = url => {
                for (const doneUrl of W.act.doneUrls)
                    if (doneUrl === url)
                        return true
                return false
            }

        for (const tag of tags) {    // группировка по url'ам, чтобы не грузить лишнее
            if (!W.consts.getall && !IsDisplay(tag))     // загружать со стиль "displa = 'none'"
                continue

            const ref = tag.getAttribute(o_include)

            tag.removeAttribute(o_include)
            tag.setAttribute(o_includeHist, ref)  // так... для истории

            const
                ss = ref.split(/[?!]/),
                ori = ss[0].trim(),
                url = C.decodeUrl(ori) || ori

            if (isDone(url))
                errs.push(`Тег ${C.MakeObjName(tag)}: повтор вставить обработанный ${url}` +
                    (url === ori) ? '' : `т.е. ${url}` + ' - игнорируется'
                )
            else {
                const sel = ss.length > 1 ? ss.at(-1) : ''
                let incl = incls[url]
                if (!incl) {
                    incl = Object.seal({
                        mtags: [],
                        ori: ori, url: url, err: '', text: '',
                        done: false, isent: false, loading: false, used: false
                    })
                    incls[url] = incl
                }
                incl.mtags.push({ tag: tag, sel: sel.trim(), outer: ref.includes('!') })
                W.act.doneUrls.add(url)
            }
        }

        for (const url in incls) {
            const incl = incls[url]
            if (!incl.loading && !incl.done) {
                incl.loading = true
                loadIncl(incl)
            }
        }
    },
    AskFinish = (incl) => {
        let done = true

        for (const url in incls)
            if (!incls[url].done) {
                done = false
                break
            }

        if (incl.err)
            msg.Error('AskFinish', `ошибка загрузки ${incl.errs}   ${incl.url}`)
        else
            if (debug > 1)
                msg.Info('AskFinish', `вставлен URL ${done ? '(последний!)' : ''}  ${incl.url}`)

        if (done)
            InclFinish()
    },

    // я хочу сделать временный контейнер _div. Но не вставляь в DOM, а заполнить его, обработать и удалить. Правильно ли так: 
    //     const _div = document.createElement('div')
    //     _div.innerHTML = incl.xhr.responseText.substring(i)
    //     srcs = _div.querySelectorAll(sel)
    //     delete _div
    // ===
    // const parser = new DOMParser()
    // const doc = parser.parseFromString(html, 'text/html')
    // const srcs = doc.querySelectorAll(sel)    

    // Т.е. вместо DOMParser
    // "Хорошо — только внутри нового контейнера" а если я по дурости вставляю самого себя, или свою часть, содержащую эту ссылку на вставку?
    getText = (root, sel) => {
        let srcs;

        switch (sel[0]) {
            case '[': srcs = root.querySelectorAll(sel)
                break
            case '#': srcs = root.querySelectorAll(`[id='${sel.substring(1)}']`)
                break
            case '.': {
                const s = sel.substring(1),
                    ss = s.split(/\s*:\s*/g),
                    cc = ss[0],
                    qs = root.querySelectorAll(`[class *= '${cc}']`)

                if (qs) {
                    const mcc = new RegExp('\\b' + cc + '\\b(:\\w*)*', 'g')
                    for (const q of qs) {
                        const m = q.className.match(mcc)
                        if (m) {
                            const mm = m[0].split(/\s*:\s*/g)
                            let kv = true
                            for (let i = 1; i < ss.length && kv; i++) {
                                const si = ss[i]
                                let nok = true
                                for (let j = 1; j < mm.length && nok; j++)
                                    if (mm[j] == si)
                                        nok = false
                                if (nok)
                                    kv = false
                            }
                            if (kv)
                                srcs.push(q)
                        }
                    }
                }
                break
            }
            default: srcs = root.getElementsByTagName(sel)
        }
        return srcs
    }

export function prepare(C) {
    debug = C.consts.debug
}

export function execute() {
    const tags = document.querySelectorAll(`div[${o_include}]`)
    errs.length = 0
    W.act.doneUrls.clear()

    if (tags && tags.length > 0)
        AddIncls(tags)
}

export const W = {
    modul: 'inc',
    Init: prepare,
    needs: { getall: true, isfinal: 1 },
    act: { doneUrls: new Set() }
}