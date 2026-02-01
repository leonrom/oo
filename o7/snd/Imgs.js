/* global window, document, console, alert, Promise, Map */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { doAct } from './doAct.js'
const maps = new Map()
export const Imgs = {
    // makeImgPlay: (aO7, SetEventListeners) => { //  StartSound, 
    //     GetImgForRef(aO7.parms.image_play)
    //         .then(nimg => {
    //             console.log(`MakeImgPlay.GetImgForRef.then() для ='${aO7.name}' с image_play=${aO7.parms.image_play}`)
    //             const img = aO7.image.stop,
    //                 newimg = nimg.new ? nimg.img : nimg.img.cloneNode(false)

    //             Object.assign(newimg, {
    //                 id: (img.aO7snd.id ? img.aO7snd.id : C.MakeObjName(img.aO7snd)).replace('_stop', '') + '_play',
    //                 aO7snd: img.aO7snd, // тут НЕ делать новый, в создавать ссылку
    //                 title: img.aO7snd.title,
    //             })
    //             CopyStyle(img, newimg)
    //             aO7.image.play = newimg

    //             SetEventListeners(newimg)

    //             newimg.style.display = 'none'
    //             img.parentNode.insertBefore(newimg, img.nextSibling)
    //             if (aO7.sound.state != 'stop') {
    //                 aO7.image.stop.style.display = 'none'
    //                 aO7.image.play.style.display = aO7.modis.dspl
    //             }
    //         })
    //         .catch(err => {
    //             C.ConsoleError(`MakeImgPlay.${err}`)
    //         })
    // },
    regiBySrc: img => new Promise(() => {  // Resolve, Reject) => {
        if (img && img.src) {
            const src = img.src,
                url = FullUrl(src),
                s = url == src ? '' : `(src=${src})`,
                isinmap = maps.get(url)

            if (!isinmap)
                maps.set(url, { img: img.cloneNode(true), err: '' })
            if (C.consts.debug > 1)
                console.log(`${lognam} olga_Imgs ${isinmap ? 'повтор  ' : 'добавлен'} url=${url} для img.id='${img.id}' ${s}`)
        }
        else
            console.error(`olga_Imgs : попытка добавить` + (img ? ` пустой src для img.id='${img.id}'` : ` пустой  <img>`))
    }),
    prepImage: (aO7, btns) => {
        const
            snd = aO7.snd,
            iatr = 'image_play'

        let urlatr = {},
            ori = W.getUrlForTag(snd, '', iatr)

        if (ori) {
            if (ori.url) 
                aO7.parms.image_play = C.decodeUrl(ori) || ori // а сам aO7.image.play будет (при задании 'image_play') создан лишь при обращении            
            else {
                const iplay = snd.getAttribute(iatr)
                if (iplay) 
                    aO7.parms.image_play = C.decodeUrl(iplay)||iplay                
                else
                    if (btns.play)
                        aO7.parms.image_play = btns.play
            }
        }

        ori = W.getUrlForTag(snd, 'src', '')
        if (ori) {
            if (ori.url) {
                const url = C.decodeUrl(ori) || ori,        
                    src = snd.getAttribute('src')

                if (url && src != url) {
                    SetImgByRef(aO7.snd, url)
                    urlatr = { snd: aO7.name, atr: 'src', url: url, 'ориг.': ori.url }

                } else
                    doAct.waitActivate(aO7.image.stop)
            }
            else
                if (btns.stop) SetImgByRef(aO7.snd, btns.stop)
                else
                    console.error(aO7.name, 'PrepImage()', `тег <img>`, '', `Нет вариантов url'а и отсутствует 'btn_stop'`)

            if (ori.atr == 'data-src' || ori.atr == '_src')
                snd.removeAttribute(ori.atr)	// чтоб другие модули не повторяли
        }
        return urlatr
    }
}


const
    a = document.createElement('a'),
    lognam = `snd.Imgs`,
    FullUrl = (url) => {
        if (C.isFullUrl(url)) return url
        else {
            a.href = url
            return a.href
        }
    },
    GetImgForRef = (ref) => new Promise((Resolve, Reject) => {
        if (!ref)
            Reject(`Неопределённая 'ref'-ссылка`)

        const url = FullUrl(ref),
            // maps = imgs.maps,
            map = maps.get(url)

        if (map) Resolve({ img: map.img, new: false })
        else {
            /*	https://codeengineered.com/blog/09/12/performance-comparison-documentcreateelementimg-vs-new-image/
            For now I’m going to continue to use document.createElement('img'). 
            Not only is this the w3c recommendation but it’s the faster method in IE8, the version users are slowly starting to adopt.
            */
            if (C.consts.debug > 1)
                console.log(`${lognam} olga_Imgs создание нового для url=${url}`)

            const nimg = document.createElement('img')
            Object.assign(nimg, { src: url, importance: 'high', loading: 'eager', crossOrigin: null })
            maps.set(url, { img: nimg, err: '' })

            nimg.addEventListener('load', () => {
                if (C.consts.debug > 1)
                    console.log(`${lognam} GetImgForRef: загружен url= ${url}`)
                if (url.trim() == '')
                    alert('url=?')
                Resolve({ img: nimg, new: true })
            }, { once: true })

            nimg.addEventListener('error', e => {
                Reject({ err: `GetImgForRef ошибка: ${e.message ? e.message : 'не определен'}`, url: url })
            }, { once: true })
        }
    }),
    CopyStyle = (img, newimg) => {
        newimg.className = img.className
        if (img.attributes.style) {
            if (!newimg.attributes.style)
                newimg.setAttribute('style', '')
            newimg.attributes.style.nodeValue += img.attributes.style.nodeValue
        }
    },
    SetImgByRef = (img, ref) => { // подставить новый nimg вместо img с 'недествительным' src	
        GetImgForRef(ref)
            .then(nimg => {
                const newimg = nimg.new ? nimg.img : nimg.img.cloneNode(true)
                Object.assign(newimg, {
                    id: img.id, // оставляю тот же id
                    aO7snd: Object.assign({}, img.aO7snd), // тут - НОВЫЙ aO7
                    title: img.aO7snd.title,
                })
                newimg.name = C.MakeObjName()
                const aO7 = newimg.aO7snd

                Object.assign(aO7, { snd: newimg, id: newimg.id })
                CopyStyle(img, newimg)
                aO7.image.stop = newimg

                doAct.waitActivate(newimg)

				newimg.setAttribute(C.myInclude, '1')
                img.parentNode.insertBefore(newimg, img.nextSibling)
                img.parentNode.removeChild(img)
                img = null
            })
            .catch(reject => {
                C.ConsoleError(reject.err, reject.url.replace(/https?:\/\//, ''))
            })
    }