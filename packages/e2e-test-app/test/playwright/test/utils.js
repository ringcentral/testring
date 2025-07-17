export const getTargetUrl = (api, urlPath) => {
    let {baseUrl} = api.getEnvironment();
    if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
    }
    if (urlPath.startsWith('/')) {
        urlPath = urlPath.slice(1);
    }
    return `${baseUrl}${urlPath}`;
};
