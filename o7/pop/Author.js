/**
 *  Author.js
 * запрос на путь сохранения размеров окон
 * и (при этом) включение авторского режима .
 * Размеры будут храниться в виде (для этого модуля - несущественно):
 * sizes = {
        id11: {w: 640, h: 420, sw: 1920, sh: 1080    }
        id12: {w: 640, h: 420, sw: 1920, sh: 1080    }
    }
    Здесь id1, id2 => id теговов для которых хранятся размеры всплывающих окон (без id размеры не сохраняются)    


 * inits = {
        dirName: 'popB',       // полный путо (типа './o7/store') браузер НЕ покажет
        dirHandle: null,
    }
 */

import { DB } from './DB.js'
import { FS } from './FS.js'

let C, dirKey;
const storeName = 'common'

export const Author = {

    prepare: function (c, key) {
        C = c
        dirKey = key
    },

    chooseFolder: function () {
        let isDisabled = true, dirHandle = null

        return new Promise(resolve => {
            // dirHandle = null
            const
                showErr = err => {
                    nogrant.style.opacity = 1
                    nogrant.textContent = err
                },
                acceptFolder = async () => {
                    if (!isDisabled) {
                        try {
                            await DB.dbSet(storeName, dirKey,  dirHandle)

                            if (await FS.init(dirHandle))
                                close(dirHandle)
                            else
                                showErr('Запись в папку запрещен - повторите выбор')
                        }
                        catch (err) {
                            console.error(err)
                        }
                    }
                },
                close = result => {
                    document.removeEventListener('keydown', onKeyDown)
                    overlay.remove()
                    resolve(result)
                },
                updateAcceptState = () => {
                    // const ok = !!dirHandle && !!path.value.trim()
                    isDisabled = !dirHandle || !path.value.trim()  // !ok
                    accept.classList[isDisabled ? 'add' : 'remove']('is-disabled')
                },
                onKeyDown = e => {
                    if (e.key === 'Escape') {
                        e.preventDefault()
                        close(null)
                        return
                    }
                    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
                        acceptFolder()
                        e.preventDefault()
                        // close(dirHandle)
                    }
                },
                selectDir = async () => {
                    nogrant.style.opacity = 0
                    try {
                        const handle = await window.showDirectoryPicker({
                            mode: 'readwrite',
                            startIn: 'documents',
                        })

                        if (handle.kind !== 'directory') {
                            showErr(`Адрес '${handle.name}' не папка - повторите`)
                            return
                        }

                        // const perm = await handle.requestPermission({ mode: 'readwrite' })
                        let perm = await handle.queryPermission({ mode: 'readwrite' })
                        if (perm !== 'granted')
                            perm = await handle.requestPermission({ mode: 'readwrite' })

                        if (perm === 'granted') {
                            dirHandle = handle
                            path.value = handle.name || ''
                            updateAcceptState()
                        }
                        else
                            showErr('Доступ к папке запрещен - повторите выбор')

                    } catch (err) {
                        console.warn('Выбор папки отменён', err)
                    }
                }

            document.addEventListener('keydown', onKeyDown)

            // overlay
            const overlay = document.createElement('div')
            overlay.className = 'author overlay'

            // dialog
            const box = document.createElement('div')
            box.className = 'author box'

            // title
            const title = document.createElement('div')
            Object.assign(title, {
                className: 'author title',
                textContent: 'Авторский режим',
            })

            // text
            const text = document.createElement('div')
            Object.assign(text, {
                className: 'author text',
                textContent: 'Выбор папки сохранения размеров окон',
            })

            // nogrant
            const nogrant = document.createElement('div')
            Object.assign(nogrant, {
                className: 'author nogrant',
                textContent: '?',
            })

            // path field
            const path = document.createElement('textarea')
            Object.assign(path, {
                className: 'author path',
                rows: 1,
                readOnly: true,
                placeholder: 'Папка не выбрана',
                title: 'кликните, чтобы выбрать\nпапку сохранения размеров окон',
                onclick: selectDir,
            })

            // buttons row
            const row = document.createElement('div')
            row.className = 'author row'

            // cancel
            const cancel = document.createElement('button')
            Object.assign(cancel, {
                textContent: 'Отменить',
                className: 'author cancel button',
                title: 'Не включать авторский режим.\n(и не выбирать папку сохранения)',
                onclick: () => { close(null) },
            })

            // right buttons
            const right = document.createElement('div')
            right.className = 'author right'

            // choose
            const choose = document.createElement('button')
            Object.assign(choose, {
                textContent: 'Выбрать',
                className: 'author choose button',
                title: 'Выбрать папку сохранения размеров окон',
                onclick: selectDir,
            })

            // accept
            const accept = document.createElement('button')
            Object.assign(accept, {
                textContent: 'Принять',
                className: 'author accept button is-disabled',
                title: 'Подтвердить авторский режим\n(и принять папку сохранения )',
                onclick: () => acceptFolder(),
            })

            // build
            right.append(choose, accept)
            row.append(cancel, right)
            box.append(title, text, path, nogrant, row)
            overlay.append(box)
            document.body.append(overlay)
                ;

            // асинхронное чтение из БД        
            (async () => {
                try {
                    dirHandle = await DB.dbGet(storeName, dirKey)

                    if (dirHandle) {
                        // dirHandle = inits.dirHandle
                        // path.value = inits.dirName
                        // updateAcceptState()
                        const perm =                            await dirHandle.queryPermission({ mode: 'readwrite' })
                        if (perm === 'granted') {
                            path.value = dirHandle.name
                            updateAcceptState()
                        }
                        else {
                            console.error(`Права не равны 'granted' для dirKey='${dirKey}'`)
                            dirHandle = null
                        }
                    }
                }
                catch (err) {
                    console.error(err)
                }
            })()

            setTimeout(() => {
                choose.focus()
            }, 0)
        })
    }
}