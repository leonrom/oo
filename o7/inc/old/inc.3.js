/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

let debug;
class I {
    constructor(ori, url) {
        this.frags = new Map()
        this.ready = -1
        this.ori = ori
        this.url = url
        this.htm = ''
        this.err = ''
        this.xhr = 0

        Object.seal(this)
    }
    static incls = new Map()
    static get(url) {
        let incl = I.incls.get(url)
        if (!incl) {
            incl = new I(ori, url)
            I.incls.set(url, incl)
        }
        return incl
    }
    static clear() {
        for (const incl of I.incls.values()) {
            for (const frag of incl.frags.values()) {
                frag.tags.clear()
                frag.remove()
            }
            incl.remove()
        }
        I.incls.clear()
    }
}

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
                    rezs.push({ ori: incl.ori, url: incl.url, done: incl.done, err: incl.err, })

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
    fillFrags = incl => {
        // const
        //     es = [],
        //     parser = new DOMParser(),
        //     doc = parser.incl.htm(incl.text, 'text/html'),
        //     root = doc.body || doc
        // // insInTag = (tag, txt) => {
        // //     // tag.insertAdjacentHTML('beforeEnd', `<span ${C.myInclude}>${txt}</span>`)
        // //     const tpl = document.createElement('template')
        // //     tpl.innerHTML = txt

        // //     for (const node of tpl.content.children) {
        // //         node.setAttribute(C.myInclude, '')
        // //     }

        // //     tag.appendChild(tpl.content)
        // // }
        // if (C.consts.debug)
        //     console.log(`'fillFrags': обрабатывается "${incl.ori}" для [${incl.mtags.map(m => `'${m.tag.id}'`).join(',')}]`, root.innerHTML)
        // // debugger;

        const
            body = incl.doc.body,
            htm = body ? body : incl.doc,
            getText = (htm, sel) => {
                const name = sel.replace(/\s*(#|\.|!)\s*/g, '')
                switch (sel[0]) {
                    case '#': return htm.querySelectorAll(`[id='${name}']`);
                    case '.': return htm.getElementsByClassName(name);
                }
                return htm.getElementsByTagName(name)
            }

        for (const frag of incl.frags.values())
            if (!frag.tpl) {
                frag.tpl = document.createElement('template')

                const
                    itags = getText(htm, frag.sel),
                    outer = frag.sel.includes('!') && !body   // у body всегда берём внутреннее

                for (const itag of itags) {
                    let s = outer ? itag.outerHTML : itag.innerHTML
                    if (outer) s += '\n'
                    tpl.innerHTML = s.trimEnd() + '\n'

                    for (const node of tpl.content.children)   // чтобы очищать в page
                        node.setAttribute(C.myInclude, '')
                }
            }

                AskFinish(incl)

        // for (const mtag of incl.mtags) {
        //     if (mtag.done) continue
        //     mtag.done = true

        //     const
        //         sel = mtag.sel,
        //         outer = mtag.outer && sel,
        //         srcs = sel ? getText(root, sel) : [root]

        //     if (!srcs || srcs.length == 0) {
        //         es.push(sel)
        //         continue
        //     }

        //     let s = ''
        //     for (const src of srcs) {
        //         if (debug > 1) s = `\n<!-- вставка с id='${src.id}' -->\n`

        //         s += outer ? src.outerHTML : src.innerHTML

        //         if (outer) s += '\n'

        //         // insInTag(mtag.tag, s.trimEnd() + '\n') // тут '\n' надо для "красоты" в тестах)
        //         const tpl = document.createElement('template')
        //         tpl.innerHTML = s.trimEnd() + '\n'

        //         for (const node of tpl.content.children)
        //             node.setAttribute(C.myInclude, '')

        //         mtag.tag.appendChild(tpl.content)
        //         //????????????                CCleanup.trackInsert(mtag.tag)
        //     }
        // }

        // if (es.length > 0)
        //     incl.err = `не опр. '${es.join(', ')}'`

        // // ищу теги o_include во вставленных фрагментах
        // const newTags = []
        // for (const mtag of incl.mtags)
        //     if (!mtag.done)
        //         newTags.push(...mtag.tag.querySelectorAll(`div[${o_include}]`))

        // if (newTags.length > 0)
        //     fillIncls(newTags)
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
                incl.doc = W.parser.parseFromString(text, 'text/html')
                fillFrags(incl)
                incl.done = 1
            })
            .catch(err => {
                incl.err =
                    err.type === 'timeout' ? 'timeout' :
                        err.type === 'network' ? 'network error' :
                            `HTTP ${err.status}`
                fillFrags(incl)
                incl.done = 1
            })
    },
    isHidden = tag => tag.getClientRects().length === 0,
    // isDone = url => {
    //     for (const doneUrl of W.act.doneUrls)
    //         if (doneUrl === url)
    //             return true
    //     return false
    // },
    fillIncls = doc => {
        const tags = doc.querySelectorAll(`div[${o_include}]`)
        if (!tags || tags.length === 0)
            return

        for (const tag of tags) {    // группировка по url'ам, чтобы не грузить лишнее
            if (!W.consts.getall && isHidden(tag))     // загружать со стиль "displa = 'none'"
                continue

            let err = ''
            const id = '' + tag.id
            if (!id) err = `не указан id тега с 'o_include'`
            else {
                const nodes = document.querySelectorAll(`[id="${id}"]`) // `#${id}`)
                if (nodes.length > 1)
                    err = `не униикальный id='${id}' тега с 'o_include'`
            }
            if (err) {
                console.log("%c%s", C.consts.fmtErr, err)
                continue
            }

            const
                ref = tag.getAttribute(o_include),
                ss = ref.split(/[?!]/),
                ori = ss[0].trim(),
                url = C.decodeUrl(ori) || ori,
incl = I.get(url),
                sel = ss.length > 1 ? ss.at(-1) : ''

            let frag = incl.frags.get(sel)
            if (!frag) {
                frag = { tags: new Set(), tpl: null, sel, stxt: '' }
                incl.frags.set(sel, frag)
            }
            frag.tags.add({ id, tag })

            // // let incl = incls.get(url)
            // // if (!incl) {
            // //     incl = Object.seal({
            // //         xhr: null,
            // //         mtags: [],
            // //         ori: ori, url: url, err: '', text: '', done: -1,
            // //     })
            // //     incls.set(url, incl)
            // // }
            // // incl.mtags.push({ tag: tag, sel: sel.trim(), outer: ref.includes('!') })
            // // W.act.doneUrls.add(url)
            // const mtag = { tag: tag, sel: sel.trim(), outer: ref.includes('!') }
            // incl.mtags.push(mtag)

            // W.act.mtagIncls.set(url, mtag)
        }

        for (const incl of incls.values())
            if (incl.done < 0)
                loadIncl(incl)
            else
                if (incl.done > 0)
                    fillFrags(incl)
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
    }

export const W = {
    act: {
        mtagIncls: new Map(),
        incls: new Map(),    // описание 
    },
    needs: { getall: true, isfinal: 1 },
    prepare: () => {
        debug = C.consts.debug
        W.parser = new DOMParser()
    },
    execute: () => {
        W.clear()

            fillIncls(document)
    },
    clear: () => {
        W.parser = null

        for (const incl of W.act.incls.values()) {
            const xhr = incl.xhr
            if (xhr && xhr.readyState !== 4)
                xhr.abort()

            incl.remove()
        }
        I.clear()

        W.act.mtagIncls.clear()
    },
}
