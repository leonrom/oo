/* global  window, console, Map, NamedNodeMap*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 * расширение логирования
 */
import { C } from '../index.js'

export function CEvents() {
    const
        store = new WeakMap(),
        getTagMap = tag => {
            let m = store.get(tag)
            if (!m) {
                m = new Map()
                store.set(tag, m)
            }
            return m
        },
        getEventMap = (tagMap, eve) => {
            let m = tagMap.get(eve)
            if (!m) {
                m = new Map()
                tagMap.set(eve, m)
            }
            return m
        }

    C.E = {
        AddEventListener(tag, eve, Fun, opts) {
            const tagMap = getTagMap(tag)
            const eveMap = getEventMap(tagMap, eve)

            if (eveMap.has(Fun)) {
                console.error('повтор addEventListener', tag, eve)
                return
            }

            eveMap.set(Fun, opts)
            tag.addEventListener(eve, Fun, opts)
        },

        RemoveEventListener: function (tag, eve, Fun, opts) {
            const tagMap = store.get(tag)
            const eveMap = tagMap?.get(eve)

            if (!eveMap || !eveMap.has(Fun)) {
                console.error('remove отсутствующего', tag, eve)
                return
            }

            const fun = eveMap.get(Fun)
            tag.removeEventListener(eve, Fun, opts)
            eveMap.delete(fun)

            if (!eveMap.size) tagMap.delete(eve)
            if (!tagMap.size) store.delete(tag)
        },

        clearTag(tag) {
            const tagMap = store.get(tag)
            if (!tagMap) return

            for (const [eve, eveMap] of tagMap)
                for (const [Fun, opts] of eveMap)
                    tag.removeEventListener(eve, Fun, opts)

            store.delete(tag)
        },

        clearAll() {
            for (const [tag, tagMap] of store)
                this.clearTag(tag)
        }
    }
} 