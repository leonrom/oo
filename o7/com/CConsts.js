/* global document, window, console*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/

/**
 * дополнение API и
 * считывание констант из командной строки и  из файлов
 * @param {C} мутируемый объект
 */

import { C } from '../index.js'

export function CConsts() {
    C.tryToDigit = x => {
        if (!C.isDefined(x)) return 1
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
    }
    C.addConst = (key, val, consts) => {
        const
            m1 = /^['"`]|['"`]$/g,
            v = val.trim().replace(m1, '')
        consts[key] = C.tryToDigit(v)
    }
    C.addToConsts = (str, consts) => {
        const pars = C.splitStr(str)
        for (const par of pars) {
            const m = par.match(/^([^:=\s]+)\s*[:=]\s*(.+)$/)
            if (m) {
                let [, key, val] = m
                C.addConst(key, val, consts)
            }
        }
    }

    C.getFullUrl = url => {
        try {
            return new URL(url).href
        } catch {
            return false // C.ConsoleError(` '${str}' `, `получается url: "${url}" ?`)
        }
    }

    // const
    //     newUrl = str => {
    C.decodeUrl = (str, name) => {
        if (!str.replace)
            debugger
        const
            rez = [],
            ss = str
                .replace(/\s+#.*$/gm, '')
                .replace(/\s+\/\/.*$/gm, '')
                .replace(/&#43;/g, '+')
                .replace(/\s*(%20|&nbsp;)\s*/g, ' ')
                .trim()
                .split(/\s*\+\s*/),
            L = ss.length

        for (let i = 0; i < L; i++) {
            const s = ss[i]
            if (!s) {
                if (rez.length === 0)
                    rez.push(C.consts._olga)
                continue
            }

            if ((i === L - 1 && L > 1) ||
                s.includes('/') ||
                s.includes(':')
            ) {
                rez.push(s)
                continue
            }

            const u = C.consts[s]
            if (u) rez.push(u)
            else
                console.error('%c%s', C.consts.fmtErr, `Неопределённая ссылка '${s}'`,
            ` в строке "${str}" `+(name?` для тега '${name}'`:''))
        }

        const
            urs = rez.join('/').replace(/(?<!:)\/{2,}/g, '/'),
            addr = new URL(urs, document.baseURI)

        return addr.href
    }

    // isToDecode = str => str && typeof str === 'string' && str.match(/\+|&#43;/)

    // C.decodeUrl = str => {
    //     // если не требуется преобразование, то возвращает пустую строку
    //     return isToDecode(str) ? newUrl(str) : ''
    // }
    C.decodeRfs = (consts, modul) => {
        for (const [key, val] of Object.entries(consts))
            if (typeof val === 'string' && val.match(/\+|&#43;/))
                C.consts[key] = C.decodeUrl(val)

        // const urls = {}

        // for (const [key, val] of Object.entries(consts))
        //     if (isToDecode(val))
        //         urls[key] = val

        // let k;
        // do {
        //     k = 0
        //     for (const [key, val] of Object.entries(urls)) {
        //         if (val) {         // иначе значит, что уже исправлено
        //             const url = C.decodeUrl(val)    // const url = newUrl(val)
        //             if (url!==val) {
        //                 C.consts[key] = url
        //                 urls[key] = ''
        //                 k++
        //             }
        //         }
        //     }
        // } while (k)

        // const errs = []
        // for (const [key, val] of Object.entries(urls))
        //     if (val)
        //         errs.push(`${key}=${val}`)

        // if (errs.length > 0)
        //     C.ConsoleError(`${modul}: недоопределённые ссылки`, errs.length, errs)
    }

    if (C.dataset?.consts)
        C.addToConsts(C.dataset.consts, C.consts)

    const params = window.location.search.split(/\s*\?|,|&\s*/)
    for (const param of params)
        if (param) {
            const ss = param.split(/\s*=\s*/)
            if (ss[0])
                C.addConst(ss[0], ss[1] || '1', C.consts)
        }

    C.decodeRfs(C.consts, 'общий модуль')

    Object.freeze(C.consts)
}