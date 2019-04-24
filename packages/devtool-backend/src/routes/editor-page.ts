const pageTemplate = (
    host: string,
    wsPort: number,
    staticHost: string,
) => {
    return `
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Editor Page</title>
    <style>
        body, html {
            height: 100%;
            margin: 0;
        }
    </style>
    <script>
        window.rcRecorderConfig = {
            host: '${ host }',
            wsport: ${ wsPort },
        };
    </script>
</head>
<body>
    <div id="rcRecorderApp" style="width: 100%; height: 100%;"></div>
    <script src="${staticHost}/editor.bundle.js" ></script>
</body>
</html>
    `;
};

export default function editorPage(req, res, store) {
    const { recorderConfig } = store.getState();
    const { host, wsPort } = recorderConfig;

    res.send(pageTemplate(
        host,
        wsPort,
        '/static',
    ));
}
