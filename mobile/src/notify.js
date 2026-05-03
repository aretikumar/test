import * as Notifications from 'expo-notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function notifyNewJob(job) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🆕 New Part-Time Job!',
      body: `${job.title}\n📍 ${job.location}`,
      data: { job_url: job.job_url },
      sound: true,
    },
    trigger: null, // immediate
  });
}

export async function notifyApplied(job) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Job Opened for Apply!',
      body: `${job.title}\n📍 ${job.location}\nOpened in browser — complete your application!`,
      data: { job_url: job.job_url },
      sound: true,
    },
    trigger: null,
  });
}

export async function notifyError(job, error) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Failed to Open Job',
      body: `${job.title}: ${error}`,
      sound: true,
    },
    trigger: null,
  });
}

export async function notifyMonitorStatus(message) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏭 Job Monitor',
      body: message,
    },
    trigger: null,
  });
}
