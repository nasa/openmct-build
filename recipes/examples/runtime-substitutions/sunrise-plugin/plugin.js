export function sunrisePlugin({
    sunriseTime = 'N/A',
    sunriseDate = 'N/A',
    sunriseLatitude = 'N/A',
    sunriseLongitude = 'N/A'
} = {}) {
    const TYPE = 'sunrise';
    const NAMESPACE = 'sunrise';
    const KEY = 'sunrise';
    return function install(openmct) {
        openmct.types.addType(TYPE, {
            name: 'Sunrise',
            description: 'Displays calculated sunrise information for a location.',
            cssClass: 'icon-timer',
            creatable: false
        });
        openmct.objectViews.addProvider({
            key: 'sunrise.view',
            name: 'Sunrise',
            cssClass: 'icon-timer',
            canView: (domainObject) => domainObject.type === TYPE,
            view() {
                let root;
                return {
                    show(container) {
                        root = document.createElement('div');
                        root.className = 'c-sunrise';
                        root.innerHTML = `
                            <style>
                                .c-sunrise {
                                    box-sizing: border-box;
                                    height: 100%;
                                    padding: 2rem;
                                    display: grid;
                                    place-items: center;
                                    background:
                                        radial-gradient(ellipse at 50% 120%, rgba(255, 166, 77, 0.35), transparent 55%),
                                        linear-gradient(180deg, #1a2230 0%, #0f141c 100%);
                                    color: #f4f1ea;
                                    font-family: "Avenir Next", "Segoe UI", sans-serif;
                                }
                                .c-sunrise__card {
                                    width: min(28rem, 100%);
                                    text-align: center;
                                }
                                .c-sunrise__eyebrow {
                                    margin: 0 0 0.5rem;
                                    letter-spacing: 0.18em;
                                    text-transform: uppercase;
                                    font-size: 0.75rem;
                                    opacity: 0.7;
                                }
                                .c-sunrise__time {
                                    margin: 0;
                                    font-size: clamp(2.5rem, 8vw, 4rem);
                                    font-weight: 600;
                                    line-height: 1.1;
                                }
                                .c-sunrise__date {
                                    margin: 0.75rem 0 1.75rem;
                                    font-size: 1.05rem;
                                    opacity: 0.85;
                                }
                                .c-sunrise__meta {
                                    display: grid;
                                    grid-template-columns: 1fr 1fr;
                                    gap: 0.75rem 1.25rem;
                                    margin: 0;
                                    text-align: left;
                                }
                                .c-sunrise__meta dt {
                                    margin: 0;
                                    font-size: 0.7rem;
                                    letter-spacing: 0.12em;
                                    text-transform: uppercase;
                                    opacity: 0.55;
                                }
                                .c-sunrise__meta dd {
                                    margin: 0.15rem 0 0;
                                    font-variant-numeric: tabular-nums;
                                }
                            </style>
                            <div class="c-sunrise__card">
                                <p class="c-sunrise__eyebrow">Sunrise</p>
                                <h1 class="c-sunrise__time"></h1>
                                <p class="c-sunrise__date"></p>
                                <dl class="c-sunrise__meta">
                                    <div>
                                        <dt>Latitude</dt>
                                        <dd class="c-sunrise__latitude"></dd>
                                    </div>
                                    <div>
                                        <dt>Longitude</dt>
                                        <dd class="c-sunrise__longitude"></dd>
                                    </div>
                                </dl>
                            </div>
                        `;
                        root.querySelector('.c-sunrise__time').textContent = sunriseTime;
                        root.querySelector('.c-sunrise__date').textContent = sunriseDate;
                        root.querySelector('.c-sunrise__latitude').textContent = sunriseLatitude;
                        root.querySelector('.c-sunrise__longitude').textContent = sunriseLongitude;
                        container.appendChild(root);
                    },
                    destroy() {
                        root?.remove();
                        root = undefined;
                    }
                };
            }
        });
        // Make it appear in the tree automatically
        openmct.objects.addRoot({ namespace: NAMESPACE, key: KEY });
        openmct.objects.addProvider(NAMESPACE, {
            get(identifier) {
                if (identifier.key !== KEY) {
                    return undefined;
                }
                return Promise.resolve({
                    identifier,
                    type: TYPE,
                    name: 'Sunrise',
                    location: 'ROOT'
                });
            }
        });
    };
}
