import { run } from 'testring';

run(async (context) => {

    try {
       await context.application.url('https://www.ringcentral.com/');

        const title = await context.application.getTitle();
        console.log('title', title);
    } catch (e) {
        console.log('error', e);
    }
});

