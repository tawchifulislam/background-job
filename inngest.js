import { Inngest } from 'inngest';
import { reports } from './store.js';

export const inngest = new Inngest({ id: 'report-api' });

const sayHello = inngest.createFunction(
  { id: 'say-hello', triggers: [{ event: 'test/hello' }] },
  async ({ step }) => {
    await step.sleep('wait-five-seconds', '5s');
    return 'Hello from the background!';
  },
);

const makeReport = inngest.createFunction(
  { id: 'make-report', triggers: [{ event: 'report/requested' }] },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    await step.sleep('do-the-slow-work', '8s');

    const result = await step.run('build-report', async () => {
      const report = {
        id,
        topic,
        status: 'done',
        result: `Report about ${topic} is ready`,
      };
      reports.set(id, report);
      return report;
    });

    return result;
  },
);

export const functions = [sayHello, makeReport];
