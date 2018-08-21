import { configure } from '@storybook/react';
import { setOptions } from '@storybook/addon-options';
import pkg from '../package.json';

setOptions({
    name: pkg.name,
    url: pkg.repository.url,
    addonPanelInRight: true
});


function requireAll(requireContext) {
    return requireContext.keys().map(requireContext);
}

function loadStories() {
    requireAll(require.context('../src', true, /.story\.tsx?$/));
}

configure(loadStories, module);
