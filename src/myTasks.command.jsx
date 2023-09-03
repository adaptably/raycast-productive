import * as Productive from './support/Productive.service.js';

import {
  useEffect,
  useState,
} from 'react';

import {
  Action,
  ActionPanel,
  Cache,
  Color,
  Icon,
  LaunchType,
  List,
  launchCommand
} from '@raycast/api';

// --------------------------------------------

const cache = new Cache();

// --------------------------------------------

function createTaskActions(task) {
  const taskUrl = `https://app.productive.io/2650-4site-interactive-studios-inc/tasks/task/${ task.id }`;

  async function handleStartTimer() {
    await launchCommand({
      name: 'startTimer.command',
      type: LaunchType.UserInitiated,
      context: { task }
    });
  }

  return (
    <ActionPanel title='Task Actions'>
      <ActionPanel.Section>
        <Action.OpenInBrowser url={ taskUrl } />

        <Action
          title='Start Timer'
          icon={ Icon.Play }
          onAction={ handleStartTimer }
        />
      </ActionPanel.Section>
    </ActionPanel>
  )
}

// --------------------------------------------

function createTaskListItemDetail(task) {
  const taskStatus = task.customAdditions.workflowStatusName;

  const taskStatusIcons = {
    'Client Approval': { source: Icon.CircleFilled, tintColor: Color.Green },
    'Closed': { source: Icon.CircleFilled, tintColor: Color.SecondaryText },
    'Discovery': { source: Icon.CircleFilled, tintColor: Color.Purple },
    'In Progress': { source: Icon.CircleFilled, tintColor: '#72D7D0' },
    'Meeting': { source: Icon.CircleFilled, tintColor: Color.SecondaryText },
    'Open': { source: Icon.CircleFilled, tintColor: Color.Blue },
    'Waiting for check in call': { source: Icon.CircleFilled, tintColor: Color.Yellow },
    'Waiting for client': { source: Icon.CircleFilled, tintColor: Color.Yellow },
    'Waiting for teammate': { source: Icon.CircleFilled, tintColor: Color.Yellow },
  }

  return <List.Item.Detail
    markdown={ task.attributes.title }

    metadata={
      <List.Item.Detail.Metadata>
        <List.Item.Detail.Metadata.Label
          title='Status'
          text={ taskStatus }
          icon={ taskStatusIcons[taskStatus] }
        />

        <List.Item.Detail.Metadata.Label
          title='Due Date'
          text={ task.attributes.due_date }
        />
      </List.Item.Detail.Metadata>
    }
  />
}

// --------------------------------------------

function createTaskListItem(task) {
  return <List.Item
    key={ task.id }
    title={ task.attributes.title }
    detail={ createTaskListItemDetail(task) }
    actions={ createTaskActions(task) }
  />
}

// --------------------------------------------

export default function myTasksCommand() {
  const cachedMyTasks = cache.get('productiveMyTasks');

  const [ state, setState ] = useState({
    loading: true,

    myTasks: cachedMyTasks
      ? JSON.parse(cachedMyTasks)
      : []
  });

  useEffect(() => {
    Productive.getMyTasks().then(myTasks => {
      cache.set('productiveMyTasks', JSON.stringify(myTasks));

      setState({
        loading: false,
        myTasks,
      });
    });
  }, []);

  return <List isLoading={ state.loading } isShowingDetail>
    { state.myTasks.map(createTaskListItem) }
  </List>
}
