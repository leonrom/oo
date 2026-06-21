/**
 * Prep.js
 * в составе lib.js
 * 
 * Подготавливает модули для расчетов и подгружеет их.
 * Модули задаются строковым параметром, в котором модули одного уровня разделяются, а уровни (группы модулей в уровне) - ';'
 * По факту загрузки каждого из запускается (в Page) попытка инициализации всех (в т.ч. и загруженного) неинициализированных модулей
 * 
 * Заодно подставляются именованные ссылки в теги <link>
 */
import { Mods } from './Mods.js'

let C;
const
    convertLinks = () => {
        const
            from = 'href',
            froms = [`${from}`, `data-${from}`, `_${from}`],
            debug = C.consts.debug,
            links = [],
            errs = []
        for (const tag of document.head.children) {
            const attrs = tag.attributes
            if (tag.tagName.toLowerCase() == 'link' && !attrs[froms[0]]) {
                const str = attrs[froms[1]] || attrs[froms[2]]
                if (str) {
                    const url = C.decodeUrl(str)
                    if (url !== str) {
                        replaceTag('link', tag, 'href', url, errs)
                        if (debug)
                            links.push({ orig: str, src: url })
                    }
                }
                else
                    C.ConsoleError(`обнаружен <link> без '${from}', 'data-${from}' или '_${from}': `, tag.outerHTML)
            }
        }
        if (errs.length)
            C.ConsoleError(`Ошибки обработкии <link>`, errs.length, errs)

        if (debug)
            if (links.length) C.ConsoleInfo("Скорректированны LINK'и : ", links.length, links)
            else C.ConsoleInfo("Скорректированных LINK'ов нет ")
    },
    loadScripts = async function load() {   // все начинают грузиться параллельно!
        const promises = []
        for (const level of Mods.levels)
            for (const module of level.modules) {
                const promise = (async () => {
                    const src =
                        C.consts._olga +
                        `${module.name}/${module.name}.js`

                    try {
                        module.mod = await import(src)
                        if (C.consts.debug)
                            console.log('%c%s', C.consts.fmtOK, `Загружен '${module.name}'`)

                        module.loaded = 1
                        const W = module.mod.W

                        if (W) {
                            C.fillW(W, module.name)
                            W.act.auto = 0
                        }

                        Mods.processModules()

                    } catch (e) {
                        console.error('%c%s', C.consts.fmtErr, `'${src}'- `, e)
                        module.loaded = -1
                    }
                })()

                promises.push(promise)
            }

        void Promise.all(promises).catch(e => {
            console.error(`Загрузка скриптов:`, e)
        })
    },
    replaceTag = (tagName, tag, adrName, url, errs) => {
        const
            addnew = document.createElement(tagName),
            regExp = new RegExp(/[\\+<>'"`=#\\/\\\\]/)
        let err = false
        for (const attr of tag.attributes) {
            if (!err && attr.name.match(regExp)) {
                errs.push({ tag: tagName, ref: attr.name, txt: `cодержит кавычки или '+><=#/'` })
                err = true
            }
            else
                try {
                    addnew.setAttribute(attr.name, attr.value) // здесь копирую "как есть" 
                } catch (err) {
                    errs.push({ tag: tagName, ref: url, txt: (attr.name + '=' + attr.value), err: err.message })
                }
        }
        addnew.setAttribute(adrName, url)

        tag.replaceWith(addnew)
        // tag.parentNode.insertBefore(addnew, tag)
        // tag.parentNode.removeChild(tag) //  ??  а вот удалять  -м.б. и не надо: для контроля

        return addnew
    }

export const Prep = {
    prepare: function (c) {
        C = c
        convertLinks()
        Mods.makeLevels()

        void loadScripts()
            .catch(e => {
                console.error(`Загрузка скриптов: `, e)
            })

        // if (C.modules.dbg) {
        //     (async function load() {
        //         const src = './CDebug.js'
        //         try {
        //             const mod = await import(src)
        //             mod.showC(C)
        //         } catch (e) {
        //             console.error('%c%s', C.consts.fmtErr, `'${src}': `, `ошибка загрузки`, e.message)
        //         }
        //     })()
        // }
    },
    reset: function () {
        for (const level of Mods.levels)
            for (const module of level.modules) {
                const W = module.mod.W
                if (W && W.reset)
                    W.reset()
            }
    },
}