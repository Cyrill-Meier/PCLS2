import React, { useState, useEffect } from 'react';
import './App.css';
import { API } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listTodos } from './graphql/queries';
import { createTodo as createTodoMutation, deleteTodo as deleteTodoMutation } from './graphql/mutations';
import { Storage } from 'aws-amplify';
import * as ReactBootStrap from 'react-bootstrap';


const initialFormState = { name: '', description: '' }

function App() {
  const [todos, setTodos] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const apiData = await API.graphql({ query: listTodos });
    const todosFromAPI = apiData.data.listTodos.items;
    await Promise.all(todosFromAPI.map(async todo => {
      if (todo.image) {
        const image = await Storage.get(todo.image);
        todo.image = image;
      }
      return todo;
    }))
    setTodos(apiData.data.listTodos.items);
  }

  async function createTodo() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createTodoMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setTodos([ ...todos, formData ]);
    setFormData(initialFormState);
  }

  async function deleteTodo({ id }) {
    const newTodosArray = todos.filter(todo => todo.id !== id);
    setTodos(newTodosArray);
    await API.graphql({ query: deleteTodoMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchTodos();
  }


  return (
    <div className="App">
      <ReactBootStrap.Navbar bg="primary" variant="dark">
        <ReactBootStrap.Navbar.Brand href="#home">FHNW PCLS Usecase</ReactBootStrap.Navbar.Brand>
        <ReactBootStrap.Nav className="mr-auto">
        </ReactBootStrap.Nav>
        <ReactBootStrap.Form inline>
          <ReactBootStrap.Button variant="outline-light"><AmplifySignOut /></ReactBootStrap.Button>
        </ReactBootStrap.Form>
      </ReactBootStrap.Navbar>
      <hr></hr>
      <h1>Teile dein Bilder</h1>

        <input
          onChange={e => setFormData({ ...formData, 'name': e.target.value})}
          placeholder="Titel"
          value={formData.name}
        />
        <input
          onChange={e => setFormData({ ...formData, 'description': e.target.value})}
          placeholder="Beschreibung"
          value={formData.description}
        />
        <input
          type="file"
          onChange={onChange}
        />
        <ReactBootStrap.Button onClick={createTodo}>Veröffentlichen</ReactBootStrap.Button>

      <hr></hr>

      <div style={{marginBottom: 30}}>
        {
          todos.map(todo => (
            <div key={todo.id || todo.name}>
              <h2>{todo.name}</h2>
              <p>{todo.description}</p>

              {
                todo.image && <img src={todo.image} style={{width: 400}}  alt="Uploaded from the user"/>
              }
              <button onClick={() => deleteTodo(todo)}>Bild löschen</button>
            </div>

          ))
        }
      </div>

    </div>
  );
}

export default withAuthenticator(App);
