# Bot WhatsApp NTPlay

Atende no WhatsApp do número (42) 92002-8569: apresenta planos e preços da Lista IPTV, App NTPlay, combo e teste grátis, coleta o aparelho e avisa o dono para continuar o atendimento.

Spec: `../docs/superpowers/specs/2026-11-14-whatsapp-bot-ntplay-design.md`

## Rodar local

Requisitos: Node.js 22 ou superior. Crie o `.env`:

```bash
cp .env.example .env
npm ci
```

Simular a conversa sem WhatsApp:

```bash
npm run sim
```

Rodar testes e checar tipos:

```bash
npm test
npm run typecheck
```

## Conectar o WhatsApp

```bash
npm run login
```

Escaneie o QR no celular do número que vai atender (WhatsApp > Dispositivos conectados > Conectar dispositivo). A sessão fica em `auth/`. O QR também é salvo em `auth/qr.png`.

Depois:

```bash
npm start
```

## Deploy no Google Cloud Free

1. Crie a conta no Google Cloud com cartão e um projeto.
2. Compute Engine > Criar instância:
   - Região `us-central1`, zona `us-central1-a`
   - Série `E2`, tipo `e2-micro`
   - Disco `30 GB` padrão (não SSD)
   - Imagem `Ubuntu 24.04 LTS`
   - Firewall: não marque HTTP/HTTPS
3. Abra o SSH pelo navegador e rode:

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/NataNpg/ntplay-whatsapp-bot.git /tmp/bot
cd /tmp/bot
bash deploy/install.sh
cp -r /tmp/bot/. /opt/ntplay-bot/
cd /opt/ntplay-bot
npm ci
cp .env.example .env
nano .env   # opcional: ALERT_NUMBER para receber avisos em outro número
npm run login
```

4. Crie o serviço:

```bash
sudo tee /etc/systemd/system/ntplay-bot.service >/dev/null <<EOF
[Unit]
Description=NTPlay WhatsApp Bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=/opt/ntplay-bot
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now ntplay-bot
journalctl -u ntplay-bot -f
```

5. Se o QR expirar, pare o serviço e rode `npm run login` de novo.

## Atualizar

```bash
cd /opt/ntplay-bot
git pull
npm ci
sudo systemctl restart ntplay-bot
```

## Backup

- `auth/` — sessão do WhatsApp. Se perder, precisa escanear o QR de novo.
- `data/bot.db` — contatos e pedidos.

```bash
tar czf backup-ntplay-bot.tgz auth data .env
```

## Problemas comuns

- **Sessão encerrada**: o log mostra "Sessão encerrada". Rode `npm run login` e escaneie o QR.
- **Bot não responde**: confira `journalctl -u ntplay-bot -f` e se o celular tem internet.
- **`better-sqlite3` falhou no build**: `sudo apt-get install -y build-essential python3 && npm rebuild better-sqlite3`.
- **VM desligada**: ligue a instância; o serviço sobe sozinho.

## Riscos

Baileys é uma conexão não oficial. O risco de bloqueio do número existe, ainda que baixo para um bot que só responde mensagens recebidas. Não use para disparo em massa.
