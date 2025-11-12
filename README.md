# Plataforma de Testes de Dons Espirituais

Aplicação full-stack para realização de testes de dons espirituais baseada no estudo "Desenvolvimento Natural da Igreja" de Christian A. Schwarz.

## 🚀 Funcionalidades

- ✅ Teste completo com 180 perguntas de autoavaliação (6 seções de 30 perguntas)
- ✅ Avaliação externa por 2 pessoas próximas (30 perguntas cada)
- ✅ Cálculo automático de Dons Manifestos e Latentes
- ✅ Envio de resultados por email
- ✅ Histórico de múltiplos testes por email
- ✅ Explicação detalhada dos 30 dons espirituais organizados por categoria
- ✅ Interface amigável com substituição dinâmica de respostas
- ✅ Persistência de progresso (localStorage)
- ✅ Links únicos para avaliação externa (uso único)

## 🛠️ Tecnologias

- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Node.js + Express + tRPC 11
- **Banco de Dados:** MySQL 8.0 (via Drizzle ORM)
- **Email:** Nodemailer com Gmail SMTP
- **Containerização:** Docker + Docker Compose

## 📦 Instalação e Execução

### Pré-requisitos

- Docker e Docker Compose instalados
- Conta Gmail com senha de app configurada ([como gerar](https://myaccount.google.com/apppasswords))

### Passo 1: Clonar o Repositório

```bash
# Baixe o projeto e extraia para uma pasta
cd gifts-test-platform
```

### Passo 2: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database Configuration
DATABASE_URL=mysql://gifts_user:gifts_password@db:3306/gifts_test

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET=your-secret-key-here

# Gmail SMTP Configuration (OBRIGATÓRIO)
GMAIL_USER=seu-email@gmail.com
GMAIL_APP_PASSWORD=sua-senha-de-app-do-gmail

# MySQL Configuration (para docker-compose)
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=gifts_test
MYSQL_USER=gifts_user
MYSQL_PASSWORD=gifts_password

# Application Configuration
VITE_APP_ID=gifts-test-platform
VITE_APP_TITLE=Teste de Dons Espirituais

# OAuth Configuration (opcional)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=
OWNER_NAME=
```

### Passo 3: Iniciar com Docker Compose

```bash
docker-compose up -d
```

Isso irá:
1. Construir a imagem Docker da aplicação
2. Iniciar o banco de dados MySQL
3. Iniciar a aplicação na porta 3000

### Passo 4: Aplicar Migrações do Banco de Dados

```bash
docker-compose exec app pnpm db:push
```

### Passo 5: Acessar a Aplicação

Abra o navegador em: `http://localhost:3000`

## 📧 Configuração de Email

Para que os resultados sejam enviados por email, você precisa:

1. Ter uma conta Gmail
2. Ativar a autenticação de dois fatores (2FA)
3. Gerar uma senha de app: https://myaccount.google.com/apppasswords
4. Configurar `GMAIL_USER` e `GMAIL_APP_PASSWORD` no arquivo `.env`

## 🐳 Comandos Docker Úteis

```bash
# Iniciar os containers
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar os containers
docker-compose down

# Parar e remover volumes (apaga o banco de dados)
docker-compose down -v

# Reconstruir a imagem
docker-compose build --no-cache

# Acessar o shell do container da aplicação
docker-compose exec app sh

# Acessar o MySQL
docker-compose exec db mysql -u gifts_user -p gifts_test
```

## 📂 Estrutura do Projeto

```
gifts-test-platform/
├── client/              # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas da aplicação
│   │   ├── components/ # Componentes reutilizáveis
│   │   └── lib/        # Configurações (tRPC)
│   └── public/         # Assets estáticos
├── server/             # Backend Node.js
│   ├── routers.ts      # Rotas tRPC
│   ├── db.ts           # Helpers do banco de dados
│   ├── giftCalculation.ts  # Lógica de cálculo
│   └── emailService.ts # Serviço de envio de email
├── drizzle/            # Schema do banco de dados
├── shared/             # Dados compartilhados (perguntas, dons)
├── Dockerfile          # Configuração Docker
└── docker-compose.yml  # Orquestração de containers
```

## 🎨 Categorias de Dons

Os 30 dons espirituais estão organizados em 3 categorias:

- 🟩 **Verde (10 dons):** Revelação de Deus na Criação
- 🔴 **Vermelho (10 dons):** Pregação do Evangelho e Liderança
- 🟦 **Azul (10 dons):** Poder Sobrenatural de Deus

## 📝 Lógica de Cálculo

### Dons Manifestos
- Perguntas: 1-30, 61-90, 121-150, A-AD, a-ad
- Critério: Dons com pontuação **acima de 20**

### Dons Latentes
- Perguntas: 31-60, 91-120, 151-180
- Critério: **5 dons** com maior pontuação que **NÃO** foram classificados como Manifestos

## 👨‍💻 Desenvolvimento

Para desenvolvimento local sem Docker:

```bash
# Instalar dependências
pnpm install

# Configurar .env com DATABASE_URL apontando para MySQL local

# Aplicar schema
pnpm db:push

# Iniciar em modo desenvolvimento
pnpm dev
```

## 📄 Licença

Desenvolvido por **Control Fin Solutions**

## 🙏 Créditos

Baseado no estudo "Desenvolvimento Natural da Igreja" de Christian A. Schwarz.
