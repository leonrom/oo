/**
 * OPath.js
 * модуль pop
 *  
 * Использование компактного сериализуемого DOM-пути для уникальной идентификации обрабатываемых тегов.
 * Функции: 
 *      create(el) - построение строкового идентификатора aidO7 элемента (т.с. пути к нему)
 *      getEl(aidO7) - нахождение элемента по aidO7
 * 
 * Цель: 
 *  Хранение в IndexDB уникальной ссылки на элемент DOM для его идентификации между сессиями работы с документом.
 *  При этом, рекомендуется рядом со ссылкой (идентификатором aidO7) сохранять и outherHTML-копию элемента 
 *  для проверки (после считывания) его правильности - на случай изменения документа между сессиями
 * 
 * Оригинальность:
 *   - идентификатор aidO7 присваивается каждому просмотренному узлу DOM, что позволяет при построении пути не "добираться" до узла с id, а использовать информацию в ближайшем узле, содержащем aidO7;
 *     При этом DOM-дерево постепенно само себя индексирует через aidO7
 *   - для хранения пути используется "максимально минималистический"  формат: номера дочерних элементов разделены символом '.'. 
 *     Нумерация - с нуля (первый дочерний - .0) 
 *     При этом возможные точки в id тегов экранируются двумя последовательными точками
 *   - хранение aidO7 прямо в DOM-узлах (а не в отдельный Map<Element, string>) позволяет легко идентифицировать их в DevTools
 * 
 * В отличие от XPath идентификатор строится 'лениво' от ближайшего уже известного якоря лишь при первом обращении к элементу и не содержит излишних (ненужных) имен тегов.
 * А по сравнению с CSS-путями данный алгоритм дает не только более короткую и легче-читаемую запись, но и не требует querySelector'а для нахождения элемента (в рамках поставленной задачи)
 * 
*/

let C;

function iChild(el, children) {
    let i = children.length
    while (i-- > 0)
        if (children[i] === el)
            return i
}

function decode(ref) {
    const
        idx = ref.search(/(?<!\.)\.(?=\d)/),
        path = idx >= 0 ? ref.substring(idx) : '',
        id = idx >= 0 ? ref.substring(0, idx) : ref

    return {
        elBase: id
            ? document.getElementById(id.replace(/\.\./g, '.'))
            : document.documentElement,
        noms: path.split('.'),
    }
}

function fillBack(elFound, pathFull) {
    /**
     * Заполнение ВСЕЙ цепочки 'pathFull', начиная от elFound -ближайшего найденного в дереве
     * Ниже:  
     *      elBase - начало всей цепочки, 
     *      noms - child-номера её узлов
     */
    let { elBase, noms } = decode(pathFull)

    if (C?.debug > 2)
        console.log('начало= ' + (elFound.className || 'html'), ' --> ', pathFull, noms,
            '  -------------------------------- база= ', (elBase?.className || 'html'))

    if (noms) {
        let
            path = '',
            el = elBase,
            found = el === elFound

        for (const nom of noms)
            if (nom) {          //  первый л-т массива тут "пустая строка"
                el = el.children[nom]
                path = path + '.' + nom

                if (found) { // пропускаю стоящие выше по дереву - они уже обработаны
                    if (el.aidO7 && el.aidO7 !== path)  // проверка однократности заполнения
                        throw new Error(
                            `Ранее определённый путь "${el.aidO7}"
не совпадает с ново определённым "${path}"

Сообщите разработчику.`
                        )

                    el.aidO7 = path

                    if (C?.debug > 2)
                        console.log(el.className, '-->', path, ` (${nom})`)
                }

                if (el === elFound)
                    found = true
            }
    }
}


export const OPath = {
    prepare: function (c) {
        C = c
    },

    getEl: function (ref) {
        let
            { elBase, noms } = decode(ref),
            el = elBase

        if (noms)
            for (const nom of noms) 
        if (nom){
                const i = Number(nom)
                if (isNaN(i) || i >= el.children.length || i < 0) {
                    console.error(`Недопустимый индекс в nom='${nom}' элемента к тегу "${el.aidO7}", содержащему ${el.children.length} элементов`)
                    return null
                }

                el = el.children[i]
            }
        return el
    },

    create: function (el0) {
        let
            path = '',    // будет содержать цепочку для исходного значения 'el0'
            el = el0        // будт наёдена ближайшее определённое в дереве

        do {
            if (C?.debug > 2)
                console.log(el.className)

            if (el.aidO7) {
                path = el.aidO7 + path
                break
            }
            else
                if (el.id &&
                    document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1
                ) {
                    const id2 = el.id.replace(/\./g, '..')
                    el.aidO7 = id2
                    path = id2 + path
                    break
                }

            const parent = el.parentElement
            if (!parent) {    // родителя нет - значит это <html>
                el.aidO7 = ''
                break
            }

            path = '.' + iChild(el, parent.children) + path

            // el.aidO7 = path

            el = parent
        }
        while (true)

        fillBack(el, path)

        return path
    }

}