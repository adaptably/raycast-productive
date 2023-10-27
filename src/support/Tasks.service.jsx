import * as Productive from './Productive.service.js';

import {
  Action,
  ActionPanel,
  Clipboard,
  Color,
  Icon,
  Keyboard,
  LaunchType,
  List,
  launchCommand,
  showHUD,
} from '@raycast/api';

// --------------------------------------------

export function createTaskActions(task) {
  const taskUrl = `https://app.productive.io/2650-4site-interactive-studios-inc/tasks/${ task.id }`;

  async function handleCopyTaskLink() {
    await Clipboard.copy(taskUrl);
    await showHUD(`📋 Copied link to ${ task.attributes.title }.`);
  }

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

        <Action
          title='Copy Task Link'
          icon={ Icon.Clipboard }
          shortcut={ Keyboard.Shortcut.Common.Copy }
          onAction={ handleCopyTaskLink }
        />
      </ActionPanel.Section>
    </ActionPanel>
  )
}

// --------------------------------------------

export function createTaskListItem(task) {
  const taskKeywords = [
    task.customAdditions.projectName,
    task.customAdditions.workflowStatusName,
  ];

  return <List.Item
    key={ task.id }
    title={ task.attributes.title }
    keywords={ taskKeywords }
    detail={ createTaskListItemDetail(task) }
    actions={ createTaskActions(task) }
  />
}

// --------------------------------------------

export function createTaskListItemDetail(task) {
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
          title='Project'
          text={ task.customAdditions.projectName }
        />

        <List.Item.Detail.Metadata.Label
          title='Due Date'
          text={ task.attributes.due_date }
        />
      </List.Item.Detail.Metadata>
    }
  />
}
