# @testring/dwnld-collector-crx

## Installation

```bash
npm install @testring/dwnld-collector-crx
```

## How to use
accessing chrome internal page like chrome://downloads is not allowed in headless mode, as a result, checking download results becomes unavaiable.
once this chrome extension installed. chrome download items can be accessed within page via localStorage, like this:
```javascript
const downloadsJSONStr = await browser.execute(() => {
    return localStorage.getItem('_DOWNLOADS_');
})
// the result is already sort ASC by startTime
const downloads = JSON.parse(downloadsJSONStr);

```
downloads is an array of download items, each item has following properties:
```javascript
{
    fileName: 'example.pdf',
    filePath: '/Users/username/Downloads/example.pdf',
    state: 'complete',
    startTime: '2021-01-01T00:00:00.000Z',
    state: 'complete',
}
```