/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

let debug;
const
    o_include = 'o_include',
    InclFinish = () => {
        const errs = []
        for (const incl of W.act.incls.values())
            if (incl.err)
                errs.push(incl.err)

        if (errs.length > 0)
            console.log('%c%s', C.consts.fmtErr, `'inc' - загрузка окончена с ошибками`, errs.length, errs)
        else
            if (debug) {
                const rezs = []
                for (const incl of W.act.incls.values())
                    rezs.push({ ori: incl.ori, url: incl.url, done:incl.done,  err: incl.err , })

                console.log('%c%s', C.consts.fmtOK, `'inc' - загружено`, rezs)
            }

        // if (C.avtonom) {
        //     const e = new CustomEvent('o_incReady', { detail: { modul: W.modul } })
        //     window.dispatchEvent(e)
        // }
        // else            // передавать имя "источника"			
        //     C.DispatchEvent('o_incReady', W.modul + "-источник")
        const e = new CustomEvent('o_incReady', { detail: { modul: W.modul, avtonom: C.avtonom } })
        window.dispatchEvent(e)
    },
    DoLoad = incl => {
        const
            es = [],
            parser = new DOMParser(),
            doc = parser.parseFromString(incl.text, 'text/html'),
            root = doc.body || doc
        // insInTag = (tag, txt) => {
        //     // tag.insertAdjacentHTML('beforeEnd', `<span ${C.myInclude}>${txt}</span>`)
        //     const tpl = document.createElement('template')
        //     tpl.innerHTML = txt

        //     for (const node of tpl.content.children) {
        //         node.setAttribute(C.myInclude, '')
        //     }

        //     tag.appendChild(tpl.content)
        // }
        if (C.consts.debug)
            console.log(`'DoLoad': обрабатывается "${incl.ori}" для [${incl.mtags.map(m => `'${m.tag.id}'`).join(',')}]`, root.innerHTML)
        // debugger;
        for (const mtag of incl.mtags) {
            if (mtag.done) continue
            mtag.done = true

            const
                sel = mtag.sel,
                outer = mtag.outer && sel,
                srcs = sel ? getText(root, sel) : [root]

            if (!srcs || srcs.length == 0) {
                es.push(sel)
                continue
            }

            let s = ''
            for (const src of srcs) {
                if (debug > 1) s = `\n<!-- вставка с id='${src.id}' -->\n`

                s += outer ? src.outerHTML : src.innerHTML

                if (outer) s += '\n'

                // insInTag(mtag.tag, s.trimEnd() + '\n') // тут '\n' надо для "красоты" в тестах)
                const tpl = document.createElement('template')
                tpl.innerHTML = s.trimEnd() + '\n'

                for (const node of tpl.content.children)
                    node.setAttribute(C.myInclude, '')

                mtag.tag.appendChild(tpl.content)
                //????????????                CCleanup.trackInsert(mtag.tag)
            }
        }

        if (es.length > 0)
            incl.err = `не опр. '${es.join(', ')}'`

        // ищу теги o_include во вставленных фрагментах
        const newTags = []
        for (const mtag of incl.mtags)
            if (!mtag.done)
                newTags.push(...mtag.tag.querySelectorAll(`div[${o_include}]`))

        if (newTags.length > 0)
            AddIncls(newTags)
    },
    loadTextXHR = (incl, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            incl.xhr = xhr   // ← ВАЖНО

            xhr.open('GET', incl.url, true)
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
        incl.done = 0
        loadTextXHR(incl)
            .then(text => {
                incl.text = text
                incl.done = 1

                DoLoad(incl)
                AskFinish(incl)
            })
            .catch(err => {
                incl.err =
                    err.type === 'timeout' ? 'timeout' :
                        err.type === 'network' ? 'network error' :
                            `HTTP ${err.status}`
                incl.done = 1
                AskFinish(incl)
            })
    },
    isHidden = tag => tag.getClientRects().length === 0,
    // isDone = url => {
    //     for (const doneUrl of W.act.doneUrls)
    //         if (doneUrl === url)
    //             return true
    //     return false
    // },
    AddIncls = tags => {
        const incls = W.act.incls
        for (const tag of tags) {    // группировка по url'ам, чтобы не грузить лишнее
            if (!W.consts.getall && isHidden(tag))     // загружать со стиль "displa = 'none'"
                continue

            const
                ref = tag.getAttribute(o_include),
                ss = ref.split(/[?!]/),
                ori = ss[0].trim(),
                url = C.decodeUrl(ori) || ori,
                sel = ss[1]||''

            // if (isDone(url))
            if (W.act.mtagIncls[url]) {
                console.error(`Тег ${C.MakeObjName(tag)}: повтор вставки обработанного "${url}"` +
                    ((url === ori) ? '' : `т.е. ${url}`) + ' - игнорируется')
                continue
            }

            let incl = incls.get(url)
            if (!incl) {
                incl = Object.seal({
                    xhr: null,
                    sels: new Map(),
                    ori: ori, url: url, err: '', done: -1,
                })
                incls.set(url, incl)
            }
            // incl.mtags.push({ tag: tag, sel: sel.trim(), outer: ref.includes('!') })
            // W.act.doneUrls.add(url)
            const mtag = { tag: tag, sel: sel.trim(), outer: ref.includes('!') }
            incl.mtags.push(mtag)

            W.act.mtagIncls.set(url, mtag)
        }

        for (const incl of incls.values())
            if (incl.done < 0)
                loadIncl(incl)
    },
    AskFinish = (incl) => {
        let done = true

        for (const incl of W.act.incls.values())
            if (incl.done <= 0) {
                done = false
                break
            }

        if (incl.err)
            console.log('%c%s', C.consts.fmtErr, `'AskFinish': ошибка загрузки ${incl.err} `, incl.url)
        else
            if (debug)
                console.log('%c%s', C.consts.fmtOK, `'AskFinish': вставлен URL ${done ? '(последний!)' : ''}`, incl.url)

        if (!done)
            InclFinish()
    },
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
                                (srcs ??= []).push(q)
                        }
                    }
                }
                break
            }
            default: srcs = root.getElementsByTagName(sel)
        }
        return srcs
    }

export const W = {
    act: { 
        mtagIncls: new Map(), 
        incls: new Map(),    // описание 
    },
    needs: { getall: true, isfinal: 1 },
    prepare: () => {
        debug = C.consts.debug
    },
    execute: () => {
        const tags = document.querySelectorAll(`div[${o_include}]`)
        W.clear()

        if (tags && tags.length > 0)
            AddIncls(tags)
    },
    clear: () => {
        // W.act.doneUrls.clear()

        for (const incl of W.act.incls.values()) {
            const xhr = incl.xhr
            if (xhr && xhr.readyState !== 4)
                xhr.abort()

            incl.remove()
        }
        for (const node of W.act.mtagIncls.values()) node.remove()

        W.act.mtagIncls.clear()
    },
}
