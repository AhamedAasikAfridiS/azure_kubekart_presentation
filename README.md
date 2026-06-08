# KubeCart Monolith

KubeCart is now deployed as:

1. One Node.js/Express monolith on Azure App Service.
2. One React build served by that Express application.
3. Microsoft Entra ID authentication through App Service Authentication.
4. One Azure Service Bus queue used only for notification messages.
5. One Azure Function that consumes the queue and sends email.
6. One MongoDB-compatible database used by both the App Service and Function.

The original service folders remain in the repository as migration reference.
They are not separate runtime deployments. The production App Service starts
from `monolithic-version/package.json` and `monolithic-version/server.js`.

## Important files

- `server.js`: App Service process and SPA host.
- `src/`: monolithic API, models, Entra authorization, and Service Bus sender.
- `Kubecart-frontend/`: React application using the Easy Auth session.
- `notification-function/`: separately deployed Service Bus-triggered Function.
- `steps_to_do.md`: complete Azure deployment runbook.
- `ai_context.md`: requirements and architecture context for future AI work.

## Local start

1. Change directory to `monolithic-version/`.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI`.
4. For local-only identity simulation, set `DEV_AUTH_BYPASS=true`.
5. Set either `SERVICE_BUS_NAMESPACE` or
   `SERVICE_BUS_CONNECTION_STRING`.
6. Run:

```powershell
npm install
npm run build
npm start
```

Open `http://localhost:8080`.

## Seed products

The existing product seed data is retained:

```powershell
npm run seed:products
```

## Deployment

Follow [steps_to_do.md](steps_to_do.md). Do not deploy the original service
folders as independent applications.
