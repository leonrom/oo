/**
 * ESM-библиотека с динамически подключаемыми feature-модулями.
 *
 * Архитектура:
 * - index.js — orchestrator
 * - com/     — общее API (C)
 * - <name>/  — feature-модули с prepare()
 *
 * Feature-модуль:
 * - не имеет сайд-эффектов при импорте
 * - экспортирует функцию prepare()
 *
 * Подключение (пример) :
 * <script type="module" src="./index.js" data-modules="inc,shp,snd"></script>
 */

import { com } from './com/com.js'
import { fillW } from './com/fillW.js'

export const C = {}

const
    buri = document.baseURI,
    urlJS = new URL(import.meta.url, buri).href,
    script = [...document.scripts].find(s =>
        s.src && new URL(s.src, document.baseURI).href === urlJS
    ),
    dataset = script?.dataset ?? {},
    names = dataset.modules?.trim().split(/\s*,\s*/g),
    loadScripts = async function load() {
        for (const name of names) {
            const src = `./${name}/${name}.js`,
                module = C.modules[name]
            try {
                module.mod = await import(src)

                if (C.consts.debug > 1)
                    console.log(`загружен '${name}'`)

                if (module.mod.W)
                    fillW(name)

                const e = new CustomEvent('o_loaded', { detail: { name } })
                window.dispatchEvent(e)

            } catch (e) {
                module.mod = null
                console.error('%c%s', C.consts.fmtErr, `'${src}': `, `ошибка загрузки`, e)
            }
        }
    },
    // очерёдности исполнения - м.б. переопределены в data-levels
    levels = { com: 0, inc: 1, dbg: 1, mnu: 2, shp: 2, snd: 2, ref: 3, tab: 4 }

const j = names.indexOf('com')      // вообще-то не следовало задавать'com; в списке модулей
if (j >= 0) names.splice(j, 1)

if (names && names.length) {
    C.dataset = { ...script.dataset }
    C.myInclude = 'data-o7-inc'
    C.modLevels = {}
    C.modules = {}
    C.cleanup = []   //   подборка функций очистки вставок
    C.owners = []
    C.consts = {
        debug: 0, nomnu: 0, noact: 0, timLoad: 3,
        fmtOK: "background: cornsilk; color: black;",
        fmtErr: "background: yellow; color: black;",
        doscr: 'olga_sdone',
        depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
        _root: new window.URL(location).origin + '/',
        _html: buri.substring(0, buri.lastIndexOf('/') + 1),
        _olga: urlJS.substring(0, urlJS.lastIndexOf('/') + 1),
    }
    C.isDefined = c => typeof c !== 'undefined'
    C.splitStr = str => str.replace(/(#|\/\/).*$/gm, '') // убрать комментарии        
        .split(/[,;]/)	                			 // разбить на выражения
        .map(s => s.trim())
        .filter(Boolean)

    if (dataset.levels) {       // подстановка уровней из скрипта
        const alvls = C.splitStr(dataset.levels)
        for (const alvl of alvls) {
            const [name, level] = alvl.split(/\s*:\s*/)
            if (names[name])
                levels[name] = level
        }
    }

    let mi = NaN, ma = NaN
    for (const name of names) {
        const level = levels[name]
        if (isNaN(mi) || mi > level) mi = level
        if (isNaN(ma) || ma < level) ma = level
    }
    for (const name of names) {
        if (!C.isDefined(levels[name])) levels[name] = ma + 1
        const level = levels[name];
        (C.modLevels[level] ??= []).push(name)
        C.modules[name] = Object.seal({ level: level, mod: 0, executed: false })
    }
    C.modLevels.mi = mi
    C.modLevels.ma = ma

    Object.freeze(C.dataset)
    Object.freeze(C.modules)
    Object.freeze(C.modLevels)

    com(C)
    fillW.execute()
    loadScripts()   //names.map(name => `./${name}/${name}.js`))
}
else
    console.error(`Нет модулей для обработки `)