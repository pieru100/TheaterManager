# Theater Manager

Webapp statica in HTML, CSS e JavaScript puro per la gestione di spettacoli, sale e risorse di un teatro.

## Avvio

Apri `index.html` con Safari. Non sono richiesti build, server o dipendenze esterne.

## Funzioni principali

- Calendario giorno, settimana, mese e anno.
- Creazione spettacoli con nome, data, ora, durata, sala e colore personalizzato.
- Gestione risorse per categorie: macchinisti, sicurezza, maschere, attori, sedie, articoli di scena, tavoli.
- Visualizzazione degli impegni di ogni risorsa con data, orario, sala e spettacolo collegato.
- Visualizzazione degli impegni di ogni sala con spettacoli ospitati e risorse assegnate.
- Periodi di indisponibilita per risorse e sale con data/ora di inizio e fine.
- Controllo conflitti: la stessa sala o la stessa risorsa non possono essere usate in eventi sovrapposti.
- Database locale nel browser con IndexedDB e fallback localStorage.
- Esportazione e importazione JSON per backup.
- Gestione anagrafica delle sale.
- Sezione Guida con capitoli sull'utilizzo dell'applicativo.

## Note

I dati restano nel browser e nel profilo utente in cui la webapp viene aperta. Per spostarli su un altro Mac o browser, usa `Dati > Esporta JSON` e poi `Importa JSON`.
