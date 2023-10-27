import axios from 'axios';
import { environment, getPreferenceValues } from '@raycast/api';
import { addDays, subDays } from 'date-fns';

// --------------------------------------------

const preferences = getPreferenceValues();

// --------------------------------------------

const Productive = axios.create({
  baseURL: 'https://api.productive.io/api/v2/',

  headers: {
    'Content-Type': 'application/vnd.api+json',
    'X-Auth-Token': preferences.productiveApiKey,
    'X-Organization-Id': preferences.productiveOrganizationId,
  }
});

// Log error messages from the Productive API in development.
if (environment.isDevelopment) {
  Productive.interceptors.response.use(
    function (response) {
      return response;
    },

    function (error) {
      console.log(error.response.data)
      return Promise.reject(error);
    },
  );
}

// --------------------------------------------

async function createTimeEntry({ service, task }) {
  const now = new Date();

  const createTimeEntryRequest = await Productive.post('/time_entries', {
    data: {
      type: 'time_entries',

      attributes: {
        date: now.toISOString(),
      },

      relationships: {
        person: {
          data: {
            type: 'people',
            id: preferences.productivePersonId,
          },
        },

        service: {
          data: {
            type: 'services',
            id: service.id,
          }
        },

        task: {
          data: {
            type: 'tasks',
            id: task.id,
          }
        },
      }
    }
  });

  return createTimeEntryRequest.data.data;
}

// --------------------------------------------

export async function getMyTasks() {
  const getMyTasksQuery = new URLSearchParams({
    'page[size]': 100,

    // Only get tasks assigned to the current user.
    'filter[assignee_id]': preferences.productivePersonId,

    // Sort in descending order of most recent activity.
    'sort': '-last_activity',

    // Only get tasks with due dates +/- 2 weeks from now.
    'filter[due_date_after]': subDays(new Date(), '14'),
    'filter[due_date_before]': addDays(new Date(), '14'),
  });

  const [
    tasksResponse,
    workflowStatusesResponse,
  ] = await Promise.all([
    Productive.get(`/tasks?${ getMyTasksQuery }`),
    Productive.get('/workflow_statuses'),
  ])

  const tasks = tasksResponse.data.data;
  const workflowStatuses = workflowStatusesResponse.data.data;

  return tasks.map(task => {
    const taskWorkflowStatus = workflowStatuses.find(workflowStatus => {
      return workflowStatus.id === task.relationships.workflow_status.data.id;
    });

    return {
      ...task,

      customAdditions: {
        workflowStatusName: taskWorkflowStatus.attributes.name
      }
    }
  });
}

// --------------------------------------------

export async function getServicesForTask(task) {
  const servicesResponse = await Productive.get(`/services?filter[task_id]=${ task.id }`);
  return servicesResponse.data.data;
}

// --------------------------------------------

export async function startTimer({ service, task }) {
  const timeEntry = await createTimeEntry({ service, task });
  await Productive.patch(`/time_entries/${ timeEntry.id }/start`);
  return timeEntry;
}

// --------------------------------------------

export async function stopTimer({ timeEntryId }) {
  await Productive.patch(`/time_entries/${ timeEntryId }/stop`);
}
