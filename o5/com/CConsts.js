/* global document, window, console*/
/* exported olga5_menuPopDn_Click*/
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
        CurScr = (script, _olga) => {
            const orig = _olga ? script.dataset?.src?.replace(/\s+/g, '') : ''
            if (_olga && !orig.startsWith('+')) // это файл не модуль для o7  
                return

            const
                src = _olga ? _olga + orig.substring(1) : script.src,
                name = src.match(/([^/]+)\.[^.]+$/)?.[1] ?? '',
                isComp = name.endsWith('!')

            return Object.freeze({
                dataset: script ? { ...script.dataset } : {},
                path: src.replace(/[^/]+$/, ''),
                src: src,
                name: name,
                orig: orig,
                isComp: isComp,
                modul: isComp ? name.slice(0, -1) : name,
            })
        },
        Freeze = obj => {
            for (const field of Object.getOwnPropertyNames(obj)) {
                if (!field.startsWith('_')) continue

                const desc = Object.getOwnPropertyDescriptor(obj, field)
                desc.configurable = false
                if ('value' in desc)
                    desc.writable = false

                Object.defineProperty(obj, field, desc)
            }
            return obj
        },
        cc = {
            urlcns: {},     // константы из адресной строки
            curScr: CurScr(document.currentScript, ''),
            timer: 0, // будет задан и установлен в constructor после FillFromScript
        },
        location = window.location,
        url = new window.URL(location),
        params = Object.fromEntries(new URLSearchParams(location.search))

    C.consts = {
        debug: 0, nomnu: 0, noact: 0, timLoad: 3, fmtOK: fmtOK, fmtErr: fmtErr,
        doscr: 'olga5_sdone',
        pageDones: 'beforeunload, o_unloadPage',
        pageLoads: 'readystatechange:d, message:u, inc_ready',
        depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
    }
    C.urlrfs = {
        _root: url.origin + '/',
        _olga: cc.curScr.src.match(/\S*\//)?.[0],
        _html: url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1),
    }
    C.scrpts = {}

    // сохраняю константы из адресной строки
    for (const nam in params)
        cc.urlcns[nam] = TryToDigit(params[nam])
    Object.freeze(cc.urlcns)

    FillFromScript(C, cc.curScr.dataset, cc.urlcns)

    Object.freeze(C.consts)
    Object.freeze(C.urlrfs)

    C.ListModuls()

    cc.timer = setTimeout(() => C.Finish('таймер'), C.consts.timLoad * 1000)
    debug = C.consts.debug
    console.log('C created', C)
}