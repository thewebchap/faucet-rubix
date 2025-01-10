import React, { useState } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
 
 async function getClientIP() {
  const response = await fetch('https://api64.ipify.org?format=json');
  const data = await response.json();
  return data.ip; // Returns the public IP of the user's laptop
}
  const submitUsername = async () => {
    if (!username) {
      setMessage('Please enter DID.');
      setMessageType('error')
      return;
    }

    if (!username.startsWith('bafyb')) {
      setMessage('DID must start with "bafyb".');
      setMessageType('error');
      return;
    }

    try {

      const response = await fetch('/increment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.text();
      setMessage(result);

      if (response.status === 429) {
        setMessageType('error')
      } else {
        setMessageType('success')
        setUsername('');
      }
    } catch (error) {
      setMessage('Error submitting DID.');
      setMessageType('error')
    }
  };
  // console.log(userDetails,username )

  return (
    <div className="container">
      <img src="/rubix-logo.png" alt="Rubix Logo" className="logo" />
      <h1>Rubix Faucet</h1>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter DID"
      />
      <button onClick={submitUsername}>Submit</button>
      <div className={'message ${messageType}'}>{message}</div>
    </div>
  );
}

export default App;