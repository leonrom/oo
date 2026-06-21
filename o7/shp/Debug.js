import { Frame } from './Frame.js'
import { PBases } from './PBases.js'

let C;
export const Debug = {
    prepare: function (c, clsn) {
        C = c
    },
    ShowRez: (aO7) => {
        const
            // head = ` после "${Array.from(aO7s).map(aO7 => aO7.name).join(', ')}"`,
            // head = ` после '${aO7.name}'`,
            rez = []

        // for (const aO7 of aO7s)
        rez.push({
            aO7: aO7.name,
            tagCut: aO7.frms.tagCut?.id ?? 'null',
            base: aO7.pBase.pO5.name,
            frms: Array.from(aO7.frms.frames).map(f => f.pO5.cnst.id).join(', ')
        })
        C.ConsoleInfo(` после '${aO7.name}'`)

        rez.length = 0
        for (const { bO5, pBase } of PBases)
            rez.push({
                base: pBase.pO5.name,
                pOuts: ' ' + (Array.from(pBase.pO5.pOuts)).map(p => p.name).join(', '),
                // pIncs: ' ' + (Array.from(pBase.pO5.pIncs)).map(p => p.name).join(', '),
                aAll: ' ' + pBase.aAll.map(tag => tag.id).join(', ')
            })
        C.ConsoleInfo('', `Базы   ` + rez.length, rez)

        rez.length = 0
        for (const { bO5, pBase } of PBases)
            for (const pOut of pBase.pO5.pOuts)
                rez.push({
                    base: pBase.pO5.name,
                    pOut: pOut.name,
                    pOuts: ' ' + (Array.from(pOut.pOuts)).map(p => p.name).join(', '),
                    // pIncs: ' ' + (Array.from(pOut.pIncs)).map(p => p.name).join(', ')
                })
        C.ConsoleInfo('', `pOuts  ` + rez.length, rez)

        rez.length = 0
        for (const { key, frame } of Frame) {
            rez.push({
                key: key,
                tcn: frame.typ + ':' + frame.cod + ':' + frame.num,
                pO5: frame.pO5.name,
                aOfs: frame.aOfs.map(a => a.name).join(', '),
            })
        }
        C.ConsoleInfo('', `Фреймы ` + rez.length, rez)
    },
}