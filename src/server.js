require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { init } = require('./socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
init(server);

connectDB().then(() => {
    connectRedis();
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
