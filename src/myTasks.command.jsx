import * as Productive from './support/Productive.service.js';

import {
  createTaskListItem,
} from './support/Tasks.service.jsx';

import {
  useEffect,
  useState,
} from 'react';

import {
  Cache,
  List,
} from '@raycast/api';

// --------------------------------------------

const cache = new Cache();

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
