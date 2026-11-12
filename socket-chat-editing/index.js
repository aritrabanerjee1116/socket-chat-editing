//const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./app/config/db');
const session = require('express-session');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const express = require('express');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");           // prefer IPv4 — fixes SRV timeouts on Windows
dns.setServers(["1.1.1.1", "8.8.8.8", "9.9.9.9", "8.8.4.4"]);

dotenv.config();
//const app = express();
connectDB();

//setup session
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	}),
);

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.static('public'));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const userRouter = require('./app/router/userRoute');
const User = require('./app/model/user');

app.use(userRouter);

/*scoket.io*/

/**define namespace */
var usp = io.of('/user-name');

usp.on('connection', async (socket) => {
	const user_id = socket.handshake.auth.token;

	if (!user_id) return;

	console.log('User connected:', user_id);

	// Join private room
	socket.join(user_id);

	await User.findByIdAndUpdate(user_id, { $set: { is_online: '1' } });

	socket.broadcast.emit('OnlineUser', { user_id });

	// Listen new messages from the frontend
	socket.on('new-message', (data) => {
		usp.to(data.receiver_id).emit('load-new-message', data);
	});

	socket.on('disconnect', async () => {
		console.log('User disconnected:', user_id);

		await User.findByIdAndUpdate(user_id, { $set: { is_online: '0' } });

		socket.broadcast.emit('OfflineUser', { user_id });
	});
});

const port = 3006;
http.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
