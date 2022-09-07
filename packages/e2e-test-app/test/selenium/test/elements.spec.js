import { run } from 'testring-dev';

run(async (api) => {
    await api.application.url('http://localhost:8080/elements.html');

    const shouldBeFalse = await api.application.isElementsExist(api.application.root.unknownElement);
    await api.application.assert.equal(shouldBeFalse, false);

    const shouldBeTrue = await api.application.isElementsExist(api.application.root.existingElement);
    await api.application.assert.equal(shouldBeTrue, true);

    const liExistingShouldBeTrue = await api.application.isElementsExist(api.application.root.existingElement.li);
    await api.application.assert.equal(liExistingShouldBeTrue, true);

    // -------------------------------------------------------------------------------------------------

    const notExistShouldBeTrue = await api.application.notExists(api.application.root.unknownElement);
    await api.application.assert.equal(notExistShouldBeTrue, true);

    const notExistShouldBeFalse = await api.application.notExists(api.application.root.existingElement);
    await api.application.assert.equal(notExistShouldBeFalse, false);

    // -------------------------------------------------------------------------------------------------

    const isExistingShouldBeTrue = await api.application.isExisting(api.application.root.existingElement);
    await api.application.assert.equal(isExistingShouldBeTrue, true);

    const isExistingShouldBeFalse = await api.application.isExisting(api.application.root.unknownElement);
    await api.application.assert.equal(isExistingShouldBeFalse, false);

    // -------------------------------------------------------------------------------------------------

    const unknownElementCount = await api.application.getElementsCount(await api.application.root.unknownElement);
    await api.application.assert.equal(unknownElementCount, 0);

    const elementCount = await api.application.getElementsCount(await api.application.root.existingElement);
    await api.application.assert.equal(elementCount, 1);

    const liElementsCount = await api.application.getElementsCount(await api.application.root.existingElement.li);
    await api.application.assert.equal(liElementsCount, 5);
});
