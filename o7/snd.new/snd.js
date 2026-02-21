import { Bind } from './Bind.js'
import { Cur } from './Cur.js'
const C={is_ready:false}  // сюда импортну

export const W = {
    needs: {
        shift_speed: 0.5, // при Shift - замедлять вдвое;
        return_time: 0.3, // при возобновлении "отмотать" 0.3 сек ;
        btn_play: '',
        btn_stop: '',
    },
    clasn: 'olga-snd',
    act: Object.seal({
        autonom: true,
        audio: null,
        ready: false,
        errs: [],
        found: [],
        urlattrs: [],
    }),
    // Вспомогательный метод для получения C
    getC: async function () {
        if (C.is_ready) return C; // Если уже загружена, отдаем сразу
        try {
            const module = await import('../index.js');
            Object.assign(C,  module.C)
            return C;
        } catch (e) {
            console.error("Не удалось загрузить C:", e);
            return null;
        }
    },            // заглушка для автономного C
    setC: function () {
        Object.assign(C,  {
            decodeUrl: ori => {
                return new URL(ori, document.baseURI).href
            }   // тут никакого декодирования
        })
    },
    prepare: async function (isAutonomous = false) {
        const shm = { name: '?', ref: '', url: '', ori: '' },
            err = { name: '?', 'источник': '?', 'пояснение': '', val: '', 'ошибка': '' }

        this.act.errs.Push = function (obj) { C.shmPush(W, obj, err) }
        this.act.found.Push = function (obj) { C.shmPush(W, obj, shm) }
        this.act.urlattrs.Push = function (obj) { C.shmPush(W, obj, shm) }

        AO7.prepare(C)
        Bind.prepare(C, W.clasn)

        this.act.autonom = isAutonomous
        if (W.act.autonom) // В автономном режиме C нам вообще не нужна
            this.setC()
        else
            this.getC() // В фоновом режиме запускаем загрузку, но НЕ ЖДЕМ её через await
    },
    finish: function () {
        window.dispatchEvent(new CustomEvent(C.E.o_done, { detail: { modul: W.modul, act: 'done' } }))
    },
    init: async function () {
        if (!W.act.autonom)
            await this.getC();
        Bind.init(W.clasn)
    },
    reset: function () {
        const act = W.act
        Object.assign(act, { audio: null, ready: false })
        act.urlattrs.length = 0
        act.found.length = 0
        act.errs.length = 0

        // Eve.stopForStop()

        // Imgs.clear()
        // AO7.reset()

        Bind.destroy()
        Cur.destroy()
    },

    someAction: async function () {
        // Пример метода, где C реально нужна
        const ClassC = await this.getC();
        if (ClassC) {
            new ClassC().doSomething();
        }
    }
}

// if (document.head.innerHTML.indexOf('/snd.js') >= 0) // скрипт вызван автономно
//     document.addEventListener('DOMContentLoaded', W.prepare)
// else {
//     const src = `../index.js`
//     try {
//           ({ C } = await import(src)); // Скобки обязательны 
//     } catch (e) {
//         console.error(`ошибка загрузки '${src}': `, e)
//     }
// }