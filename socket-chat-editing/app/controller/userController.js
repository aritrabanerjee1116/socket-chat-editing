const e = require('express');
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const Chat = require('../model/chat');

class UserController {
	async home(req, res) {
		res.render('home', {
			title: 'home page',
		});
	}

	async register(req, res) {
		res.render('register', {
			title: 'register page',
		});
	}

	async dashboard(req, res) {
		try {
			const othersUser = await User.find({
				_id: { $nin: [req.session.user._id] },
			});
			res.render('dashboard', {
				title: 'dashboard page',
				data: req.session.user,
				users: othersUser,
			});
		} catch (error) {
			console.log(error);
		}
	}

	async getChats(req, res) {
		try {
			const { receiver_id } = req.query;
			const sender_id = req.session.user._id;

			const chats = await Chat.find({
				$or: [
					{ sender_id, receiver_id },
					{ sender_id: receiver_id, receiver_id: sender_id },
				],
			}).sort({ createdAt: 1 });

			const formattedChats = chats.map((chat) => ({
				...chat._doc,
				sender_id: chat.sender_id.toString(),
				receiver_id: chat.receiver_id.toString(),
			}));

			res.json({ chats: formattedChats });
		} catch (error) {
			console.error(error);
			res.status(500).json({ message: 'Failed to fetch chats' });
		}
	}

	async create(req, res) {
		try {
			console.log('New chat request is coming');
			const { name, email, password } = req.body;

			//const user=await User.findOne({email})

			const salt = await bcrypt.genSalt(10);
			const hashedpassword = await bcrypt.hash(password, salt);
			const user = new User({
				name,
				email,
				password: hashedpassword,
			});
			const result = await user.save();

			if (result) {
				//console.log('user',result);
				res.redirect('/login');
			} else {
				console.log('something wrang');
				res.redirect('/register');
			}
		} catch (error) {
			console.log(error);
		}
	}

	async loginview(req, res) {
		res.render('login', {
			title: 'login page',
		});
	}

	async loginCreate(req, res) {
		try {
			const { email, password } = req.body;
			const user = await User.findOne({ email });
			if (user) {
				const validpassword = await bcrypt.compare(password, user.password);
				// console.log('ff',req.session.user=user);

				if (validpassword) {
					req.session.user = user;
					res.redirect('/dashboard');
				} else {
					res.render('login', { message: 'invalid email or password' });
				}
			} else {
				res.redirect('/login');
			}
		} catch (error) {
			console.log(error);
		}
	}

	async logout(req, res) {
		req.session.destroy();
		res.redirect('/login');
	}

	async saveChat(req, res) {
		try {
			const { sender_id, receiver_id, message } = req.body;

			const chats = new Chat({
				sender_id,
				receiver_id,
				message,
			});
			const result = await chats.save();
			console.log(result);

			return res.status(200).json({
				success: true,
				message: 'message send',
				data: result,
			});
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: error.message,
			});
		}
	}
}

module.exports = new UserController();
