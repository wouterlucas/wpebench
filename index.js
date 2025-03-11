/**
 * Benchmarking Utility
 *
 * This utility will send JavaScript benchmarking snippets to an external device via WebSockets.
 * It supports prerequisite/setup logic, two benchmark options, and teardown logic.
 *
 * @module BenchmarkingUtility
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { generateBenchmarkHtml } = require('./src/generateBenchmarkHtml');

let activeBenchmark = null;

/**
 * Create the main HTTP server to serve the UI
 */
const createMainHttpServer = () => {
    const app = express();

    // Serve public UI files
    app.use(express.static(path.join(__dirname, 'public')));

    const server = app.listen(8080, () => {
        console.log('Main UI Server running on http://localhost:8080');
    });

    return server;
};

/**
 * Create an HTTP server to serve the benchmark options and libraries
 * @param {Object} routes - An object containing route configurations
 * @param {string} sessionId - The session ID for the benchmark
 * @returns {http.Server}
 */
const createHttpServer = (routes, sessionId) => {
    const app = express();

    // Serve libraries for this session
    app.use('/libs', express.static(path.join(__dirname, 'public/libs')));

    // Dynamic routes for benchmarks
    Object.entries(routes).forEach(([routePath, content]) => {
        app.get(routePath, (req, res) => res.send(content));
    });

    const server = app.listen(3001, () => {
        console.log(`Benchmark Server for session ${sessionId} running on http://localhost:3001`);
    });

    return server;
};

/**
 * Create a WebSocket server
 * @param {number} port - Port number to start the WebSocket server on
 * @returns {WebSocket.Server}
 */
const createWebSocketServer = (port) => {
    const wss = new WebSocket.Server({ port });
    console.log(`WebSocket Server running on ws://localhost:${port}`);
    return wss;
};


/**
 * Start a benchmark session
 * @param {Object} ws - WebSocket connection
 * @param {Object} options - Benchmark options including setup, optionA, optionB, teardown, libraries
 */
const startBenchmark = (ws, { setup, optionA, optionB, teardown, libraries = [] }) => {
    if (activeBenchmark) {
        activeBenchmark.server.close(() => {
            console.log(`Previous benchmark session ${activeBenchmark.sessionId} stopped.`);
        });
        ws.send(JSON.stringify({ status: 'benchmark_stopped', sessionId: activeBenchmark.sessionId }));
    }

    const sessionId = uuidv4();

    const combinedHtml = generateBenchmarkHtml(setup, optionA, optionB, teardown, libraries);

    const url = `http://localhost:3001/${sessionId}`;

    const routes = {
        [`/${sessionId}`]: combinedHtml
    };

    const server = createHttpServer(routes, sessionId);

    activeBenchmark = { sessionId, server };

    ws.send(JSON.stringify({
        status: 'benchmark_started',
        url,
        sessionId
    }));

    // Listener for benchmark completion
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'stop_benchmark' && data.sessionId === sessionId) {
                server.close(() => {
                    console.log(`Benchmark session ${sessionId} stopped and HTTP server closed.`);
                });
                ws.send(JSON.stringify({ status: 'benchmark_stopped', sessionId }));
                activeBenchmark = null;
            }
        } catch (err) {
            ws.send(JSON.stringify({ status: 'error', message: err.message }));
        }
    });

    // Execution logic placeholder
    console.log('Benchmark execution logic to be implemented.');
};

// Start Main UI Server
createMainHttpServer();

// WebSocket Server Setup
const wss = createWebSocketServer(8081);

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'start_benchmark') {
                startBenchmark(ws, data.payload);
            }
        } catch (err) {
            ws.send(JSON.stringify({ status: 'error', message: err.message }));
        }
    });

    ws.send(JSON.stringify({ status: 'connected' }));
});