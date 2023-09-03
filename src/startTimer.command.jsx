import * as Productive from './support/Productive.service.js';

import {
  useEffect,
  useState,
} from 'react';

import {
  Action,
  ActionPanel,
  Icon,
  List,
  LocalStorage,
  Toast,
  showHUD,
  showToast,
} from '@raycast/api';

// --------------------------------------------

async function handleStartTimer({ service, task }) {
  const toast = await showToast({
    title: '⏲️ Start Timer',
    message: 'Starting timer...',
    style: Toast.Style.Animated,
  });

  const timeEntry = await Productive.startTimer({ service, task });

  await LocalStorage.setItem('productiveRecentTimeEntryId', timeEntry.id);
  await showHUD(`⏲️ New timer started on ${ task.attributes.title } (${ service.attributes.name }).`);
}

function createServiceActions({ service, task }) {
  return (
    <ActionPanel title='Service Actions'>
      <Action
        title='Start Timer'
        icon={ Icon.Play }
        onAction={ handleStartTimer.bind(null, { service, task }) }
      />
    </ActionPanel>
  )
}

// --------------------------------------------

function createServiceListItem({ service, task }) {
  return <List.Item
    key={ service.id }
    title={ service.attributes.name }
    actions={ createServiceActions({ service, task }) }
  />
}

// --------------------------------------------

export default function startTimerCommand(props) {
  const { task } = props.launchContext;

  const [ state, setState ] = useState({
    loading: true,
    services: [],
  });

  useEffect(() => {
    Productive.getServicesForTask(task).then(services => {
      setState({
        loading: false,
        services,
      });
    });
  }, []);

  return <List isLoading={ state.loading }>
    { state.services.map(service => createServiceListItem({ service, task })) }
  </List>
}
