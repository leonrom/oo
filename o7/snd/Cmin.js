/**
 * Минимизированное ядро библиотеки
 * Определяет минимальную структуру общего модуля 'C' с ограничениями.
 *  
 * Основные из ограничений:
    обрабатывается весь html-файл (никаких проверок по 'olga-start')
    debug м.б. только 0 если не указан (в адресной строке), иначе 3 независимо от его значения
    ConsoleInfo и ConsoleError - отсутствует специальная обработка массивов
    все константы (для C.consts и W.consts) берутся только из data-consts
    символические имена ссылок (в константах) могут быть только прямыми адресами (косвенные не допускаются)
    диагностика ошибок при декодировке ссылок - отсутствует    

 */

// добавить проверку от "двойного" подключения !!!!!!!!!!!!!!!!!!!!!!!

const
    askModul = modul => { // содержит ли текущий скрипт имя 'modul' в конце url'а
        const m = new RegExp(`.*\\/${modul}\\.js(\\b|\\?|&|#)`)
        for (const script of [...document.scripts])
            if (script.src && script.src.match(m))
                return script
    },
    getForName = (parent, typ, name) => {
        switch (typ) {
            case 'myclass': return parent.querySelectorAll(`[class*="${name}"]`)
            case 'class': return parent.getElementsByClassName(name)
            case 'node': return parent.getElementsByTagName(name)
        }
        return []
    }

export function Cmin(W, modul) {
    const addr = new URL(document.URL),
        match = addr.search.match(/\bdebug\b/),
        debug = match && match[0] ? 3 : 0,
        script = askModul(modul),
        autonom = script?.dataset.modules,
        fmtErr = "background: yellow; color: black;",
        fmtOK = "background: cornsilk; color: black;"

    if (debug)
        console.log('%c%s', fmtOK, `модуль '${modul}' `,
            `запущен ${autonom ? 'автономно' : 'в составе библиотеки'}`)

    if (!autonom)   // вызывающий скрипт не есть этот модуль 
        return

    W.autonom = true
    let idn = 0
    const
        C = {
            consts: { debug, fmtErr, fmtOK },
            getObjName: tag => {
                return tag.id ? tag.id : tag.nodeName + '#.' + tag.className
            },
            decodeUrl: url => {
                for (const c in C.consts)
                    if (url === c)
                        return C.consts[c]

                return url
            },
            makeForTypName: (make, typ, modul, only1) => {
                const list = getForName(document, typ, modul)
                for (let i = 0; i < list.length; i++) {
                    make(list[i])
                    if (only1)
                        return
                }
            },
            ConsoleInfo: function (...args) { console.log("%c%s", fmtOK, ...args) },
            ConsoleError: function (...args) {
                console.log("%c%s", fmtErr, ...args)
                debugger
            }
        },
        startAutonom = () => {
            W.prepare(C)
            W.init()
        },
        cs = script.dataset.consts,
        ss = cs.split(/\s*[,;]\s*/)  // пары имя=значение для констант

    for (const s of ss) {
        const us = s.split(/\s*=\s*/)
        C.consts[us[0]] = us[1] || ''
        if (W.consts) {
            for (const [key, val] of Object.entries(C.consts))
                if (W.isDefined(C.consts[key]))
                    W.consts[key] = val

            Object.freeze(W.consts)
        }
    }
    Object.freeze(W)

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', startAutonom)
    else
        startAutonom()
}