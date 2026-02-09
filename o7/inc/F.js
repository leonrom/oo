import { C } from '../index.js'
import { trimFragment } from './T.js'

const
    getText = (frag, body) => {
        if (!frag.key)
            return [body]

        switch (frag.key) {
            case 'id': return body.querySelectorAll(`[id='${frag.name}']`);
            case 'class': return body.getElementsByClassName(frag.name);
            case 'node': return body.getElementsByTagName(frag.name)
        }

        C.ASSERT(false,
            `F.getText() непонятный key `,
            frag.key
        )
        return '?'
    },
    removeComments = node => {
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_COMMENT,
            null
        )

        const toRemove = []
        while (walker.nextNode())
            toRemove.push(walker.currentNode)

        for (const c of toRemove)
            c.remove()
    }

export class F {
    static #frags = new Map()

    constructor(sel, incl) {
        // this.key = sel?(sel[0] === '#' ? 'id' : (sel[0] === '.' ? 'class' : 'node')):''
        this.key = sel?(sel.includes('#') ? 'id' : (sel.includes('.') ? 'class' : 'node')):''
        this.name = sel.replace(/\s*(#|\.|!)\s*/g, '')
        this.outer = sel.includes('!')
        this.done = false
        this.incl = incl
        this.tpl = null     // заодно это признак, что загруза ОК
        this.sel = sel

        Object.seal(this)
    }

    destroy() {
        this.tpl = null
    }
    fill(body, err) {
        C.ASSERT(!this.done,
            `frag.fill() called twice for '${this.sel}'`,
            this.incl?.ori
        )
        // if (this.sel==='#i2')
        //     debugger

        const insTags = getText(this, body)    // вставляемые теги

        if (insTags?.length) {
            this.tpl = document.createElement('template')

            for (const insTag of insTags) {
                let fragment

                if (this.outer || err) {            // outerHTML → DOM
                    const tmp = document.createElement('template')
                    tmp.innerHTML = insTag.outerHTML
                    fragment = tmp.content
                } else {                            // innerHTML → DOM
                    fragment = document.createDocumentFragment()
                    for (const n of insTag.childNodes)
                        fragment.appendChild(n.cloneNode(true))
                }

                removeComments(fragment)
                trimFragment(fragment)

                this.tpl.content.appendChild(fragment.cloneNode(true))
            }

            if (C.consts.debug > 1)
                console.log(`F: заполнен фрагмент '${this.sel}' из "${this.incl.ori}":\n`, this.tpl.innerHTML)

            // не нужно - сам убираю в inc
            // for (const node of this.tpl.content.children)   // чтобы очищать в page
            //     node.setAttribute(C.myInclude, '')
        }
        this.done = true
    }
    static add(sel, incl) {
        let frag = F.#frags.get(sel),
            old = frag && frag/incl === incl
        if (!old) {
            frag = new F(sel, incl)
            F.#frags.set(sel, frag)
        }
        return { frag, old }
    }
    static clear() {
        for (const frag of F.#frags.values())
            frag.destroy()
        F.#frags.clear()
    }
    static fillFrags(incl) {
        if (!incl)
            debugger
        C.ASSERT(F.#frags.size > 0,
            'fillFrags() called after F.clear()',
            incl?.ori || 'null'
        )
        const body = incl.htm.body || incl.htm

        let err;
        if (!incl.ready) err = `'inc': вставка непрочитанного incl= '${incl.ori}'`
        else if (!body) err = `'inc': вставка пустого документа для '${incl.ori}'`
        if (err) {
            C.ConsoleAlert(err)
            return 0
        }

        const
            // debugList = C.consts.debug ? [] : null,
            errs = []
        let n = 0

        for (const frag of F.#frags.values())
            if (frag.incl === incl && !frag.done) {
                n++
                frag.fill(body, incl.err)

                if (!frag.tpl) errs.push(frag.sel)
                //     else
                //         if (C.consts.debug)
                //             // debugList.push(`sel='${frag.sel}' ::`, frag.tpl.innerHTML)
                // console.log(`F: заполнено sel='${frag.sel}' из '${incl.ori}': `, frag.tpl?frag.tpl.innerHTML:'??')
            }

        if (errs.length > 0)
            C.ConsoleAlert(`F: для incl=${incl.ori} `, `не определены  селекторы: [ ${errs.join(', ')} ]`)

        // if (debugList && debugList.length)
        //     console.log("%c%s", C.consts.fmtOK, `F: заполнено из ${incl.ori}: `, ` [ ${debugList.join('\n')} ]`)

        return n
    }
}