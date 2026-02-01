export function showC(C) {
    const
        Fill = (name) => {
            const arr = []
            if (C[name])
            for (const [key, val] of Object.entries(C[name]))
                arr.push({ key, val })
            return arr
        }

    const
        consts = Fill('consts')
        // urlrfs = Fill('urlrfs')

        console.groupCollapsed("%c%s", C.consts.fmtOK, `константы С`); {
            console.table(consts)
            console.groupEnd()
        }
        // console.groupCollapsed(`адреса`); {
        //     console.table(urlrfs)
        //     console.groupEnd()
        // }
        // console.groupEnd()
    // }
}