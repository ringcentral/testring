function renderPage() {
    const config = new URLSearchParams(window.location.search);

    for (let id of ['httpPort', 'wsPort', 'appId']) {
        const element = document.getElementById(id);

        if (element && config.has(id)) {
            element.innerText = config.get(id) as string;
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    renderPage();
});


