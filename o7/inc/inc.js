/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'

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
    static parser = null

    destroy() {
        // 1. abort xhr
        if (this.xhr && this.xhr.readyState !== 4)
            this.xhr.abort()

        this.xhr = null

        // 2. очистка frags
        for (const frag of this.frags.values()) {
            frag.mtags.clear()
            frag.tpl = null
        }
        this.frags.clear()

        // 3. прочее
        this.htm = null
        this.err = ''
        this.ready = -1
    }
}

const
    o_include = 'o_include',
    prepareIncls = doc => {
        const
            debugList = C.consts.debug ? [] : null,
            tags = doc.querySelectorAll(`div[${o_include}]`),
            isHidden = tag => tag.getClientRects().length === 0

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
                ss = ref.split(/[?]/),
                ori = ss[0].trim(),
                url = C.decodeUrl(ori) || ori,
                sel = ss.length > 1 ? ss.at(-1) : ''

            // const incl = I.get(ori, url)

            let incl = I.incls.get(url)
            if (!incl) {
                incl = new I(ori, url)
                I.incls.set(url, incl)
                if (debugList) debugList.push(`incl     ${ori}`)
            }

            let frag = incl.frags.get(sel)
            if (!frag) {
                frag = { sel, mtags: new Map(), tpl: null, stxt: '' }
                incl.frags.set(sel, frag)
                if (debugList) debugList.push(`   frag   ${sel.padEnd(10)} ${incl.ori}`)
            }

            if (frag.mtags.has(id))
                throw new Error(`o_include: повтор id='${id}' при sel='${sel}', url='${incl.url}'`)

            frag.mtags.set(id, tag)
            if (debugList) debugList.push(`      tag ${id.padEnd(8)}   ${incl.ori}  ${frag.sel}`)
        }

        if (debugList?.length) {        // добавлено для загрузок
            console.groupCollapsed(`добавлено для загрузок`)
            console.log(debugList.join('\n'))
            console.groupEnd()
        }
    },
    fillFrags = incl => {
        const
            errs = [],
            body = incl.htm.body || incl.htm,
            getText = (key) => {
                if (!key)
                    return [body]

                const name = key.replace(/\s*(#|\.|!)\s*/g, '')
                switch (key[0]) {
                    case '#': return body.querySelectorAll(`[id='${name}']`);
                    case '.': return body.getElementsByClassName(name);
                }
                return body.getElementsByTagName(name)
            }
        let isFragFilled;

        for (const frag of incl.frags.values()) {
            if (frag.tpl) continue

            const
                [key, outer] = frag.sel.split('!'),
                insTags = getText(key)    // вставляемые теги

            if (insTags?.length > 0) {
                const
                    tpl = frag.tpl = document.createElement('template'),
                    debugList = C.consts.debug ? [] : null

                for (const insTag of insTags) {
                    let s = C.isDefined(outer) ? insTag.outerHTML : insTag.innerHTML
                    tpl.innerHTML = s.trimEnd() + '\n'

                    const ids = []
                    for (const [id, tag] of frag.mtags) {
                        if (!(tag instanceof Element))
                            throw new TypeError(`mtags[${id}] не DOM-элемент`)

                        tag.appendChild(
                            tpl.content.cloneNode(true)
                        )
                        ids.push(id)
                    }

                    for (const node of tpl.content.children)   // чтобы очищать в page
                        node.setAttribute(C.myInclude, '')

                    if (debugList)
                        debugList.push(`${ids.join(', ')} ::${s} `)
                }
                isFragFilled = true

                prepareIncls(tpl)

                if (debugList) {
                    console.groupCollapsed(`вставка фрагментов селектора '${frag.sel}' из скачанного ${incl.ori}`)
                    console.log(debugList.join(''))
                    console.groupEnd()
                }
            }
            else
                errs.push(sel)
        }

        if (errs.length > 0)
            incl.err = `не опр. '${errs.join(', ')}'`

        if (isFragFilled) fillIncls()
        else
            askFinish()
    },
    fillIncls = () => {
        for (const incl of I.incls.values())
            if (incl.ready < 0)
                loadIncl(incl)
            else
                if (incl.ready > 0)
                    fillFrags(incl)
    },
    // loadTextXHR = (incl, timeout = 10000) => {
    loadTextXHR = async (incl, timeout = 10000) => {
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
    loadIncl = async incl => {
        incl.ready = 0

        try {
            const text = await loadTextXHR(incl)

            incl.ready = 1
            incl.htm = (I.parser ??= new DOMParser())
                .parseFromString(text, 'text/html')

            fillFrags(incl)
            askFinish(incl)
        }
        catch (err) {
            if (err.message === 'timeout')
                incl.err = 'timeout'
            else if (err.message === 'network')
                incl.err = 'network error'
            else if (err.message.startsWith('HTTP'))
                incl.err = err.message
            else
                incl.err = err.message || 'unknown error'

            askFinish(incl)
            throw err   // ← ОЧЕНЬ РЕКОМЕНДУЮ
        }
        finally {
            incl.ready = 2
        }
    },
    askFinish = () => {
        for (const incl of I.incls.values())
            if (incl.ready <= 0)
                return

        const errs = []
        for (const incl of I.incls.values())
            if (incl.err)
                errs.push(incl.err)

        if (errs.length > 0)
            console.log('%c%s', C.consts.fmtErr, `'inc' - загрузка окончена с ошибками`, errs.length, errs)
        else
            if (C.consts.debug) {
                const rezs = []
                for (const incl of I.incls.values())
                    rezs.push({ ori: incl.ori, url: incl.url, done: incl.ready, err: incl.err, })

                console.log('%c%s', C.consts.fmtOK, `'inc' - загружено`, rezs)
            }

        W.clear()
        const e = new CustomEvent('o_incReady', { detail: { modul: W.modul, avtonom: C.avtonom } })
        window.dispatchEvent(e)
    }

export const W = {
    needs: { getall: true, isfinal: 1 },
    execute: function () {
        this.clear()

        prepareIncls(document)
        fillIncls()
    },
    clear: function () {
        I.parser = null

        for (const incl of I.incls.values())
            incl.destroy()

        I.incls.clear()
    },
}