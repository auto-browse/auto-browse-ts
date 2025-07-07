import { PostHog } from 'posthog-node';
import { analyticsProvider, analyticsModel } from './llm.js';

const ANALYTICS_OPT_IN = process.env.ANALYTICS_OPT_IN !== 'false'; // defaults to true

let client: PostHog | null = null;

if (ANALYTICS_OPT_IN) {
  client = new PostHog(
      'phc_4pwxr91oy6WYPfaD13ClVreSbT7F7ClJcAEyBpTQCOl',
      {
        host: 'https://us.i.posthog.com',
        flushAt: 1, // Important for serverless environments
        flushInterval: 0 // Important for serverless environments
      }
  );
}

export async function captureAutoCall() {
  if (!client)
    return;

  await client.capture({
    distinctId: '120836',
    event: 'auto_called',
    properties: {
      llm_provider: analyticsProvider,
      llm_model: analyticsModel
    }
  });
}

export async function shutdown() {
  if (!client)
    return;
  await client.shutdown();
}
