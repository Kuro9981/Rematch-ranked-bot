# Redis Setup Guide for Railway

Questo progetto è stato aggiornato da JSON locale a **Redis** per supportare multiple istanze dello stesso bot su server Discord diversi.

## Vantaggi di Redis

✅ Dati sincronizzati tra istanze  
✅ Isolamento per server (namespace con INSTANCE_ID)  
✅ Performance superiore ai file JSON  
✅ Facile deploy su Railway  

## Come Configurare

### 1. Aggiunta Redis Add-on su Railway

1. Vai al dashboard di Railway: https://railway.app
2. Apri il tuo progetto
3. Clicca su **"Add"** (+ button)
4. Seleziona **"Redis"**
5. Railway auto-genererà `REDIS_URL` nelle variabili ambiente

### 2. Configurare le Variabili Ambiente

Per ogni istanza del bot, imposta:

```
DISCORD_TOKEN=<your_bot_token>
INSTANCE_ID=server-1
REDIS_URL=<auto da Railway>
```

**Esempio per 2 server:**

**Bot Instance 1:**
```
DISCORD_TOKEN=token_for_bot_1
INSTANCE_ID=server-1
REDIS_URL=<auto>
```

**Bot Instance 2:**
```
DISCORD_TOKEN=token_for_bot_2
INSTANCE_ID=server-2
REDIS_URL=<auto>
```

### 3. Struttura dei Dati in Redis

I dati sono organizzati come:
```
server-1:teams
server-1:matches
server-1:queue
server-1:ranks

server-2:teams
server-2:matches
server-2:queue
server-2:ranks
```

Ogni istanza ha dati completamente isolati.

## Sviluppo Locale

Per testare localmente, assicurati che Redis sia in esecuzione:

```bash
# Se usi Docker
docker run -d -p 6379:6379 redis

# Oppure installa Redis sul sistema
# Windows: https://github.com/microsoftarchive/redis/releases
# Mac: brew install redis
# Linux: sudo apt-get install redis-server
```

Poi avvia il bot:
```bash
INSTANCE_ID=local npm start
```

## Troubleshooting

### Cannot connect to Redis
- Verifica che `REDIS_URL` sia corretto su Railway
- Controlla che Redis add-on sia abilitato nel progetto
- Nel locale, assicurati che il server Redis sia in esecuzione

### Dati scomparsi tra restart
- Questo è normale - Redis in memory può essere perso se il servizio restart
- Per dati persistenti su Railway, upgrade a un piano con backup

### Istanze si condividono i dati
- Verifica di aver impostato `INSTANCE_ID` diversi per ogni istanza
- Controlla i nomi delle chiavi in Redis usando `redis-cli`:
```bash
redis-cli
> KEYS *
```

## Test

Per verificare che tutto funzioni:

1. Crea un team su Server 1: `/createteam`
2. Verifica che il team non esista su Server 2
3. I dati rimangono tra i restart del bot
4. Le statistiche MMR si aggiornano correttamente

## Migrazione da JSON

Se avevi dati nel vecchio sistema JSON:

1. I file `data/*.json` non vengono più usati
2. Redis è la nuova fonte di verità
3. Per trasferire dati: devi manualmente importarli via comando o script
4. Considera di fare un backup prima della migrazione

---

**Domande?** Controlla il file `package.json` per vedere se tutte le dipendenze sono installate.
