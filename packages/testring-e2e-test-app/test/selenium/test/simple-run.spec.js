import { run } from 'testring';

run(async (context) => {

    await context.application.url('https://service.ringcentral.com/');
    const title = await context.application.getTitle();
    console.log('title', title);

});

