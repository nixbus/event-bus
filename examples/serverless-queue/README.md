# Serverless queue example with NixBus

Quick demo showing how ridiculously easy it is to create a serverless queue system using NixBus 🚀 It's so simple, just a few lines of code and boom 💥 you’ve got a fully working event-driven queue.

https://github.com/user-attachments/assets/55f6b030-3493-4992-a52a-957b07ceedad

## Installation

Install dependencies:
```bash
npm install
```

Set the environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file and set the `NIXBUS_TOKEN` and `NIXBUS_PASSPHRASE` variables.

Get your NixBus free token in one click here: https://nixbus.com/register/free

## Usage

```bash
npm start
```

## Related Packages

- [`event-bus`](https://github.com/nixbus/event-bus) - Secure, robust, and efficient event bus over HTTP/In-memory.
