# Pubblicazione gratis

Santinitiative e statica: bastano `index.html`, `styles.css` e `app.js`.

## Opzione consigliata: Cloudflare Pages

1. Crea un account Cloudflare.
2. Vai su Workers & Pages.
3. Crea una nuova applicazione Pages.
4. Carica la cartella dell'app oppure collegala a un repository Git, per esempio `santinitiative`.
5. Non serve un comando di build.
6. La directory da pubblicare e la cartella che contiene `index.html`.

Cloudflare fornira un link pubblico HTTPS del tipo `nome.pages.dev`.

## Opzione semplice: GitHub Pages

1. Crea un repository pubblico su GitHub.
2. Carica dentro i tre file dell'app.
3. Attiva Pages dalle impostazioni del repository.
4. Pubblica dalla branch principale.

GitHub fornira un link pubblico HTTPS del tipo `utente.github.io/repository`.

## Nota importante sul microfono

Il riconoscimento vocale funziona meglio su HTTPS. I link pubblici di Cloudflare Pages e GitHub Pages usano HTTPS, quindi sono adatti anche da telefono.
