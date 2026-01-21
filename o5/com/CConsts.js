/* global document, window, console*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/

/**
 * считывание констант из командной строки и  из файлов
 * @param {C} мутируемый объект
 */

import { C } from '../index.js'

export function extendC(C) {
    let debug = 1
    const
        IsUnDefined = c => typeof c === 'undefined',
        TryToDigit = x => {
            if (IsUnDefined(x)) return 1
            const
                val = ('' + x).replace(/^(['"`])([\s\S]*)\1$/, '$2'),
                vf = parseFloat(val)
            if (vf == val) {
                const vc = parseInt(val)
                if (vc == val) return vc
                return vf
            }
            else
                switch (val) {
                    case '': return 1
                    case 'true': return true
                    case 'false': return false
                    default:
                        return val
                            .replace(/\s*\n+\s*/g, ';')
                            .replace(/\t+/g, ' ')
                            .trim();
                }
        },
        FillFromScript = (Z, _dataset, _consts) => {  //  здесь Z м.б. W или C, а _dataset, _consts - из C  
            const
                dataset = (Z.load && Z.load.dataset) ? Z.load.dataset : _dataset,
                ForNeedData = z => {      // поиск констант, заявленных в _needs
                    const _needs = z._needs
                        .replaceAll(/\n|;|[#|\/\/].*$/gm, ',')
                        .replace(/,\s*,|\s+,\s+/g, ',')
                        .split(',')
                    for (const need of _needs) {
                        const
                            ss = need.split('='),
                            nam = ss[0].trim()
                        if (nam && !z[nam]) {
                            z[nam] = ss[1].trim()  // не был найден среди name (consts или urlrfs)
                            for (const name in dataset)
                                if (nam === name)
                                    z[nam] = dataset[name]  // перебираю все - беру последний
                        }
                    }
                },
                FromNamedData = z => {      // доминирования заявленых индивидуально
                    for (const name in dataset)
                        if (!IsUnDefined(z[name]))
                            z[name] = dataset[name]
                },
                FromCommonData = (z, name) => {   // обработка data-consts и data-urlrfs
                    const
                        cnsts = dataset[name]?.split(';') ?? [],
                        isconst = name === 'consts'
                    for (const cns of cnsts) {
                        const
                            ss = cns.split('='),
                            c = ss[0].trim()
                        if (c && c[0] !== '#') {
                            const v = ss[1].trim()
                            if (isconst) z[c] = TryToDigit(v)
                            else
                                if (v && v[0] !== '#')
                                    z[c] = v
                        }
                    }
                }

            for (const name of ['consts', 'urlrfs']) {
                const z = Z[name]
                FromCommonData(z, name)
                FromNamedData(z)
                if (z._needs)
                    ForNeedData(z)
            }

            // "полировка" константами адресной строки
            for (const c in _consts)
                Z['consts'][c] = _consts[c]
        },
        params = Object.fromEntries(new URLSearchParams(window.location.search))

    // сохраняю константы из адресной строки
    for (const nam in params)
        C.urlcns[nam] = TryToDigit(params[nam])

    FillFromScript(C, C.dataset, C.urlcns)

    Object.freeze(C.consts)
    Object.freeze(C.urlrfs)
    Object.freeze(C.urlcns)
}