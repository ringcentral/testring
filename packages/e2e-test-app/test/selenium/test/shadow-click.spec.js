import {run} from 'testring';
import {getTargetUrl} from './utils';

/**
 * Test for shadow DOM element interaction using the new shadow$ concept.
 * 
 * The shadow$ property provides a clean API for accessing elements within shadow DOM:
 * - app.root.shadowHost - path to shadow host element
 * - shadow$.elementName - access to elements inside the shadow DOM
 * - For nested shadow DOM, shadow$ can be chained: shadow$.outer.shadow$.inner.element
 * 
 * This concept is not yet implemented in the test framework but serves as a specification
 * for the desired API design.
 */
run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'shadow-click.html'));


    // Test 1: Click regular DOM button and verify result appears
    // Regular DOM elements are accessed through standard property chain
    await app.click(app.root.regularSection.regularButton);
    
    const regularResultText = await app.getText(app.root.regularSection.regularResult);
    await app.assert.equal(regularResultText, 'Regular button clicked successfully!');

    // Test 2: Click shadow DOM button using new shadow$ concept
    // shadow$ property provides access to elements inside shadow DOM
    // app.root.shadowHost - path to root shadow element
    // shadow$.shadowButton - path inside shadow DOM
    await app.click(app.root.shadowHost.shadow$.shadowButton);
    
    const shadowResultText = await app.getText(app.root.shadowSection.shadowResult);
    await app.assert.equal(shadowResultText, 'Shadow button clicked successfully!');

    // Test 2a: Test isVisible on shadow DOM elements
    const shadowTextVisible = await app.isVisible(app.root.shadowHost.shadow$.shadowText);
    await app.assert.equal(shadowTextVisible, true, 'Shadow text should be visible');
    
    const shadowButtonVisible = await app.isVisible(app.root.shadowHost.shadow$.shadowButton);
    await app.assert.equal(shadowButtonVisible, true, 'Shadow button should be visible');

    // Test 2b: Test getText on shadow DOM elements
    const shadowTextContent = await app.getText(app.root.shadowHost.shadow$.shadowText);
    await app.assert.equal(shadowTextContent, 'This is inside shadow DOM', 'Shadow text content should match');

    // Test 2c: Test setValue and getValue on shadow DOM input
    await app.setValue(app.root.shadowHost.shadow$.shadowInput, 'Test shadow input value');
    const shadowInputValue = await app.getValue(app.root.shadowHost.shadow$.shadowInput);
    await app.assert.equal(shadowInputValue, 'Test shadow input value', 'Shadow input value should match set value');

    // Test 2d: Test getText on shadow DOM display text
    const shadowDisplayText = await app.getText(app.root.shadowHost.shadow$.shadowDisplayText);
    await app.assert.equal(shadowDisplayText, 'Initial shadow text content', 'Shadow display text should match');

    // Test 3: Click nested shadow DOM button using new shadow$ concept
    // For nested shadow DOM, shadow$ can be chained to access deeper shadow elements
    // app.root.nestedShadowHost - path to nested shadow host element
    // shadow$.outerShadowContent - access to outer shadow content
    // shadow$.innerShadowHost - access to inner shadow host within outer shadow
    // shadow$.nestedShadowButton - access to button within nested shadow DOM
    await app.click(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowButton);
    
    const nestedShadowResultText = await app.getText(app.root.nestedShadowSection.nestedShadowResult);
    await app.assert.equal(nestedShadowResultText, 'Nested shadow button clicked successfully!');

    // Test 3a: Test isVisible on nested shadow DOM elements
    const nestedShadowTextVisible = await app.isVisible(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.innerShadowText);
    await app.assert.equal(nestedShadowTextVisible, true, 'Nested shadow text should be visible');
    
    const nestedShadowButtonVisible = await app.isVisible(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowButton);
    await app.assert.equal(nestedShadowButtonVisible, true, 'Nested shadow button should be visible');

    // Test 3b: Test getText on nested shadow DOM elements
    const nestedShadowTextContent = await app.getText(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.innerShadowText);
    await app.assert.equal(nestedShadowTextContent, 'This is nested inner shadow DOM', 'Nested shadow text content should match');

    // Test 3c: Test setValue and getValue on nested shadow DOM input
    await app.setValue(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowInput, 'Test nested shadow input value');
    const nestedShadowInputValue = await app.getValue(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowInput);
    await app.assert.equal(nestedShadowInputValue, 'Test nested shadow input value', 'Nested shadow input value should match set value');

    // Test 3d: Test getText on nested shadow DOM display text
    const nestedShadowDisplayText = await app.getText(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowDisplayText);
    await app.assert.equal(nestedShadowDisplayText, 'Initial nested shadow text', 'Nested shadow display text should match');

    // Verify all results are visible
    const regularResultVisible = await app.isVisible(app.root.regularSection.regularResult);
    const shadowResultVisible = await app.isVisible(app.root.shadowSection.shadowResult);
    const nestedShadowResultVisible = await app.isVisible(app.root.nestedShadowSection.nestedShadowResult);
    
    await app.assert.equal(regularResultVisible, true, 'Regular result should be visible');
    await app.assert.equal(shadowResultVisible, true, 'Shadow result should be visible');
    await app.assert.equal(nestedShadowResultVisible, true, 'Nested shadow result should be visible');

    // Additional verification for shadow DOM input fields
    const shadowInputVisible = await app.isVisible(app.root.shadowHost.shadow$.shadowInput);
    const nestedShadowInputVisible = await app.isVisible(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowInput);
    
    await app.assert.equal(shadowInputVisible, true, 'Shadow input should be visible');
    await app.assert.equal(nestedShadowInputVisible, true, 'Nested shadow input should be visible');

    // Verify shadow DOM text elements are visible
    const shadowDisplayTextVisible = await app.isVisible(app.root.shadowHost.shadow$.shadowDisplayText);
    const nestedShadowDisplayTextVisible = await app.isVisible(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowDisplayText);
    
    await app.assert.equal(shadowDisplayTextVisible, true, 'Shadow display text should be visible');
    await app.assert.equal(nestedShadowDisplayTextVisible, true, 'Nested shadow display text should be visible');
});