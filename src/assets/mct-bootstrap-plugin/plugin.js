export default function mctBootstrapPlugin({timeSystem, clock, startOffset, endOffset} = {timeSystem: 'utc', clock: 'local', startOffset: -60000, endOffset: 0}) {
    return function install(openmct){
        openmct.time.setTimeSystem(timeSystem);
        openmct.time.setClock(clock);
        openmct.time.setMode('realtime', {start: startOffset, end: endOffset});
    }
}