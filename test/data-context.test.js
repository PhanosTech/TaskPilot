
import React, { useContext } from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataProvider, DataContext } from '../src/context/data-context';

// Mock child component to consume the context
const TestConsumer = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('TestConsumer must be used within a DataProvider');
  }
  const { 
    projects, 
    tasks, 
    createProject, 
    deleteProject, 
    createTask, 
    deleteTask,
    isLoading,
  } = context;

  if (isLoading) {
    return <div>Loading data...</div>;
  }

  return (
    <div>
      <button onClick={() => createProject({ name: 'Test Project' })}>Create Project</button>
      <button onClick={() => projects.length > 0 && deleteProject(projects[0].id)}>Delete Project</button>
      <button onClick={() => projects.length > 0 && createTask({ name: 'Test Task', projectId: projects[0].id, status: 'To Do' })}>Create Task</button>
      <button onClick={() => tasks.length > 0 && deleteTask(tasks[0].id)}>Delete Task</button>

      <div data-testid="projects-count">{projects.length}</div>
      <div data-testid="tasks-count">{tasks.length}</div>
    </div>
  );
};

describe('DataContext', () => {
  it('should create and delete a project', async () => {
    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );

    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByText('Loading data...')).toBeNull());

    // Initial state
    expect(screen.getByTestId('projects-count').textContent).toBe('0');

    // Create a project
    act(() => {
      fireEvent.click(screen.getByText('Create Project'));
    });
    await waitFor(() => expect(screen.getByTestId('projects-count').textContent).toBe('1'));

    // Delete a project
    act(() => {
      fireEvent.click(screen.getByText('Delete Project'));
    });
    await waitFor(() => expect(screen.getByTestId('projects-count').textContent).toBe('0'));
  });

  it('should create and delete a task', async () => {
    render(
      <DataProvider>
        <TestConsumer />
      </DataProvider>
    );

    // Wait for loading to complete
    await waitFor(() => expect(screen.queryByText('Loading data...')).toBeNull());

    // Create a project first to be able to create a task
    act(() => {
      fireEvent.click(screen.getByText('Create Project'));
    });
    await waitFor(() => expect(screen.getByTestId('projects-count').textContent).toBe('1'));
    
    // Initial state
    expect(screen.getByTestId('tasks-count').textContent).toBe('0');

    // Create a task
    act(() => {
      fireEvent.click(screen.getByText('Create Task'));
    });
    await waitFor(() => expect(screen.getByTestId('tasks-count').textContent).toBe('1'));

    // Delete a task
    act(() => {
      fireEvent.click(screen.getByText('Delete Task'));
    });
    await waitFor(() => expect(screen.getByTestId('tasks-count').textContent).toBe('0'));
  });
});
