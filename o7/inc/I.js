import { C } from '../index.js'
import { W } from './inc.js'
import { F } from './F.js'
import { T } from './T.js'

const Err = Object.freeze({
    TIMEOUT: 'TIMEOUT',
    NETWORK: 'NETWORK',
    ABORT: 'ABORT',
    HTTP: 'HTTP',
})

const whaterr = err => {
    if (Object.values(Err).includes(err.type))
        return err.type + (err.status ? ' ' + err.status : '')
    else
        return err.message || 'unknown error'
}

const Url = ori =>
    new URL(
        C.decodeUrl(ori),   // || ori,
        document.baseURI
    ).href

export class I {
    static #incls = new Map()
    static parser = null

    constructor(ori, runId) {
        this.aborted = false
        this.ready = false
        this.fired = false
        this.url = Url(ori)
        this.runId = runId
        this.ori = ori
        this.xhr = 0
        this.htm = null
        this.err = ''
        Object.seal(this)

        // Вызов load прямо здесь — запускаем асинхронно, не ожидая
        this._startLoad()
        // console.log('создал ' + ori)
    }
    #loadTextXHR(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            this.xhr = xhr

            xhr.open('GET', this.url, true)
            xhr.timeout = timeout
            xhr.responseType = 'text'

            xhr.onload = () =>
                xhr.status === 200
                    ? resolve(xhr.responseText)
                    : reject({ type: Err.HTTP, status: xhr.status })

            xhr.onerror = e =>
                reject({ type: Err.NETWORK, status: e.message })

            xhr.ontimeout = () =>
                reject({ type: Err.TIMEOUT })

            xhr.onabort = () =>
                reject({ type: Err.ABORT })

            xhr.send()
        })
    }
    async _startLoad() {
        if (this.fired) return   // повторный вызов игнорируется
        this.fired = true

        const parser = I.parser ??= new DOMParser()
        try {
            const text = await this.#loadTextXHR()  // твой XHR
            this.htm = parser.parseFromString(text, 'text/html')
        }
        catch (err) {
            this.err = whaterr(err)
            this.htm = parser.parseFromString(
                '<div data-include-error style="background:yellow">Ошибка вставки</div>',
                'text/html'
            )
        }
        finally {
            // if (C.consts.debug > 1)
            //     console.log(`I: прочитан файл '${this.ori}' из "${this.url}"`)

            if (C.consts.debug) {
                console.groupCollapsed(`I: обработан файл '${this.ori}' из "${this.url}"`)
                console.log(this.htm.body.innerHTML.trimEnd())
                console.groupEnd()
            }

            this.ready = true
            if (!this.aborted && W.act.runId === this.runId) {
// if(this.ori==='./inc1.html')                
//     debugger
                F.fillFrags(this)
                T.fillTags()
            }
            if (C.consts.debug>1)
                console.log(`I: готово ${this.ori}`)

            W.selectIncls(this)  //prepareIncls(this.htm, this)  // вставка и обработка фрагментов
        }
    }
    abort() {
        this.aborted = true
        if (this.xhr && this.xhr.readyState !== 4) {
            this.xhr.abort()
            this.xhr = null
            return true
        }
    }
    destroy() {
        this.abort()
        this.err = ''
        this.xhr = null
        this.htm = null
        this.ready = false
        this.fired = false
    }
    static get(ori, runId) {
        const url = Url(ori)
        let incl = I.#incls.get(url)
        let old = true

        if (incl && incl.runId != runId) {
            incl.destroy()
            incl = null
        }
        if (!incl) {
            incl = new I(ori, runId)
            I.#incls.set(url, incl)
            old = false
        }
        return { incl, old }
    }

    static clear() {
        I.parser = null
        for (const incl of I.#incls.values())
            incl.destroy()

        I.#incls.clear()
    }
    static abortLoads() {
        for (const incl of I.#incls.values())
            incl.abort()
    }
    static listIncls() {
        const list = []
        for (const incl of I.#incls.values())
            list.push(incl.ori.padEnd(15) + (incl.ready ? ' ! ' : ' ? ') + (incl.err ? incl.err : 'OK') + incl.url)
        return '\n' + list.join('\n')
    }
    static getErrs() {
        const errs = []
        for (const incl of I.#incls.values())
            if (incl.err)
                errs.push(`\n${incl.err}: "${incl.ori}"` + (incl.ori === incl.url ? '' : ('  -> ' + incl.url)))

        if (errs.length > 0)
            return errs.join(', ')
    }
    static isDone() {
        for (const incl of I.#incls.values())
            if (!incl.ready && !incl.err)
                return false

        return true
    }
}
