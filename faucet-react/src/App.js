import React, { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const submitUsername = async () => {
    if (!username) {
      setMessage('Please enter a username.');
      return;
    }

    if (!username.startsWith('bafyb')) {
      setMessage('Username must start with "bafyb".');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.text();
      setMessage(result);

      if (response.status === 429) {
        document.getElementById('message').style.color = 'red';
      } else {
        document.getElementById('message').style.color = 'green';
      }
    } catch (error) {
      setMessage('Error submitting username.');
      document.getElementById('message').style.color = 'red';
    }
  };

  return (
    <div className="container">
      <img src="/rubix-logo.png" alt="Rubix Logo" className="logo" />
      <h1>Increment Counter</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter username"
      />
      <button onClick={submitUsername}>Submit</button>
      <div className="message" id="message">{message}</div>
    </div>
  );
}

export default App;