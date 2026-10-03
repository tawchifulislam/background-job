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
  { id: 'make-report', retries: 2, triggers: [{ event: 'report/requested' }] },
  async ({ event, step }) => {
    const { id, topic } = event.data;

    await step.sleep('do-the-slow-work', '8s');

    const result = await step.run('build-report', async () => {
      if (topic === 'fail') {
        throw new Error('The report oven is broken!');
      }

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

const heartbeat = inngest.createFunction(
  { id: 'heartbeat', triggers: [{ cron: '* * * * *' }] },
  async () => {
    let pending = 0;
    let done = 0;
    let failed = 0;

    for (const report of reports.values()) {
      if (report.status === 'pending') pending++;
      else if (report.status === 'done') done++;
      else if (report.status === 'failed') failed++;
    }

    const summary = `heartbeat: pending=${pending} done=${done} failed=${failed}`;
    console.log(summary);
    return summary;
  },
);

export const functions = [sayHello, makeReport, heartbeat];
