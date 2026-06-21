/**
 * Программа динамического тестирования OPath.js
 * 
 * Прелставлен набор вложенных тегов <div> 
 * После запуска тестируются теги, перечисленные в переменной list. 
 * Результаты отображаются в логе DevTools и (наглядно) в заголовках самих div'ов. 
 * Но!
 * Потом можно кликнуть на <body> и результаты будут очищены.
 * А каждый клик по любому div будет (кумулятивно) выполнять его тестирование
 */
import { OPath } from '../../../o7/pop/OPath.js'
const debug = 3

const list =
    // ['a1.1', 'a1.2.1.2', 'a2.1', 'a1.1']
    ['a1.2.1.2']

// проверка запуска автономно или из вставленного html     
if (document.scripts[0]?.hasAttribute('isopathtest'))
    window.addEventListener('DOMContentLoaded', initTest)
else
    window.addEventListener('o_included', initTest)

let divs, shift = ''
function print(el) {
    const aidO7 = el.aidO7 || ''
    if (el.firstChild?.nodeType === Node.TEXT_NODE)
        el.firstChild.nodeValue = aidO7
    console.log(shift + el.className, ' --> ', aidO7)
    if (el.children?.length) {
        shift = shift + '    '
        for (const child of el.children)
            if (child.nodeName === 'DIV')
                print(child)
        shift = shift.substring(4)
    }

}
function doClick(e) {
    const div = e.target.closest('div')

    if (div) {
        OPath.create(div)
        const opath = OPath.create(div)
        const el = OPath.getEl(opath)
        if (el !== div)
            throw new Error(`Ошибка восстановления ${opath}`)
    } else
        if (e.target === document.body) {
            document.querySelectorAll('*').forEach(el => {
                delete el.aidO7
            })
        }
    print(document.body)
}

function initTest() {
    const bases= document.getElementsByClassName('OPathTest')
    if (!bases?.length > 0)
        return

    divs = bases[0].getElementsByTagName('DIV')

    OPath.prepare({ debug })

    for (const cls of list) {
        const tag = document.getElementsByClassName(cls)[0]
        if (!tag) {
            console.error(`Нет тега для className=${cls}`)
            continue
        }
        // debugger    // остановка перед очередным шагом отладки

        tag.aidO7 = tag ? OPath.create(tag) : '?'

        console.groupCollapsed('тег=' + tag.className, ' --> ', tag.aidO7, ' ==> =', tag === OPath.getEl(tag.aidO7))
        print(document.body)
        console.groupEnd()
    }

    document.addEventListener('click', doClick)
}