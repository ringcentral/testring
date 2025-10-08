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

    // Test 3: Click nested shadow DOM button using new shadow$ concept
    // For nested shadow DOM, shadow$ can be chained to access deeper shadow elements
    // app.root.nestedShadowHost - path to nested shadow host element
    // shadow$.outerShadowContent - access to outer shadow content
    // shadow$.innerShadowHost - access to inner shadow host within outer shadow
    // shadow$.nestedShadowButton - access to button within nested shadow DOM
    await app.click(app.root.nestedShadowHost.shadow$.outerShadowContent.innerShadowHost.shadow$.nestedShadowButton);
    
    const nestedShadowResultText = await app.getText(app.root.nestedShadowSection.nestedShadowResult);
    await app.assert.equal(nestedShadowResultText, 'Nested shadow button clicked successfully!');

    // Verify all results are visible
    const regularResultVisible = await app.isVisible(app.root.regularSection.regularResult);
    const shadowResultVisible = await app.isVisible(app.root.shadowSection.shadowResult);
    const nestedShadowResultVisible = await app.isVisible(app.root.nestedShadowSection.nestedShadowResult);
    
    await app.assert.equal(regularResultVisible, true, 'Regular result should be visible');
    await app.assert.equal(shadowResultVisible, true, 'Shadow result should be visible');
    await app.assert.equal(nestedShadowResultVisible, true, 'Nested shadow result should be visible');
});