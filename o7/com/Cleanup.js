/* global  window, console, Map, NamedNodeMap*/
/* exported olga_menuPopDn_Click*/
/*jshint asi:true  */
/*jshint esversion: 6*/
/**
 * расширение логирования
 */
import { C } from '../index.js'

export function Cleanup() {
    // события
    removeAllEvents()

    // observers
    disconnectAllObservers()

    // таймеры
    clearAllTimers()

    // xhr / fetch
    abortAllLoads()

}