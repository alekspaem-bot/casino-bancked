const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGODB_URI = 'mongodb+srv://alekspaem_db_user:090613Al@cluster0.jrjfsor.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  balance: { type: Number, default: 10 },
  lastDaily: { type: Date, default: null },
  totalWins: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

// ===== БОНУС С УЛУЧШЕННОЙ ЗАЩИТОЙ =====
app.post('/daily', async (req, res) => {
  try {
    const { telegramId } = req.body;
    if (!telegramId) {
      return res.status(400).json({ success: false, message: 'Ошибка: не передан ID пользователя' });
    }
    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({ telegramId });
    }
    const now = new Date();
    if (!user.lastDaily || (now - user.lastDaily) > 24 * 60 * 60 * 1000) {
      user.balance += 10;
      user.lastDaily = now;
      await user.save();
      res.json({ success: true, balance: user.balance });
    } else {
      res.json({ success: false, message: 'Бонус уже получен сегодня' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
  }
});

// ===== ПОЛУЧИТЬ БАЛАНС =====
app.post('/get-balance', async (req, res) => {
  const { telegramId } = req.body;
  let user = await User.findOne({ telegramId });
  if (!user) {
    user = new User({ telegramId });
    await user.save();
  }
  res.json({ balance: user.balance });
});

// ===== ОБНОВИТЬ БАЛАНС =====
app.post('/update-balance', async (req, res) => {
  const { telegramId, newBalance } = req.body;
  let user = await User.findOne({ telegramId });
  if (!user) {
    user = new User({ telegramId });
  }
  user.balance = newBalance;
  await user.save();
  res.json({ success: true, balance: user.balance });
});

// ===== ТУРНИР =====
app.get('/top-players', async (req, res) => {
  const users = await User.find({}).sort({ balance: -1 }).limit(10);
  res.json(users.map(u => ({ id: u.telegramId, balance: u.balance })));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));