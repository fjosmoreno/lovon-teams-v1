import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzePalette() {
  const zai = await ZAI.create();
  const imageBuffer = fs.readFileSync('/home/z/my-project/upload/pasted_image_1782865695824.png');
  const base64Image = imageBuffer.toString('base64');

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analise esta imagem de paleta de cores. Liste TODAS as cores visíveis com seus códigos hexadecimais exatos (se houver texto na imagem) ou descreva cada cor com o hex aproximado. Organize a resposta em formato JSON com a estrutura: {"cores": [{"nome": "string", "hex": "#XXXXXX", "uso": "fundo/texto/destaque/etc"}]}. Seja preciso e completo.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    thinking: { type: 'disabled' }
  });

  console.log(response.choices[0]?.message?.content);
}

analyzePalette().catch(console.error);
