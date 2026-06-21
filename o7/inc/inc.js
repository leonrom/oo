/* global document, window, console, CustomEvent, XMLHttpRequest */
/*jshint asi:true  */
/*jshint esversion: 6*/

import { I } from './aI.js'
import { F } from './aF.js'
import { T } from './aT.js'

let _runId = 0, C;

// const _clear = function () {  // немножко освободить память
//     I.reset()
//     F.reset()
//     T.reset()
// }

export const W = Object.freeze({
    modul: 'inc',
    consts: Object.seal({
        getall: true,
        o_include: 'o_include'
    }),
    act: Object.seal({ runId: 0, auto: -1 }),
    prepare: function (c) {
        C = c
        I.prepare(C, this)
        F.prepare(C)
        T.prepare(C)
    },
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
            if (C.consts.debug){
                console.groupCollapsed('%c%s', C.consts.fmtOK, `'inc' - загрузки окончены: `)
                console.log( I.listIncls())
                console.groupEnd()        
            }

        I.reset()
        F.reset()
        // _clear()

        window.dispatchEvent(new CustomEvent('o_done', { detail: { module: W.modul, err: errs } }))
        window.dispatchEvent(new CustomEvent('o_included'))
    },
    // ----------------------------
    reset: () => {
        I.abortLoads()
        // _clear()

        if (C.consts.debug)
            console.log('%c%s', C.consts.fmtOK, `'inc' - загрузка прервана новым запуском`)

        I.reset()
        F.reset()
        T.reset()
    },
    // insertIncls: incl => {
    //     F.fillFrags(incl)
    //     T.fillTags()
    // },
    selectIncls: incl => {
        const
            oinc = W.consts.o_include,
            oincM = oinc + '-',
            debugList = C.consts.debug ? [] : null,
            isHidden = tag => tag.getClientRects().length === 0

        let tags = document.querySelectorAll(`[data-${oinc}]`)
        if (!tags?.length)
            tags = document.querySelectorAll(`[${oinc}]`)

        let wasOldis = false, n = 0
        for (const tag of tags)
            if (!tag.hasAttribute(oincM)) {
                const ref = tag.dataset[oinc]?.trim() ||
                    tag.getAttribute(oinc)?.trim() ||
                    ''

                tag.setAttribute(oincM, 1)

                if (!ref) {
                    const err = `тег id='${tag.id}' - пустой атрибут '${oinc}';`
                    if (!isHidden(tag)) C.ConsoleErro(`${err} `, `  тег проигнорирован!`)
                    else
                        if (!W.consts.getall && C.consts.debug)
                            C.ConsoleInfo(`${err} `, `  тег проигнорирован, т.к. невидимый`)

                    continue
                }

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

        if (debugList?.length){
                console.groupCollapsed(`К загрузкам: ` +(incl ? `вставка '${incl.ori}'` : 'исходный document') + ` ('↵' - считываемый)`)
                console.log(`:\n` + debugList.join('\n'))
                console.groupEnd()
        }
    }
});

// проверка автономности. не надо try/catch,- и так выдаст "Uncaught (in promise) TypeError: Failed to fetch"
(async function () { (await import(`../com/Auto.js`)).Auto(W) })()