# eduardamarinho.com.br

Site da Eduarda Marinho hospedado em VPS via Docker + Nginx Proxy Manager.

## Stack

- **Site principal:** HTML/CSS/JS estático em `public/`, servido por Nginx Alpine
- **Subprojetos:** containers Node/React/SQLite rodando no mesmo domínio em subpaths (ex: `/quiz`, `/api`, ...)
- **HTTPS:** Let's Encrypt via Nginx Proxy Manager — já configurado no servidor, não mexer
- **Deploy:** automático via GitHub Actions a cada push em `main` (~10s)

## Estrutura

```
.
├── public/              # site estático servido em /
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── images/
├── nginx.conf           # routing: serve estáticos em / + proxy_pass pros subprojetos
├── Dockerfile           # imagem Nginx Alpine
├── docker-compose.yml   # serviço eduardamarinho-app na rede proxy-network
├── projetos/            # criar quando adicionar primeiro subprojeto
│   └── <nome>/
└── .github/workflows/
    └── deploy.yml       # CI/CD (não mexer sem motivo)
```

## Fluxo de trabalho

Editar → `git push origin main` → site atualiza em ~10s.

Não precisa rodar nada no servidor. Se algum push falhar no CI, ver os logs em
https://github.com/eduardamarinhoo/quiz/actions.

Para preview local de mudanças no estático, abrir `public/index.html` direto no navegador.

## Adicionar um subprojeto Node/React

Cada subprojeto vira um container separado, proxiado por um subpath do domínio.

**Exemplo: adicionar uma API Node em `/quiz`.**

**1.** Criar `projetos/quiz/` com Dockerfile + código:

```
projetos/quiz/
├── Dockerfile
├── package.json
└── server.js          # deve escutar em 0.0.0.0:3000
```

`Dockerfile` típico:
```dockerfile
FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

**2.** Adicionar o serviço no `docker-compose.yml`:

```yaml
services:
  eduardamarinho-app:
    # ... (mantém como está) ...

  quiz:
    build: ./projetos/quiz
    container_name: quiz
    restart: unless-stopped
    networks:
      - proxy-network
```

**3.** Adicionar `location` no `nginx.conf` (já tem template comentado lá):

```nginx
location /quiz/ {
  proxy_pass http://quiz:3000/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

**4.** `git push origin main` — o Actions builda os dois containers e sobe.

## SQLite

Se um subprojeto usar SQLite, declarar um volume nomeado no `docker-compose.yml` pra persistir os dados entre deploys:

```yaml
services:
  quiz:
    # ...
    volumes:
      - quiz_data:/app/data    # ajustar pro path que o app usa

volumes:
  quiz_data:
```

Sem volume nomeado os dados somem a cada rebuild.

## O que NÃO fazer

- **Não expor portas no host** (não usar `ports:` no `docker-compose.yml`). O acesso externo passa exclusivamente pelo Nginx Proxy Manager — containers Node só conversam pela `proxy-network` interna.
- **Não renomear o container `eduardamarinho-app`** — o Nginx Proxy Manager no servidor aponta pra ele pelo nome.
- **Não remover ou recriar a `proxy-network`** — é compartilhada com o NPM e outros containers do servidor.
- **Não modificar `.github/workflows/deploy.yml`** sem entender o impacto — ele é o que chama o script de deploy no VPS.
