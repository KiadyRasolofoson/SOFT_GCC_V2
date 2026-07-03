import React from 'react';
import TaskList from '../components/TaskList';

function HomePage() {
  return (
    <div>
      <h1>Welcome to the Task Manager</h1>
      <TaskList />
    </div>
  );
}

export default HomePage;
