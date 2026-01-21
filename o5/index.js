/**
 * o5 — ESM-библиотека с динамически подключаемыми feature-модулями.
 *
 * Архитектура:
 * - index.js — orchestrator
 * - com/     — общее API (C)
 * - <name>/  — feature-модули с init()
 *
 * Feature-модуль:
 * - не имеет сайд-эффектов при импорте
 * - экспортирует функцию init()
 *
 * Подключение (пример) :
 * <script type="module" src="/o5/index.js" data-modules="inc,shp,snd"></script>
 */

// import { initCom } from './com/com.js'
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
            const
                src = `./${name}/${name}.js`,
                module = C.modules.find(m => m.name === name)
            try {
                const mod = await import(src)

                // await 
                mod.init?.(C, name)
                module.ready = 1
                if (C.debug)
                    console.log(`загрузилось '${name}'`)

            } catch (e) {
                module.ready = -1
                console.error('%c%s', C.fmtErr, `'${src}': `, `ошибка загрузки`, e)
            }
        }
    }

if (names && names.length) {
    const
        fmtOK = "background: cornsilk; color: black;",
        fmtErr = "background: yellow; color: black;"
    C.scrpts = {}
    C.owners = []
    C.urlrfs = {
        _root: new window.URL(location).origin + '/',
        _html: buri.substring(0, buri.lastIndexOf('/') + 1),
        _olga: urlJS.substring(0, urlJS.lastIndexOf('/') + 1),
    }
    C.urlcns = {}
    C.dataset = { ...script.dataset }

    C.consts = {
        debug: 0, nomnu: 0, noact: 0, timLoad: 3, fmtOK: fmtOK, fmtErr: fmtErr,
        doscr: 'olga_sdone',
        depends: "inc; pop:ref,snd; ref= inc; snd:ref; shp=snd, ref; mnu; tab",
    }

    C.modules = names.map(name => (Object.seal({ name, ready: 0, inited: false })))

    for (const name of names)      // добавляю которые уже в скомпилированном (делать отдельно от "for (const script of document.scripts) ")                
        C.scrpts[name] = Object.seal({
            done: false
        })

    loadScripts()   //names.map(name => `./${name}/${name}.js`))
}
else
    console.error(`Нет модулей для обработки 'o7'`)