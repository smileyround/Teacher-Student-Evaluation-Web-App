import "../style/Subjects.css";

import { Outlet, Link } from "react-router-dom";
import { useState } from "react";
import useTodos from "../hooks/useTodos";
import { useAuthToken } from "../AuthTokenContext";

export default function Subjects() {
  const [newItemText, setNewItemText] = useState("");
  const [newDescriptionText, setNewDescriptionText] = useState("");
  const [todosItems, setTodosItems] = useTodos();
  const { accessToken } = useAuthToken();

  async function insertTodo(title,description) {
    // insert a new todo item, passing the accessToken in the Authorization header
    const data = await fetch(`${process.env.REACT_APP_API_URL}/subjects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        title: title,
        description: description,
      }),
    });
    if (data.ok) {
      const todo = await data.json();
      return todo;
    } else {
      return null;
    }
  }

  async function removeTodo(itemId) {
    try {
      
      const id = parseInt(itemId);
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}/subjects/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Failed to remove subject. Status: ${response.status}`);
      }
  
      // Remove the item from the local state
      setTodosItems((prevItems) => prevItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error removing subject:', error.message);
    }
  }
  
  
  

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!newItemText) return;
    

    const newTodo = await insertTodo(newItemText, newDescriptionText);
    if (newTodo) {
      setTodosItems([...todosItems, newTodo]);
      setNewItemText("");

      setNewDescriptionText("");

    }

    
  };

  const handleRemoveButtonClick = async (itemId) => {
    await removeTodo(itemId);
  };

  return (
    <div className="todo-list">
      <form
        onSubmit={(e) => handleFormSubmit(e)}
        className="todo-form"
        autoComplete="off"
      >
        <label for="item">Subject Title:</label>
        <input
          type="text"
          name="item"
          id="item"
          minLength="2" maxLength="50" required
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
        />

        <label for="description">Subject Description:</label>

        <input
          type="text"
          name="description"
          id="item"
          minLength="10" maxLength="250" required
          value={newDescriptionText}
          onChange={(e) => setNewDescriptionText(e.target.value)}
        />

        <button type="submit">+ Add New Subject</button>
      </form>

      <ul className="list">
        {todosItems.map((item) => {
          return (
            <li key={item.id} className="todo-item">
              <Link to={`/app/subjects/${item.id}`} >
              <input
                onChange={(e) => console.log(e.target)}
                value={item.id}
                type="checkbox"
                checked={item.completed}
              />
              <span className="itemName">{item.title}</span>
              </Link>
              <button aria-label={`Remove ${item.title}`} value={item.id}
              onClick={() => handleRemoveButtonClick(item.id)}>
                X
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
