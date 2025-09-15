require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

// React + Node.js tg bot @react_node_web_app_bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = 'https://' + process.env.HOST + ':' + process.env.PORT;
const bot = new TelegramBot(token, { polling: true });

const app = express();

app.use(express.json());
app.use(cors());

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
        if (text === '/start') {
            
            await bot.sendMessage(chatId, `Welcome to the bot!`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Let\'s go!', web_app: { url: webAppUrl } }]
                    ],
                    // "resize_keyboard": true,
                }
            })
            
            await bot.sendMessage(chatId, `Welcome to the bot!`, {
                reply_markup: {
                    keyboard: [
                        [{ text: 'Let\'s go!', web_app: { url: webAppUrl + '/form' } }]
                    ],
                    // "resize_keyboard": true,
                }
            })
        }

        if (msg?.web_app_data?.data) {
            try {
                const data = JSON.parse(msg?.web_app_data?.data);

                await bot.sendMessage(chatId, 'Thank you for your feedback!');
                await bot.sendMessage(chatId, 'Your country: ' + data?.country);
                await bot.sendMessage(chatId, 'Your street: ' + data?.street);

                setTimeout(async () => {
                    await bot.sendMessage(chatId, 'You will receive all the information in the chat.');
                }, 3000);
            }
            catch (e) {
                console.log('Error:', e.message );
            }
        }
        
        // Default response
        // bot.sendMessage(chatId, `You wrote: ${text}`);
    }
    
    catch (e) {
        console.log('Error:', e.message );
    }

    
});

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body;

    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Successful purchase',
            input_message_content: { 
                message_text: `Congratulations on your purchase! Total amount: $${totalPrice}`
            },
        })
        .then(() => res.status(200).json({}))
        .catch((e) => {
            bot.answerWebAppQuery(queryId, {
                type: 'article',
                id: queryId,
                title: 'Purchase failed',
                input_message_content: { 
                    message_text: 'Unfortunately, the purchase could not be completed.'
                },
            })
            
            console.log('Error:', e.message );
            return res.status(500).json({});
        });
    }
    catch (e) {
        console.log('Error:', e.message );
        return res.status(500).json({});
    }

});

const PORT = 8000;

app.listen(PORT, () => console.log('Server started on PORT ' + PORT));