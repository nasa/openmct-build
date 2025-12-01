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

export function pluginWithResources({customStylesheet}) {
    return function install() {
          const customStyles = document.createElement('link');
          customStyles.setAttribute('rel', 'stylesheet');
          customStyles.setAttribute('href', customStylesheet);
          document.head.appendChild(customStyles);
    }
}

