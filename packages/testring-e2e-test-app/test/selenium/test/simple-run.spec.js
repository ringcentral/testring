import { run } from 'testring';

run(async (context) => {

    const title = await context.application.getTitle();
    console.log('title', title);

});

