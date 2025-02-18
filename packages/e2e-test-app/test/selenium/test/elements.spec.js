import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'elements.html'));

    const shouldBeFalse = await app.isElementsExist(app.root.unknownElement);
    await app.assert.equal(shouldBeFalse, false);

    const shouldBeTrue = await app.isElementsExist(app.root.existingElement);
    await app.assert.equal(shouldBeTrue, true);

    const liExistingShouldBeTrue = await app.isElementsExist(
        app.root.existingElement.li,
    );
    await app.assert.equal(liExistingShouldBeTrue, true);

    // -------------------------------------------------------------------------------------------------

    const notExistShouldBeTrue = await app.notExists(app.root.unknownElement);
    await app.assert.equal(notExistShouldBeTrue, true);

    const notExistShouldBeFalse = await app.notExists(app.root.existingElement);
    await app.assert.equal(notExistShouldBeFalse, false);

    // -------------------------------------------------------------------------------------------------

    const isExistingShouldBeTrue = await app.isExisting(
        app.root.existingElement,
    );
    await app.assert.equal(isExistingShouldBeTrue, true);

    const isExistingShouldBeFalse = await app.isExisting(
        app.root.unknownElement,
    );
    await app.assert.equal(isExistingShouldBeFalse, false);

    // -------------------------------------------------------------------------------------------------

    const unknownElementCount = await app.getElementsCount(
        await app.root.unknownElement,
    );
    await app.assert.equal(unknownElementCount, 0);

    const elementCount = await app.getElementsCount(
        await app.root.existingElement,
    );
    await app.assert.equal(elementCount, 1);

    const liElementsCount = await app.getElementsCount(
        await app.root.existingElement.li,
    );
    await app.assert.equal(liElementsCount, 5);

    // -------------------------------------------------------------------------------------------------

    // getElementsIds
    const elementsIds = [
        await app.getElementsIds(app.root.checkbox1),
        await app.getElementsIds(app.root.checkbox2),
    ];

    await app.assert.ok(elementsIds.every((id) => typeof id === 'string'));

    // -------------------------------------------------------------------------------------------------

    let checkedStates = [];
    for (const id of elementsIds) {
        checkedStates.push(await app.isElementSelected(id));
    }

    await app.assert.deepEqual(checkedStates, [false, true]);

});
