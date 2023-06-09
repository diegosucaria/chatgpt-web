const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index');
});

// serve static css files 
app.use(express.static('public'));

app.post('/generate', async (req, res) => {
    const prompt = req.body.prompt;
    const temperature = req.body.temperature;
    const model = req.body.model;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
    };

    let data = ''
    let url = ''

    switch (model) {
        case 'gpt-3.5-turbo':
            url = 'https://api.openai.com/v1/chat/completions'
            //convert text model prompt to gpt 3.5 messages
            const regex = /(?:^|\n)(Human|AI):\s*(.*?)(?=(?:\n(?:Human|AI):\s*)|$)/gs;
            let messages = [];

            let match;
            while ((match = regex.exec(prompt)) !== null) {
                const role = match[1] === 'Human' ? 'user' : 'assistant';
                const content = match[2];
                messages.push({ role, content });
            }

            data = {
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 2000,
                n: 1,
                stop: null,
                temperature: temperature,
            };
            break;
        case 'text-davinci-002':
            url = 'https://api.openai.com/v1/engines/text-davinci-002/completions'

            data = {
                prompt: prompt,
                max_tokens: 2000,
                n: 1,
                stop: null,
                temperature: temperature,
            };
            break;
    }

    try {
        const response = await axios.post(url, data, { headers });
        res.json(response.data);
        // console.log(response.data)
        console.log(response.data.usage)
    } catch (error) {
        res.status(500).json({ error: 'Error calling ChatGPT-4 API' });
        console.log(error.response.data);
    }
});

app.post('/synthesize', async (req, res) => {
    const text = req.body.text;
    const ttsLanguage = req.body.ttsLanguage;

    const headers = {
        'Content-Type': 'application/json',
    };

    let neuralVersion = 'D';
    if(ttsLanguage == 'es-US') neuralVersion = 'C';
    
    const data = {
        input: {
          text: text,
        },
        voice: {
          languageCode: ttsLanguage,
          name: ttsLanguage + '-Neural2-' + neuralVersion,
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
    };

    try {
        const response = await axios.post('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + process.env.GOOGLE_API_KEY, data, { headers });
        res.send(response.data.audioContent);
        res.json(response.data);
        // console.log(response.data)
    } catch (error) {
        res.status(500).json({ error: 'Error calling TTS API' });
        console.log(error.response.data);
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
