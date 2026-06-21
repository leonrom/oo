// сделать:
// сохранение в текущей (с *.html) папке размеров окон для каждого тега. 
// подгружать этот файл и считывать из него

// сделать 

// задавать разеры окон в тегах  ?

// вариант появления подсказки рядом с курсором


/**
 * Pop.js
 * обработка всплавающих окон для тегов с class="olga-pop"
 *  
 * класс содержит 3 квалификатора:
 *  - событие всплытия
 *  - геометрия окна
 *  - url загрузки
 * параметры 
        popDelay: 0.5, // задержка в с. для всплытия подсказки
        popDelta: 0.5, // задержка перед закрытием после всплытия окна
        deltaXY: 2,   // к-во пикселов при которых есть "перемещение"
        maxWnds: 5,   // к-во одновременно открытых окон  (удаляться будет самое древнеиспользованое) 
 */

import { FS } from './FS.js'
import { DB } from './DB.js'
import { AO7 } from './AO7.js'
import { Wnd } from './Wnd.js'
import { Div } from './Div.js'
import { Init } from './Init.js'
import { Pick } from './Pick.js'
import { Drag } from './Drag.js'
import { Author } from './Author.js'

// в arch пишет без версии в имени

// import { chooseAuthorFolder } from './Author.js'

async function askFolder() {
    const dirHandle =
        await Author.chooseFolder()

    if (dirHandle) {
        console.log('Размеры сохраняются ', dirHandle)

        window.authorDirHandle = dirHandle
        Wnd.setAuthor(true)
    }
}

const
    modul = 'pop',
    clasN = 'olga-' + modul,
    clasW = clasN + '-wnd',
    pB = '2px solid gray',
    aB = 'medium double black'

