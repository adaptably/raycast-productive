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

export default function myTasksTodayCommand() {
  const cachedMyTasksToday = cache.get('productiveMyTasksToday');

  const [ state, setState ] = useState({
    loading: true,

    myTasksToday: cachedMyTasksToday
      ? JSON.parse(cachedMyTasksToday)
      : []
  });

  useEffect(() => {
    Productive.getMyTasksToday().then(myTasksToday => {
      cache.set('productiveMyTasksToday', JSON.stringify(myTasksToday));

      setState({
        loading: false,
        myTasksToday,
      });
    });
  }, []);

  return <List isLoading={ state.loading } isShowingDetail>
    { state.myTasksToday.map(createTaskListItem) }
  </List>
}
