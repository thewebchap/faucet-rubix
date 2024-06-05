 Rubix Faucet

Welcome to the RUbix Faucet project!

## Overview

A rubix faucet is a service that distributes small amounts of testnet RBTs to users for free. It's used for testing purposes for core contributors and dapp developers to simulate their features and products.

This project aims to provide a simple rubix faucet implementation that distributes testnet RBTs to users upon request.

## Features

- Allows users to request a small amount of RBT.
- Limits the frequency of requests to prevent abuse.
- Tracks usage statistics.

## Project structure

- /app contains the backend built in node and uses sqlite3 db
- /ui consist of the component built in react