export const W = Object.freeze({
    modul: modul,
    act: Object.seal({ auto: -1 }),
    consts: Object.seal({
        popDelay: 0.5, // задержка в с. для всплытия подсказки
        popDelta: 0.5, // задержка перед закрытием после всплытия окна
        deltaXY: 2,   // к-во пикселов при которых есть "перемещение"
        maxWnds: 5,   // к-во одновременно открытых окон   
        author: 0,     // авторский режим
        nVers: 5, // количество версий конфигурации
    }),
    prepare: function (C) {
        const
            cs = this.consts,
            pn = location.pathname,
            stem = pn
                .split('/')
                .pop()
                .replace(/\.[^.]+$/, ''),
            key = pn
                .substring(0, pn.lastIndexOf('/'))
                .toLowerCase()

        Pick.prepare(C, cs.popDelay, cs.popDelta, cs.deltaXY)
        Init.prepare(C, clasN)
        Wnd.prepare(C, clasW, cs.maxWnds)
        Div.prepare(C, clasW)
        Drag.prepare(C)
        AO7.prepare(C, stem)
        DB.prepare(C)
        FS.prepare(C, cs.nVers, stem)
        Author.prepare(C, key)
    },
    init: function () {
        Init.init()
        Pick.init()
        Wnd.init()
        AO7.init()

        if (!this.act.auto)
            window.dispatchEvent(new CustomEvent('o_done', { detail: { module: W.modul, err: false } }))

        if (this.consts.author)
            askFolder()
    },
    reset: function () {
        Init.reset()
        Wnd.reset()
    },
    // ----------------------------
    makeCss: () => `
.${clasW} {
    background:#fff;
    border:1px solid gray;
    box-shadow:0 4px 20px rgba(0,0,0,.2);
    display:flex;
    flex-direction:column;
    font:14px sans-serif;
    border-radius: 4px;
}
.${clasN} {
    cursor:zoom-in;
}
.${clasN}.o-hover {
    cursor:help;
}
/* во время drag */    
.${clasW}.${Drag.DRING} {
    user-select: none;
    opacity:0.4;
}
/* Пульсирующий ореол */
.${clasN}.${AO7.M.oSHOW} {
    animation: sndGlow 1.4s ease-in-out infinite;
}
@keyframes sndGlow {
    0% { filter: drop-shadow(0 0 4px yellow); }
    50% { filter: drop-shadow(0 0 8px blue); }
    100% { filter: drop-shadow(0 0 4px red); }
}
.wnd-bar {
    background:transparent;
    padding: 4px;
    display: flex;
    white-space: nowrap;
    justify-content: space-between;
    height: 0.8em;
    padding-top: 0;
}
.wnd-bar.${Div.ACT} {
    background:lightskyblue;
}
.wnd-head {
    width: -webkit-fill-available;
    white-space: nowrap;
    font-size: small;
}
/* отключаем iframe полностью */
.${clasW}.${Drag.DRING}  .wnd-frame ,
.${clasW}.${Drag.SIZE}   .wnd-frame {
    pointer-events: none;
    /* visibility:hidden; */    
}
.wnd-btns {
    min-width: fit-content;
    height: fit-content;
    padding-right:0.15em;
}
.wnd-open{
    font-weight: bold;
}
.wnd-open-big{
    font-weight: bold;
    font-size: 1.25em;
}
.wnd-open,
.wnd-close {
    width: 1.4em;
    height: 1em;
    padding: 0;
    font-size: 0.8em;
    line-height: 1.1em;
    text-align: center;
    background: lightpink;
    color: black;
    border: none;
    border-radius: 50%;
    cursor: pointer;
}

.wnd-open:hover,
.wnd-close:hover {
    outline:1px solid lightred;
    background: #e74c3c;
    color: white;
}

.wnd-body {
    border-top: 1px solid lightgray;
    position:relative;
    overflow: auto;
    flex:1;
}
.wnd-frame {
    width:100%;
    height:100%;
    border:none;
    position: absolute;
}

.wnd-loader {
    position:absolute;
    inset:0;
    display:block;
    align-items:center;
    justify-content:center;
    background:#fff;
    display: flex;
    flex-direction: column;
    justify-content: center; /* вертикально */
    align-items: center;     /* горизонтально */
    text-align: center;
    width: 100%;
    height: 100%;
}
.wnd-loader-url{
    color:blue;
    font-style: italic;
}

.wnd-resize{
    position: absolute;
    z-index: 10;
    bottom: 0;
    background: transparent;
    height: 0.8em;
    width: 0.8em;
}
.wnd-resize.T{
    top: 0;   
    border-top: ${pB};
}
.wnd-resize.L{
    left: 0;
    border-left: ${pB};
}
.wnd-resize.T.R{
    width: 0.3em;
}
.wnd-resize.R{
    right: 0;
    border-right: ${pB};
}
.wnd-resize.B{
   border-bottom: ${pB};
}
.wnd-resize.T:hover{
   border-top: ${aB};
}
.wnd-resize.L:hover{
   border-left: ${aB};
}
.wnd-resize.R:hover{
   border-right: ${aB};
}
.wnd-resize.B:hover{
   border-bottom: ${aB};
}

/* можно визуально подсветить */
.${clasW}.${Drag.SIZE} {
    outline: 1px dashed #888;
}
/*
.wnd-dring{
    width:0;
    height:0;
    border:none;
    display:none;
    opacity:0.24;
    position: absolute;
    background: lightskyblue;
}
*/
/*  отображение drag-resize */

.${clasW} :is(.wnd-head, .wnd-body) {
    cursor: grab;
}
.${clasW} :is(.wnd-resize.L.T, .wnd-resize.R.B) {
    cursor: nwse-resize;
}
.${clasW} :is(.wnd-resize.T.R, .wnd-resize.L.B) {
    cursor: nesw-resize;
}

.${clasW}.${Drag.SHIFT} :is(.wnd-head, .wnd-body) {
    cursor:move;
}
.${clasW}.${Drag.SHIFT} :is(.wnd-resize.L.T, .wnd-resize.R.B),
.${clasW}.${Drag.SHIFT} :is(.wnd-resize.T.R, .wnd-resize.L.B) {
    cursor: grab;
}

.${clasW}.${Drag.DRING} :is(.wnd-head, .wnd-body),
.${clasW}.${Drag.DRING} :is(.wnd-resize.L.T, .wnd-resize.R.B),
.${clasW}.${Drag.DRING} :is(.wnd-resize.T.R, .wnd-resize.L.B),
.${clasW}.${Drag.SIZE} :is(.wnd-head, .wnd-body),
.${clasW}.${Drag.SIZE} :is(.wnd-resize.L.T, .wnd-resize.R.B),
.${clasW}.${Drag.SIZE} :is(.wnd-resize.T.R, .wnd-resize.L.B) {
    cursor: grabbing;
}    
/*
.${clasW}.${Drag.SIZE}  .wnd-dring {
    width:100%;
    height:100%;
    display:block;
}
    */

.author.overlay{
    position: fixed;
    inset: 0;
    z-index: 999999;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
}
.author.box{
    min-width: 320px;
    max-width: 420px;
    padding: 20px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 10px 40px rgba(0,0,0,0.35);
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.author.button{
    padding: 10px 18px;
    color: black;
    font-size: medium;
    font-weight: normal;
    border-radius: 5px;
    border-style:solid;
    border-width:1px;
    cursor: pointer;
}
.author.cancel{
}
.author.choose    {
}
.author.accept{
    font-weight: bold;
    cursor :pointer;
    border-width:2px;
}
.author.accept.is-disabled{
    color: gray;
    cursor: default;
    font-weight: normal;
    border-style: dotted;
    border-width:1px;
}
.author.right    {
    display: flex;
    gap: 10px;
}
.author.title    {
    font-size: 20px;
    font-weight: 600;
}
.author.text    {
    line-height: 1.4;
    opacity: 0.85;
}
.author.row{
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: -13px;
}    
.author.path{
    resize: none;
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
    font-size: 14px;
    line-height: 1.4;
    height: 3em;
    cursor: pointer;
}
.author.nogrant {
    color: black;
    background: yellow;
    border: 1px red solid;
    border-radius: 6px;

    font-size: small;
    font-family: serif;
    align-self: anchor-center;
    padding-left: 5px;
    padding-right: 5px;
    opacity: 0;
}
    `,
});

// проверка автономности. не надо try/catch,- и так выдаст "Uncaught (in promise) TypeError: Failed to fetch"
(async function () { (await import(`../com/Auto.js`)).Auto(W) })()

/*
кроме shiftKey - аналогично 2 клавиши мыши
перетаскивание и изменение размеров  - один модулю, просто:
   вызов по заголовку или телу - drag, а при shiftKey  - размеры
   вызов по wnd-reasize - наоборот
добавить это в описание !!
*/