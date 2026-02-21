/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'
import { I } from './I.js'
import { F } from './F.js'
import { T } from './T.js'

let _runId = 0

const _clear = function () {  // немножко освободить память
    I.reset()
    F.reset()
    T.reset()
}

export const W = {
    needs: { getall: true, o_include: 'o_include' },
    act: Object.seal({ runId: 0, }),
    init: function () {
        if (_runId++)
            this.reset()

        this.act.runId = _runId
        this.selectIncls(null)
    },
    finish: function () {
        const errs = I.getErrs()
        if (errs)
            C.ConsoleError(`'inc' - загрузка окончена с ошибками:`, errs)
        else
            if (C.consts.debug)
                console.log('%c%s', C.consts.fmtOK, `'inc' - загрузки окончены: `, I.listIncls())

        _clear()

        window.dispatchEvent(new CustomEvent(C.E.o_done, { detail: { modul: W.modul, act: 'done' } }))
    },
    // ----------------------------
    reset: () => {
        I.abortLoads()
        _clear()

        if (C.consts.debug)
            console.log('%c%s', C.consts.fmtOK, `'inc' - загрузка прервана новым запуском`)

        T.removeInserts()
    },
    insertIncls: (incl) => {
        F.fillFrags(incl)
        T.fillTags()
    },
    selectIncls: (incl) => {
        const
            checkMark = '?',
            doubles = new Set(),
            debugList = C.consts.debug ? [] : null,
            tags =
                document.querySelectorAll(`[data-${W.consts.o_include}]`)
                || document.querySelector(`[${W.consts.o_include}]`),
            isHidden = tag => tag.getClientRects().length === 0

        let wasOldis = false, n = 0
        for (const tag of tags) {
            const
                ref = tag.dataset[W.consts.o_include]?.trim() ||
                    tag.getAttribute(W.consts.o_include)?.trim() ||
                    '',
                isChecked = ref && ref[0] === checkMark,
                ioldTag = T.has(tag)

            let err = ''
            if (!isChecked) {
                if (!ref) err += `пустой атрибут '${W.consts.o_include}';`
                if (!W.consts.getall && isHidden(tag) && C.consts.debug)
                    err += `Тег проигнорирован, т.к. невидимый`

                if (ioldTag) {  //  перепроверка наличия дубля
                    const ids = document.querySelectorAll(`[id='${tag.id}']`)
                    if (ids && ids.length > 1)
                        doubles.add(tag.id)
                }
                if (err) {
                    tag.setAttribute(W.consts.o_include, checkMark + ref)
                    C.ConsoleError(err, ` - тег id='${tag.id}'`)
                }
            }
            if (err || isChecked || ioldTag)
                continue

            // if (tag.id==='c1')
            //     debugger
            const
                ss = ref?.split(/[?]/),
                ori = ss[0].trim(),
                sel = ss[1]?.trim() || '',
                i = I.get(ori, W.act.runId),
                f = F.add(sel, i.incl)

            new T(tag, f.frag)

            if (debugList) {
                debugList.push(`incl ${i.old ? ' ' : '↵'}      ${ori}`)
                debugList.push(`   frag ${f.old ? ' ' : '↵'}    ${sel.padEnd(10)} ${i.incl.ori}`)
                debugList.push(`       tag     ${i.incl.ori}  ${f.frag.sel}`)
            }

            if (i.old && i.incl.ready) {
                wasOldis = true
                F.fillFrags(i.incl)
            }
            n++
        }

        if (wasOldis)
            T.fillTags()
        else
            if (n == 0 && I.isDone())
                W.finish()

        if (doubles.size && C.consts.debug)
            C.ConsoleInfo(`"${incl ? incl.ori : 'document'}" повторы id: `,
                `[ ${Array.from(doubles).join(', ')} ] - игнорируются !`)

        if (debugList?.length)
            console.log(`добавлено для загрузок: ` +
                (incl ? `вставка '${incl.ori}'` : 'исходный document') + ` ('↵' - считываемый)` +
                `:\n` + debugList.join('\n'))
    }
}
