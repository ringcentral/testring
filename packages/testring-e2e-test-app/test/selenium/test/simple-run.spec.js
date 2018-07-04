import { run } from 'testring';

run(async () => {
    this.logBusiness('test 1');

    await this.application.url('https://www.ringcentral.com/');

    const title = await this.application.getTitle();

    console.log('title', title);
});

