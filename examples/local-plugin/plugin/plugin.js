export function helloWorld({greeting}) {
    return function install(openmct) {
        console.log(`Hello world indicator installed with greeting: ${greeting}`);
        const indicator = openmct.indicators.simpleIndicator();
        indicator.text(`Hello ${greeting ?? 'World'}!`);
        indicator.iconClass('icon-bell');
        indicator.statusClass('s-status-warning-hi');
        indicator.on('click', () => {
            alert(`Hello ${greeting ?? 'World'}!`);
        });
        openmct.indicators.add(indicator);
    };
}
export function loremIpsum() {
    return function install(openmct) {
        // Plugin installation code goes here
        console.log(`Lorem ipsum plugin installed`);
        openmct.on('start', () => {
            alert(`Lorem ipsum dolor sit amet, consectetur adipiscing elit.`);
        });
    };
}

export function pluginWithResources({customStylesheet}) {
    return function install(openmct) {
          const customStyles = document.createElement('link');
          customStyles.setAttribute('rel', 'stylesheet');
          customStyles.setAttribute('href', customStylesheet);
          document.head.appendChild(customStyles);
    }
}

