import * as TaskManager from 'expo-task-manager';

// Define background tasks
TaskManager.defineTask(
  'test-location-task',
  //eslint-disable-next-line  @typescript-eslint/no-explicit-any
  async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error('Location task error:', error);
      return;
    }
    console.log('Location task data:', data);
  }
);

TaskManager.defineTask(
  'test-geofencing-task',
  //eslint-disable-next-line  @typescript-eslint/no-explicit-any
  async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error('Geofencing task error:', error);
      return;
    }
    console.log('Geofencing task data:', data);
  }
);
