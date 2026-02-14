/* global window, document, console, alert, Promise, Map */
/*jshint asi:true  */
/*jshint strict:true  */
/*jshint esversion: 6 */

import { C } from '../index.js'
import { Act } from './Act.js'

const maps = new Map(),
btnNames=[],        // тут будут 'stop', 'play', 'pause'
    btns = {},    
        getBtnUrl = atr => {
            const ori = W.urlrfs[atr] //, atr: atr }
    
            if (ori) {
                const url = C.decodeUrl(ori, atr) // || ori
                if (url != ori.url)
                    act.urlattrs.Push({ snd: atr, atr: atr, url: url, ori: ori })
                return url
            }
        }

export const Imgs = {
    makeImgPlay: (aO7, SetEventListeners) => { 
        GetImgForRef(aO7.parms.image_play)
            .then(nimg => {
                console.log(`MakeImgPlay.GetImgForRef.then() для ='${aO7.name}' с image_play=${aO7.parms.image_play}`)
                const img = aO7.image.stop,
                    newimg = nimg.new ? nimg.img : nimg.img.cloneNode(false)

                Object.assign(newimg, {
                    id: (img.aO7snd.id ? img.aO7snd.id : C.getObjName(img.aO7snd)).replace('_stop', '') + '_play',
                    aO7snd: img.aO7snd, // тут НЕ делать новый, в создавать ссылку
                    title: img.aO7snd.title,
                })
                CopyStyle(img, newimg)
                aO7.image.play = newimg

                SetEventListeners(newimg)

                newimg.style.display = 'none'
                img.parentNode.insertBefore(newimg, img.nextSibling)
                if (aO7.sound.state != W.state.stop) {
                    aO7.image.stop.style.display = 'none'
                    aO7.image.play.style.display = aO7.act.dspl
                }
            })
            .catch(err => {
                C.ConsoleError(`MakeImgPlay.${err}`)
            })
    },
    prepare:()=>{
        for (const name in W.state)
            btnNames.push(W.state[name])
      for (const name of btnNames) {
            const ori = W.consts[`btn-${name}`],
                url = C.decodeUrl(ori, name) // || ori

            btns[name].src = url
            btns[name] = getBtnUrl(`btn-${name}`)
        }
        // }
        const urlatr = Imgs.prepImage(aO7, btns)
        if (urlatr.snd)
            act.urlattrs.Push(urlatr)
    },
    clear:()=> {
        for (const map of maps.values())
            map.destroy()
        maps.clear()
    },
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
            addr = W.getAddrForTag(snd, '', iatr)

        if (addr) {
            if (ori.url) 
                aO7.aplay.image = C.decodeUrl(ori, aO7.name)
            else {
                const iplay = snd.getAttribute(iatr)
                if (iplay) 
                    aO7.aplay.image = C.decodeUrl(iplay, aO7.name)   
                else
                    if (btns.play)
                        aO7.aplay.image = btns.play
            }
        }

        addr = W.getAddrForTag(snd, 'src', '')
            if (addr) {
                const url = C.decodeUrl(addr.ori, snd.aO7snd.name),          
                    src = snd.getAttribute('src')

                if (url && src != url) {
                    SetImgByRef(aO7.snd, url)
                    urlatr = { snd: aO7.name, atr: 'src', url: url, ori: ori }

                } else
                    Act.waitActivate(aO7.image.stop)
            }
            else
                if (btns.stop) SetImgByRef(aO7.snd, btns.stop)
                else
                    console.error(aO7.name, 'PrepImage()', `тег <img>`, '', `Нет вариантов url'а и отсутствует 'btn_stop'`)

            if (addr.atr == 'data-src' || addr.atr == '_src')
                snd.removeAttribute(addr.atr)	// чтоб другие модули не повторяли
        
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
                const 
                imgN = nimg.new ? nimg.img : nimg.img.cloneNode(true),
                aO7snd= img.aO7snd
                    imgN.id= img.id
                    imgN.title= img.aO7snd.title
                imgN.name = C.getObjName()
                    
                const aO7 = imgN.aO7snd= {...img.aO7snd}
                
                

                Object.assign(aO7, { snd: imgN, id: imgN.id })
                CopyStyle(img, imgN)
                aO7.image.stop = imgN

                Act.waitActivate(imgN)

				imgN.setAttribute(C.myInclude, '1')
                img.parentNode.insertBefore(imgN, img.nextSibling)
                img.parentNode.removeChild(img)
                img = null
            })
            .catch(reject => {
                C.ConsoleError(reject.err, reject.url.replace(/https?:\/\//, ''))
            })
    }