#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "Rode como usuário normal; o script usa sudo quando precisa."
  exit 1
fi

sudo apt-get update
sudo apt-get install -y curl git build-essential python3

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

sudo mkdir -p /opt/ntplay-bot
sudo chown "$(id -u):$(id -g)" /opt/ntplay-bot

echo "Pronto: Node $(node -v), swap de 2G e /opt/ntplay-bot criados."
