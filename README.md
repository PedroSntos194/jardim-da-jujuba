# O Jardim Que Você Fez Florescer em Mim

Um presente digital feito à mão: um jardim que começa vazio e vai florescendo conforme a Jujuba descobre cada mensagem.

## Antes de entregar

1. **A data de vocês** — em `js/script.js`, primeira linha editável:
   ```js
   const dataInicioNamoro = new Date("2024-01-01T00:00:00"); // ← a data de vocês
   ```
2. **A música** — salve o arquivo como `assets/music/nossa-musica.mp3`.

## Rodar localmente

Abra o `index.html` direto no navegador, ou sirva a pasta (recomendado, para a música e as fontes carregarem sem bloqueios):

```bash
npx serve .
```

## Publicar

- **GitHub Pages**: suba a pasta inteira num repositório e ative Pages na branch principal (raiz `/`).
- **Vercel**: `vercel` na pasta, ou importe o repositório. Não precisa de build.

## Estrutura

```text
index.html
css/
  style.css        layout, cores, componentes
  animations.css   keyframes e prefers-reduced-motion
js/
  garden.js        flores em svg + jardim de fundo (estrelas, vagalumes, pétalas)
  music.js         player
  script.js        abertura, capítulos, contador, buquê, carta, final, surpresas
assets/
  music/nossa-musica.mp3
  svg/margarida.svg, tulipa.svg, lirio.svg
```

## Surpresas escondidas

- clicar 5 vezes em "Jujuba"
- uma estrela no canto do céu
- uma flor azul pequena entre as margaridas
- uma florzinha dourada perto do contador
- uma caixinha atrás de uma folha, perto da carta
- segurar o coração no canto inferior esquerdo por 3 segundos

O progresso fica salvo no navegador (`localStorage`). Para recomeçar do zero, apague a chave `jardim-da-jujuba` no DevTools ou rode no console:

```js
localStorage.removeItem('jardim-da-jujuba')
```
