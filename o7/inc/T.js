
/**
 * список тегов, который д.б. заполнены
 * id вставляемых тегов д.б. уникальны 
 * (т.е. 1 раз можно id=='', но последующие будут проигнорированы.)
 */
import { C } from '../index.js'

export function trimFragment(fragment) {
    // trim начала
    while (fragment.firstChild) {
        const n = fragment.firstChild
        if (n.nodeType !== Node.TEXT_NODE) break
        if (!n.nodeValue.trim())
            n.remove()
        else {
            n.nodeValue = n.nodeValue.trimStart()
            break
        }
    }
    // trim конца
    while (fragment.lastChild) {
        const n = fragment.lastChild
        if (n.nodeType !== Node.TEXT_NODE) break
        if (!n.nodeValue.trim())
            n.remove()
        else {
            n.nodeValue = n.nodeValue.trimEnd()
            break
        }
    }
}

export class T {
    static #qtags = new Map()
    static #inserts = []

    constructor(tag, frag) {
        this.tag = tag
        this.frag = frag
        this.ready = false

        Object.seal(this)
        T.#qtags.set(tag.id, this)
    }

    static has(tag) {
        return T.#qtags.has(tag.id)
    }
    static fillTags() {
        let n = 0
        for (const [id, qtag] of T.#qtags) {
            if (!qtag.ready) {
                const frag = qtag.frag

                // ? trimFragment(frag.tpl.content.cloneNode(true))
                if (frag.done) {
                    // if (!frag.tpl)
                    //     debugger;
                    const
                        start = document.createComment(`inc:start---[${frag.sel}]`),
                        end = document.createComment('inc:--end '),
                        node = frag.tpl
                            ? frag.tpl.content.cloneNode(true)
                            : document.createComment(`\n¿ inc: EMPTY (selector [${frag.sel}]) ?`)

                    trimFragment(node)
                    // trimFragment(end)
                    const fragWrap = document.createDocumentFragment()
                    fragWrap.append(start)
                    fragWrap.append('\n')
                    fragWrap.append(node)
                    fragWrap.append('\n')
                    fragWrap.append(end)

                    if (C.consts.debug > 1)
                    // console.log(`T: добавлено к id='${qtag.tag.id}' из '${frag.sel}' в "${frag.incl.ori}":`, fragWrap) 
                    {  //  ------------ пока не убирай -- пока не убирай -- пока не убирай -- пока не убирай -- пока не убирай 
                        const tmp = document.createElement('div')
                        tmp.appendChild(fragWrap.cloneNode(true))
                        console.log(
                            `T: добавил к id=${("'" + qtag.tag.id + "'").padEnd(6)} из '${frag.sel.padEnd(12)}' в "${frag.incl.ori}":\n`,
                            tmp.innerHTML
                        )
                    }
                    qtag.tag.appendChild(fragWrap)

                    T.#inserts.push({ start, end })
                    qtag.ready = true
                    n++
                }
            }
        }
        return n
    }
    static reset() {
        T.#qtags.clear()
    }
    static removeInserts() {
        let i = T.#inserts.length
        while (i-- > 0) {
            const { start, end } = T.#inserts[i]
            if (start.isConnected && end.isConnected) {
                let n = start.nextSibling
                while (n && n !== end) {
                    const next = n.nextSibling
                    n.remove()
                    n = next
                }
                start.remove()
                end.remove()
            }
        }

        T.#inserts.length = 0
    }
}