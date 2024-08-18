const express = require('express');
const fs = require('fs-extra');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3001;
const crypto = require('crypto');
const axios = require('axios');
const counterFilePath = 'counter.json';
const dbFilePath = 'counter.db';

// Initialize database
const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            timestamp INTEGER
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS token_level_details (
            faucetID TEXT PRIMARY KEY,
            token_level INTEGER,
            last_token_num INTEGER,
            tokens_transferred INTEGER
        )`);
        db.run(`INSERT INTO token_level_details (faucetID, token_level, last_token_num, tokens_transferred) VALUES (?, ?, ?, ?)`, 
        ["faucettest", 1, 0, 0], 
        function(err) {
            if (err) {
                console.error("Error inserting initial values:", err.message);
            } else {
                console.log("Initial values inserted successfully.");
            }
        }
    );
    }
});


function calculateSHA3_256Hash(number) {
    // Convert number to string
    const numberString = number.toString();
    
    // Calculate SHA3-256 hash
    const hash = crypto.createHash('sha3-256').update(numberString, 'utf8').digest('hex');
    
    return hash;
}

// Function to read the counter value from the file
const readCounterFromFile = async () => {
    try {
        const data = await fs.readFile(counterFilePath, 'utf8');
        return JSON.parse(data).counter;
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist, return initial counter value of 0
            return 0;
        } else {
            throw error;
        }
    }
};

// Function to write the counter value to the file
const writeCounterToFile = async (counter) => {
    const data = { counter };
    await fs.writeFile(counterFilePath, JSON.stringify(data, null, 2));
};

// Initialize the counter value
let counter = 0;

const initializeCounter = async () => {
    counter = await readCounterFromFile();
};

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

app.get('/api/current-token-value', (req, res) => {
    db.get(`SELECT token_level AS token_level, faucetID AS faucet_id, last_token_num AS current_token_number FROM token_level_details WHERE faucetID = ?`, ["faucettest1"], (err, tokenDetails) => {
        if (err) {
          console.error(err.message);
          res.status(500).json({ error: "Database error" });
          return;
        }
        if (tokenDetails) {
          // Send the token details as JSON
          res.json(tokenDetails);
        } else {
          res.status(404).json({ error: "Token not found" });
        }
      });
  });

app.post('/api/update-token-value', (req, res) => {
    const { token_level, faucet_id, current_token_number } = req.body;
    // Update the database with the new token details
    db.run(
    `UPDATE token_level_details SET token_level = ?, last_token_num = ? WHERE faucetID = ?`,
    [token_level, current_token_number, faucet_id],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database update error" });
        return;
      }
      res.json({ success: true });
    }
  );
  });

// Increment the counter and save it to the file
app.post('/increment', async (req, res) => {
    let tokenCount = 1.0;
    const { username } = req.body;

    if (!username) {
        return res.status(400).send('Username is required');
    }

    const currentTime = Date.now();
    const oneHour = 3600000;

    db.get('SELECT timestamp FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        if (row) {
            const lastRequestTime = row.timestamp;
            if (currentTime - lastRequestTime < oneHour) {
                return res.status(429).send('Request denied. Try again after one hour.');
            }
        }

        // Update timestamp and increment counter
        db.run('REPLACE INTO users (username, timestamp) VALUES (?, ?)', [username, currentTime], async (err) => {
            if (err) {
                return res.status(500).send('Database error');
            }

            counter++;
            await writeCounterToFile(counter);
            const hash = calculateSHA3_256Hash(counter);
            res.send(`Token value: ${hash}`);
        });

        const axios = require('axios');

        const addPeerDetails = 'http://localhost:20000/api/add-peer-details'
        const peerData = {
            DID: username, // Example DID
    DIDType: 2,  // Example DIDType
    PeerID: "12D3KooWcbaNmVQZyZPsPUPnPRYNbkNzcDLmjkmQ8VVGZ8vHxasG"
          };

        // First API URL and data
        const firstApiUrl = 'http://localhost:20000/api/initiate-rbt-transfer';
        const firstRequestData = {
          comment: "",
          receiver: username,
          sender: "bafybmif2cnmxooupsefy2rdy3vf3yt7xoojess4zedmoqvh3neezhi6uyq",
          tokenCount: tokenCount,
          type: 2
        };
        
        // Second API URL
        const secondApiUrl = 'http://localhost:20000/api/signature-response';
        
        // Make the first API request
        axios.post(firstApiUrl, firstRequestData, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          // Extract data from the first response
          const id = response.data.result.id;

          console.log('id:', id);
        
          // Prepare the second request data using the response from the first request
          const secondRequestData = {
            id: id, // Replace with actual key from first response
            password: 'mypassword'
          };
        
          // Make the second API request
          return axios.post(secondApiUrl, secondRequestData, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        })
        .then(response => {
          // Handle the response from the second API request
          console.log('Second API Response:', response.data);
          db.run(
            `UPDATE token_level_details SET tokens_transferred = tokens_transferred + ?`,
            [tokenCount],
            function (err) {
              if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Database update error" });
                return;
              }
              res.json({ success: true });
            }
          );
        })
        .catch(error => {
          // Handle errors from either request
          console.error('Error:', error);
        });

    });
});

// Start the server after initializing the counter
initializeCounter().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to initialize the counter:', err);
});