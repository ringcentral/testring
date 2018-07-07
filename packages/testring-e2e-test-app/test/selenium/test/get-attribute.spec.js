// import { run } from 'testring';
//
// run(async (api) => {
//     await api.application.url('https://service.ringcentral.com/');
//
//     await api.application.click(
//         api.application.root.credential.toString()
//     );
//
//     await api.application.keys('1111111111');
//
//     await api.application.click(
//         api.application.root.loginCredentialNext.toString()
//     );
//
//     const attr = await api.application.getAttribute(
//         api.application.root.signInBtn.toString(),
//         'type'
//     );
//
//     await api.application.assert.equal(attr, 'submit');
// });
