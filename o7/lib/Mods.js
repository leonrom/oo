/**
 * Mods.js
 * в составе lib.js
 * 
 * Выполненеи модулей поочередно для каждого уровны
 * 
 * Модули однного уровня могут выполняться параллельно. 
 * Переход к следующему уровню - после выполнения (успешного ил нет)  всех модуле в данном
 * 
 */
const
    slevels0 = " inc, dbg, pop; mnu, shp, snd; ref, tab",   // очерёдности исполнения - м.б. переопределены в data-levels
    module0 = { name: '', loaded: 0, state: 0, mod: 0, tStart: -1 },
    IS = Object.freeze({ IDLE: 'idle', RUNNING: 'running', DONE: 'done' })

let C;

export const Mods = {
    clr: "background: blue; color: white;border: none;",
    levels: [],
    prepare: function (c) {
        C = c
        this.levels.length = 0
    },
    startModules: function () {
        for (const level of this.levels)
            if (level.modules.length) {
                level.done = false
                for (const module of level.modules)
                    module.state = IS.IDLE
            }
            else
                level.done = true
    },
    processModules: function () {
        for (const level of this.levels)
            if (!level.done) {
                let done = true
                for (const module of level.modules) {
                    if (module.loaded && module.state === IS.IDLE) {  // загружен, но еще не выполнялся                    
                        const W = module.mod.W
                        if (W.act?.auto || !C.isDefined(W.init))    // выполнен автономно или не требуется инициализация
                            module.state = IS.DONE
                        else {
                            try {
                                if (C.consts.debug > 1)
                                    console.log('%c%s', C.consts.fmtOK, ` ${module.name} `, ` - попытка выполнить модуль`)
                                module.state = IS.RUNNING
                                module.tStart = performance.now()
                                W.init()
                            }
                            catch (e) {
                                console.error(e)
                            }
                        }
                    }

                    if (module.state !== IS.DONE)
                        done = false
                }
                if (!done)     // другие уровни уже не смотрим
                    break

                // level.done = true
            }
    },
    markDone: function (name) {
        let module;
        for (const level of this.levels) {
            module = level.modules.find(m => m.name === name)
            if (module) {

                module.state = IS.DONE

                level.done = !level.modules.find(m => m.state !== IS.DONE)

                // this.processModules()

                if (C.consts.debug) {
                    const dt = performance.now() - module.tStart
                    console.log('%c%s', this.clr, `модуль ${name}`, 'завершен init() ', (dt.toFixed() + ' ms').padStart(12))
                }
                break
            }

        }

        if (!module)
            C.ConsoleAlert(`Неизвестный модуль '${name}' в markDone`)

        for (const level of this.levels)
            if (!level.done) {
                this.processModules()
                return
            }

        return true
    },
    getErrs: function () {
        const sdone = [], sload = []
        for (const level of this.levels)
            for (const module of level.modules)
                if (module.loaded <= 0) sload.push(module.name + '/' + module.loaded)
                else
                    if (module.state !== IS.DONE)
                        sdone.push(module.name)

        return { sdone, sload }
    },
    makeLevels: function () {
        const
            slevels = C.dataset?.levels || slevels0,
            alevels = slevels.split(';')

        for (const alevel of alevels)
            this.levels.push(
                Object.seal({
                    names: alevel.trim().split(/\s*,\s*/),
                    modules: [],
                    done: false
                })
            )

        const names =
            (C.dataset?.modules || slevels)     // список подклчаемых скриптов
                .trim().split(/\s*[;,\s]+\s*/g) // если не указан, то список подклчаемых скриптов

        for (const name of names)
            if (name && name !== 'com')     // 'com' не требуется включать - он уже загружен и отработал 
                for (const level of this.levels)
                    if (level.names.includes(name)) {
                        level.modules.push(
                            Object.seal({ ...module0, name })
                        )
                        break
                    }
    }
}