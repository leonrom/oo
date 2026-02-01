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
        const v = val.trim().replace(m1, '')
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

	C.isFullUrl = url => {
	   try {
                return new URL(url)
            } catch {
                return false // C.ConsoleError(` '${str}' `, `получается url: "${url}" ?`)
            }
	}

    const
        newUrl = str => {
            const ss = str
                .replace(/(#|\/\/).*$/gm, '') 	// убрать комментарии        
                .replaceAll(/(&#43;)/g, '+')
                .replaceAll(/\s*(%20|&nbsp;)\s*/g, ' ')
                .trim()
                .split(/\s*\+\s*/),
                path = ss[0] ? C.consts[ss[0]] : C.consts._olga,
                url = (path + '/' + ss[1]).replace(/\/+\//g, '/')

            if (!C.isFullUrl  (url))
                C.ConsoleError(` '${str}' `, `получается url: "${url}" ?`)
            
            return url
        },
        isToDecode = str => str && typeof str === 'string' && str.match(/\+|&#43;/)

    C.decodeUrl = str => {
        // если не требуется преобразование, то возвращает пустую строку
        return isToDecode(str) ? newUrl(str):''
    }
    C.decodeRfs = (consts, modul) => {
        const urls = {}

        for (const [key, val] of Object.entries(consts))
            if (isToDecode(val))
                urls[key] = val

        let k;
        do {
            k = 0
            for (const [key, val] of Object.entries(urls)) {
                if (val) {         // иначе значит, что уже исправлено
                    const url = newUrl(val)
                    if (url) {
                        C.consts[key] = url
                        urls[key] = ''
                        k++
                    }
                }
            }
        } while (k)

        const errs = []
        for (const [key, val] of Object.entries(urls))
            if (val)
                errs.push(`${key}=${val}`)

        if (errs.length > 0)
            C.ConsoleError(`${modul}: недоопределённые ссылки`, errs.length, errs)
    }
    const
        m1 = /^['"`]|['"`]$/g,  // убрать любые внешние кавычки
        params = Object.fromEntries(new URLSearchParams(window.location.search))

    if (C.dataset?.consts)
        C.addToConsts(C.dataset.consts, C.consts)

    for (const key in params)
        C.addConst(key, params[key], C.consts)

    C.decodeRfs(C.consts, 'общий модуль')

    Object.freeze(C.consts)
}