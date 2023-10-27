import axios from 'axios';

import {
  environment,
  getPreferenceValues,
} from '@raycast/api';

import {
  addDays,
  isAfter,
  isBefore,
  isSameDay,
  subDays,
} from 'date-fns';

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

function taskIsToday(task) {
  const todayDate = new Date();
  const todayDateString = todayDate.toISOString().split('T')[0];

  let result = false;

  // Today is the task's due date.
  if (todayDateString === task.attributes.due_date) {
    result = true;
  }

  // Today is between the tasks's start date and due date.
  if (task.attributes.start_date && task.attributes.due_date) {
    if (isAfter(todayDate, new Date(task.attributes.start_date)) && isBefore(todayDate, new Date(task.attributes.due_date))) {
      result = true;
    }
  }

  return result;
}

// --------------------------------------------

async function createTimeEntry({ service, task }) {
  const nowDate = new Date();

  const createTimeEntryRequest = await Productive.post('/time_entries', {
    data: {
      type: 'time_entries',

      attributes: {
        date: nowDate.toISOString(),
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

async function getTasksWithProjectAndStatus({ query }) {
  const getProjectsQuery = new URLSearchParams({
    'page[size]': 100,
  });

  const getWorkflowStatusesQuery = new URLSearchParams({
    'page[size]': 100,
  });

  const [
    projectsResponse,
    tasksResponse,
    workflowStatusesResponse,
  ] = await Promise.all([
    Productive.get(`/projects?${ getProjectsQuery }`),
    Productive.get(`/tasks?${ query }`),
    Productive.get(`/workflow_statuses?${ getWorkflowStatusesQuery }`),
  ])

  const projects = projectsResponse.data.data;
  const tasks = tasksResponse.data.data;
  const workflowStatuses = workflowStatusesResponse.data.data;

  return tasks.map(task => {
    const taskProject = projects.find(project => {
      return project.id === task.relationships.project.data.id;
    });

    const taskWorkflowStatus = workflowStatuses.find(workflowStatus => {
      return workflowStatus.id === task.relationships.workflow_status.data.id;
    });

    return {
      ...task,

      customAdditions: {
        projectName: taskProject?.attributes.name || 'Unknown',
        workflowStatusName: taskWorkflowStatus.attributes.name
      },
    }
  });
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

  return await getTasksWithProjectAndStatus({
    query: getMyTasksQuery
  })
}

// --------------------------------------------

export async function getMyTasksToday() {
  const getMyTasksTodayQuery = new URLSearchParams({
    'page[size]': 100,

    // Only get tasks assigned to the current user.
    'filter[assignee_id]': preferences.productivePersonId,

    // Sort in descending order of most recent activity.
    'sort': '-last_activity',

    // Tasks due yesterday can't be tasks for today.
    'filter[due_date_after]': subDays(new Date(), '1'),

    // Choose a relatively safe boundary for how long a
    // task might span.
    'filter[due_date_before]': addDays(new Date(), '14'),
  });

  const tasks = await getTasksWithProjectAndStatus({
    query: getMyTasksTodayQuery,
  })

  return tasks.filter(taskIsToday);
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
