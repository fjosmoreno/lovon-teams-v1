import ZAI from 'z-ai-web-dev-sdk';

async function readPaperclip() {
  const zai = await ZAI.create();
  const result = await zai.functions.invoke('page_reader', {
    url: 'https://paperclip.ing/'
  });
  const html = result.data.html || '';
  const cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/@font-face\{[^}]*\}/gi, '')
    .replace(/:root\{[^}]*\}/gi, '');
  const text = cleaned.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n').trim();
  console.log(text.slice(7000, 16000));
}

readPaperclip().catch(console.error);
