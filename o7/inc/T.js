
/**
 * список тегов, который д.б. заполнены
 * id вставляемых тегов д.б. уникальны 
 * (т.е. 1 раз можно id=='', но последующие будут проигнорированы.)
 */
import { C } from '../index.js'

export class T {
    static #qtags = new Map()
    static #inserts = []

    constructor(tag, frag) {
        this.tag = tag
        this.frag = frag
        this.ready = false

        Object.seal(this)
    }

    static add(tag, frag) {
        if (!T.#qtags.get(tag.id)) {
            T.#qtags.set(tag.id, new T(tag, frag))
            return true
        }
    }
    static fillTags() {
        let n = 0
        for (const [id, qtag] of T.#qtags) {
            if (!qtag.ready) {
                const frag = qtag.frag
                if (frag.done) {
                    // if (!frag.tpl)
                    //     debugger;
                    const
                        start = document.createComment(`inc:start '${frag.sel}'`),
                        end = document.createComment('inc: end '),
                        node = frag.tpl
                            ? frag.tpl.content.cloneNode(true)
                            : document.createComment(`\n¿ inc: EMPTY (selector '${frag.sel}') ?`)

                    const fragWrap = document.createDocumentFragment()
                    fragWrap.append(start)
                    fragWrap.append(node)
                    fragWrap.append(end)

                    if (C.consts.debug > 1) 
                        console.log(`T: добавлено к id='${qtag.tag.id}' из '${frag.sel}' в "${frag.incl.ori}":`, fragWrap) 
                    // {   ------------ пока не убирай -- пока не убирай -- пока не убирай -- пока не убирай -- пока не убирай 
                    //     const tmp = document.createElement('div')
                    //     tmp.appendChild(fragWrap.cloneNode(true))
                    //     console.log(
                    //         `T: добавил к id='${qtag.tag.id}' из '${frag.sel}' в "${frag.incl.ori}":\n`,
                    //         tmp.innerHTML
                    //     )
                    // }
                    qtag.tag.appendChild(fragWrap)

                    T.#inserts.push({ start, end })
                    qtag.ready = true
                    n++
                }
            }
        }
        return n
    }
    static clear() {
        T.#qtags.clear()
    }
    static removeInserts() {
        for (const { start, end } of T.#inserts) {
            let n = start.nextSibling
            while (n && n !== end) {
                const next = n.nextSibling
                n.remove()
                n = next
            }
            start.remove()
            end.remove()
        }

        T.#inserts.length = 0
    }
}