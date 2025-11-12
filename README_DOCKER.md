# Gifts Test Platform — Docker

Este pacote contém arquivos prontos para rodar **tudo no Docker**.

## O que está incluso
- `Dockerfile` (único estágio, instala deps, compila client (Vite) + server (esbuild) e sobe)
- `docker-compose.yml` (MySQL 8 + App, com healthcheck de banco)
- `.dockerignore` (para manter a imagem pequena)

> Observação: no `CMD` do container, rodamos `pnpm run db:push` antes do `node dist/index.js` para aplicar as migrações do Drizzle automaticamente.

## Requisitos
- Docker e Docker Compose instalados
- Porta `3000` livre
- Porta `3306` livre (se quiser expor o MySQL)

## Como usar

1. **Copie os arquivos para a raiz do seu projeto** (onde estão `package.json`, `server/`, `client/`, etc.):
   ```bash
   cp -v Dockerfile docker-compose.yml .dockerignore /caminho/do/seu/projeto/
   ```

2. **Crie o `.env`** (opcional, caso queira sobrescrever variáveis). Um exemplo:

   ```env
   # Database
   DATABASE_URL=mysql://gifts_user:gifts_password@db:3306/gifts_test

   # JWT
   JWT_SECRET=sua-chave-bem-aleatoria-aqui

   # SMTP (se for enviar e-mails de resultados)
   GMAIL_USER=seu-email@gmail.com
   GMAIL_APP_PASSWORD=sua-senha-de-app-do-gmail

   # App
   VITE_APP_ID=gifts-test-platform
   VITE_APP_TITLE=Teste de Dons Espirituais

   # OAuth (opcional)
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://auth.manus.im
   OWNER_OPEN_ID=
   OWNER_NAME=
   ```

3. **Build + subir**:
   ```bash
   docker compose up --build
   ```

4. Acesse: <http://localhost:3000>

## Notas técnicas

- O servidor escolhe automaticamente uma porta disponível, mas fixamos `PORT=3000` no serviço por padrão.
- O Vite é usado **apenas no build**; em produção entregamos estático a partir de `client/dist`.
- O banco é **MySQL 8** (dialeto já configurado no Drizzle). Se preferir, troque por MariaDB 11.3 e mantenha a `DATABASE_URL` no formato MySQL.
- Para resetar o banco:
  ```bash
  docker compose down -v
  docker compose up --build
  ```

## Erros comuns

- **`ER_ACCESS_DENIED_ERROR`**: confira `MYSQL_USER/MYSQL_PASSWORD` e se a `DATABASE_URL` bate com as mesmas credenciais.
- **`Could not find the build directory: client/dist`**: garanta que o comando de build rodou com sucesso no Docker (logs do `app`).
- **Porta 3000 ocupada**: pare outros serviços nessa porta ou mude o mapeamento em `docker-compose.yml`.

---

Se quiser, posso adaptar para **imagem multi-stage** (menor) ou adicionar um serviço de **MailHog** para testar e-mails localmente.
