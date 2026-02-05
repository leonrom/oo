import { C } from '../index.js'
import { W } from './inc.js'

const    Err = Object.freeze({
        TIMEOUT: 'TIMEOUT',
        NETWORK: 'NETWORK',
        HTTP: `HTTP`,
    })

const    loadTextXHR = async (incl, timeout = 10000) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            incl.xhr = xhr   // ← ВАЖНО

            xhr.open('GET', incl.url, true)
            xhr.timeout = timeout
            xhr.responseType = 'text'

            xhr.onload = () => {                if (xhr.status === 200)
                    resolve(xhr.responseText)
                else
                    reject({ type: Err.HTTP, status: xhr.status })
            }

            xhr.onerror = (e) => reject({ type: Err.NETWORK, status: e.message })
            xhr.ontimeout = () => reject({ type: Err.TIMEOUT })

            xhr.send()
        })
    },
    whaterr = err => {
        if (Object.values(Err).includes(err.type))
            return err.type + (err.status ? (' ' + err.status) : '')
        else
            return err.message || 'unknown error'
    },
    load = async incl => {
        if (incl.fired) return
        incl.fired = true   // ← ВЗВОДИМ СРАЗУ

        if (C.consts.debug > 1)
            console.log(`читаю '${incl.ori}',- "${incl.url}"`)

        const parser = I.parser ??= new DOMParser()
        try {
            const text = await loadTextXHR(incl)

            incl.htm = parser.parseFromString(text, 'text/html')
        }
        catch (err) {
            incl.err = whaterr(err)
            incl.htm = parser.parseFromString(
                '<div data-include-error style="background:yellow">Ошибка вставки</div>',
                'text/html'
            )
            throw new Error(`Ошибка загрузки '${incl.err}' для '${incl.ori}'`)
        }
        finally {
            C.ASSERT(incl.ready !== true, `incl.ready already true for '${incl.ori}'`)
            incl.ready = true
            W.prepareIncls(incl.htm, incl)
        }
    },
    Url = function (ori) {
        return C.decodeUrl(ori) || ori
    }

export class I {
    constructor(ori) {
        this.ready = false
        this.fired = false
        this.ori = ori
        this.url = Url(ori)
        this.htm = ''
        this.err = ''
        this.xhr = 0
        Object.seal(this)

        load(this)
    }
    static inclsValues() {
        return I.#incls.values()
    }
    static #incls = new Map()
    static parser = null
    static get(ori) {
        const url = Url(ori)
        let incl = I.#incls.get(url),
            isn = false
        if (!incl) {
            incl = new I(ori)
            I.#incls.set(url, incl)
            isn = true
        }
        return { obj: incl, isn }

    }
    static clear() {
        I.parser = null
        for (const incl of I.#incls.values())
            incl.destroy()
        I.#incls.clear()
    }
    static isDone() {
        for (const incl of I.#incls.values())
            if (!incl.ready && !incl.err)
                return false
        return true
    }
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
        this.err = ''
        this.htm = null
        this.ready = false
        this.fired = false
    }
}
