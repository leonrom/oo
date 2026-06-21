import { DB } from './DB.js'
import { AO7 } from './AO7.js'

let C, fileStem, fileName, nVers = 5

const tStart = Date.now()

async function saveArch(ver) {
    const { dirHandle } = await DB.dbGet('inits')

    try {
        const
            archHandle = await dirHandle.getDirectoryHandle(
                'arch',
                { create: true }
            ),
            pageArchHandle = await archHandle.getDirectoryHandle(
                fileStem,
                { create: true }
            ),
            fileHandle = await pageArchHandle.getFileHandle(
                `${fileStem}.${ver}.json`,
                { create: true }
            ),
            writable = await fileHandle.createWritable()

        await writable.write(
            JSON.stringify(AO7.sizes, null, 2)
        )
        await writable.close()
    }
    catch (err) {
        console.error('Ошибка записи архивного файла:', err.name, '\n' + err.message)
    }
}

async function saveSizes() {
    const { dirHandle } = await DB.dbGet('inits')

    try {
        const
            fileHandle = await dirHandle.getFileHandle(
                fileName,
                { create: true }
            ),
            writable = await fileHandle.createWritable()

        await writable.write(
            JSON.stringify(AO7.sizes, null, 2)
        )

        await writable.close()
        return true
    }
    catch (err) {
        console.error('saveSizes(): ошибка записи файла конфигурации:', err.name, '\n' + err.message)
    }
}

// async function loadSizes(name) {
//     const { dirHandle } = await DB.dbGet('inits')

//     try {
//         const
//             fileHandle = await dirHandle.getFileHandle(name),
//             file = await fileHandle.getFile()

//         return JSON.parse(await file.text())
//     }
//     catch (err) {
//         console.log(`Ошибка загрузки/парсинга '${name}':`, err.name, '\n'+err.message)
//     }
//     return {}
// }

export const FS = {

    prepare(c, nvers, stem) {
        C = c
        nVers = nvers
        fileStem = stem
        fileName = stem + `.json`
    },

    async init(dirHandle) {
        // // AO7.sizes = await loadSizes(fileStem + `.json`)
        // const { dirHandle } = await DB.dbGet('inits')
        try {
            const
                fileHandle = await dirHandle.getFileHandle(fileName),
                file = await fileHandle.getFile()

            AO7.sizes = JSON.parse(await file.text())
        }
        catch (err) {
            AO7.sizes = null
            if (C.consts.debug)
                console.log(`init(): ошибка загрузки/парсинга  '${fileName}':`, err.name, '\n' + err.message)
        }

        if (!AO7.sizes)
            AO7.sizes = { ':tStart': tStart, ':version': '0', }

        // const ok = await saveSizes()  // создание нового и/или проверка возможности записи
        return AO7.sizes
    },

    async toFile(aO7) {
        if (tStart !== AO7.sizes[':tStart']) {  // резервная копия
            AO7.sizes[':tStart'] = tStart

            const ver = Number(AO7.sizes[':version']?.replace(/\b0+/, '')) || 0
            await saveArch(ver)

            AO7.sizes[':version'] = ('' + ((ver < nVers) ? (ver + 1) : 0))
                .padStart(('' + nVers).length, '0')
        }

        if (!AO7.sizes[aO7.tag.id])
            AO7.sizes[aO7.tag.id] = {}

        Object.assign(AO7.sizes[aO7.tag.id], aO7.wsize)

        await saveSizes()

        if (C.consts.debug)
            console.log(`Для '${aO7.name}' сохранены в '${fileName}' размеры: w=${aO7.wsize.w}, h=${aO7.wsize.h} и др.`)
    }
}