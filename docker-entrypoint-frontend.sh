#!/bin/sh
# Évite les 502 au chargement : Nginx ne sert le front qu’après réponse de la gateway (réseau Docker).
# Désactiver : docker run -e WAIT_FOR_GATEWAY=0 ...
if [ "${WAIT_FOR_GATEWAY:-1}" != "0" ]; then
  echo "[frontend] Attente de http://ai-gateway:8095/internal/liveness ..."
  n=0
  max=120
  while [ "$n" -lt "$max" ]; do
    if curl -sf --connect-timeout 3 --max-time 12 "http://ai-gateway:8095/internal/liveness" >/dev/null 2>&1; then
      echo "[frontend] ai-gateway disponible."
      break
    fi
    n=$((n + 1))
    sleep 2
  done
  if [ "$n" -ge "$max" ]; then
    echo "[frontend] AVERTISSEMENT : ai-gateway injoignable après $((max * 2))s — démarrage de Nginx quand même (502 possibles)."
  fi
fi
exec nginx -g 'daemon off;'
