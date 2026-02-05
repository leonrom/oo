/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { C } from '../index.js'
import { T } from './T.js'
import { I } from './I.js'
import { F } from './F.js'

let _runId = 0

export const W = {
    needs: { getall: true },
    act: { runId: 0, },

    execute: function () {
        if (_runId++)
            this._erase()

        this.act.runId = _runId
        this.prepareIncls(document, null)
    },
    finish: function () {
        const errs = I.getErrs()
        if (errs)
            C.ConsoleError(`'inc' - загрузка окончена с ошибками:`, errs)
        else
            if (C.consts.debug)
                console.log('%c%s', C.consts.fmtOK, `'inc' - загрузки окончены. Прочитаны: `, I.listIncls())

        this._clear()

        window.dispatchEvent(new CustomEvent(C.o_IamReady, { detail: { modul: W.modul, } }))
    },
    // ----------------------------
    _erase: () => {
        I.abortLoads()
        W._clear()

        if (C.consts.debug)
            console.log('%c%s', C.consts.fmtOK, `'inc' - загрузка прервана новым запуском`)

        T.removeInserts()
    },
    _clear: function () {  // немножко освободить память
        I.clear()
        F.clear()
        T.clear()
    },
    prepareIncls: (doc, incl) => {
        const
            doubles = [],
            debugList = (C.consts.debug > 1) ? [] : null,
            tags = doc.querySelectorAll(`div[${C.o_include}]`),
            isHidden = tag => tag.getClientRects().length === 0

        for (const tag of tags) {    // группировка по url'ам, чтобы не грузить лишнее
            if (!W.consts.getall && isHidden(tag)) {  // загружать со стиль "displa = 'none'"
                if (C.consts.debug) console.log(`Тег id='${tag.id}' проигнорирован, т.к. невидимый`)
                continue
            }

            const ref = tag.getAttribute(C.o_include).trim()
            if (!ref) {
                console.log("%c%s", C.consts.fmtErr, `пустой атрибут '${C.o_include}'`, ` для тега id='${tag.id}'`)
                continue
            }

            const
                ss = ref?.split(/[?]/),
                ori = ss[0].trim(),
                sel = ss[1]?.trim() || '',
                i = I.get(ori, W.act.runId),
                f = F.add(sel, i.obj),
                err = !T.add(tag, f.obj)

            if (err)
                doubles.push(tag.id)

            if (debugList) {
                debugList.push(`incl ${i.isn?'↵':' '}      ${ori}`)
                debugList.push(`   frag ${f.isn?'↵':' '}    ${sel.padEnd(10)} ${i.obj.ori}`)
                debugList.push(`       tag ${tag.id.padEnd(8)} ${err ? '?' : ' '}   ${i.obj.ori}  ${f.obj.sel}`)
            }
        }

        if (doubles.length)
            console.log("%c%s", C.consts.fmtErr, `"${incl ? incl.ori : 'document'}" повторы id: `,
                `[ ${doubles.join(', ')} ] - игнорируются !`)

        if (debugList?.length)
            console.log(`добавлено для загрузок: ` +
                (incl ? `вставка '${incl.ori}'` : 'исходный document') + ` ('↵' - считываемый)` +
                `:\n` + debugList.join('\n'))
        //     {        // добавлено для загрузок
        //     console.groupCollapsed(`добавлено для загрузок: ` + (incl ? `вставка '${incl.ori}'` : 'исходный document'))
        //     console.log(debugList.join('\n'))
        //     console.groupEnd()
        // }

        if (incl) {
            F.fillFrags(incl)
            T.fillTags()

            if (I.isDone())
                W.finish()
        }
    }
}
