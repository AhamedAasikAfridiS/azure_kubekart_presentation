# AI Context: KubeCart Azure Monolith

## Purpose

This file is the durable source of requirements and architecture decisions for
future AI-assisted work in this repository.

## User requirements

1. Convert the existing KubeCart microservice code into a monolithic
   application suitable for Azure App Service.
2. Replace the manual email/password/JWT authentication service with Microsoft
   Entra ID.
3. Use Azure Service Bus only for notification processing.
4. Run notification processing in an Azure Function whenever a message arrives
   in the notification queue.
5. Keep Azure deployment steps in `steps_to_do.md`.
6. Keep future AI context in this file.

## Required architecture

```text
Browser
  |
  | HTTPS and Entra ID session
  v
Azure App Service
  - React static build
  - Express API
  - products, carts, orders, profiles
  - authorization from Easy Auth headers
  |
  +---- MongoDB-compatible database
  |
  +---- Service Bus queue: notifications
             |
             v
       Azure Function
       - sends email
       - writes notification log
```

## Architecture invariants

- The web application is one App Service process, not multiple API services.
- React and Express use the same origin.
- Runtime code starts from `monolithic-version/server.js`.
- Product, cart, order, profile, and notification-log models are under
  `src/models`.
- Cart and order logic must call models/modules directly. Do not add internal
  HTTP calls between domain modules.
- Do not restore the local `auth-service` JWT, refresh-token, password hashing,
  registration, or login flow.
- Authentication uses Azure App Service Authentication, also called Easy Auth,
  with Microsoft Entra ID.
- Protected API routes read the trusted `X-MS-CLIENT-PRINCIPAL` header injected
  by App Service.
- Public catalog routes may remain anonymous. Authorization is enforced in the
  Express routes.
- Admin authorization uses the Entra application role value `Admin`.
- A user without the `Admin` role is treated as a `customer`.
- `DEV_AUTH_BYPASS` is local-development-only and must be ignored in Azure.
- Service Bus is not a general application event bus in this project.
- Only notification commands are sent to the `notifications` queue.
- The App Service sends messages. It never sends notification email directly.
- The Azure Function is the only email sender.
- The Function must throw after a send failure so Service Bus can retry.
- Notification records use `messageId` for idempotency.
- Both App Service and Function use the same `MONGO_URI`.

## Current notification events

- `order_confirmation`
- `order_cancelled`

The queue message contract is:

```json
{
  "messageId": "order_confirmation:<order-id>",
  "to": "customer@example.com",
  "type": "order_confirmation",
  "subject": "Order confirmed - #<order-id>",
  "payload": {
    "orderId": "<order-id>",
    "totalAmount": 1000,
    "items": [
      {
        "name": "Product",
        "price": 500,
        "quantity": 2
      }
    ]
  }
}
```

## Azure identity and permissions

- App Service system-assigned managed identity:
  `Azure Service Bus Data Sender` on the notification queue or namespace.
- Function App system-assigned managed identity:
  `Azure Service Bus Data Receiver` on the notification queue or namespace.
- Prefer managed identity over Service Bus connection strings in Azure.
- Function identity-based binding setting:
  `ServiceBusConnection__fullyQualifiedNamespace`.
- App Service sender setting:
  `SERVICE_BUS_NAMESPACE`.

## App Service settings

Required:

- `NODE_ENV=production`
- `MONGO_URI`
- `SERVICE_BUS_NAMESPACE`
- `SERVICE_BUS_NOTIFICATION_QUEUE=notifications`
- `SCM_DO_BUILD_DURING_DEPLOYMENT=true`

Optional local fallback only:

- `SERVICE_BUS_CONNECTION_STRING`

## Function App settings

- `FUNCTIONS_WORKER_RUNTIME=node`
- `ServiceBusConnection__fullyQualifiedNamespace`
- `SERVICE_BUS_NOTIFICATION_QUEUE=notifications`
- `MONGO_URI`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Deployment boundaries

- Deploy the contents of `monolithic-version/` to Azure App Service.
- Deploy only `notification-function/` to Azure Functions.
- Do not deploy `auth-service`, `Cart-Service`, `Order-service`,
  `Product-service`, `User-profile-service`, or `Notification-Service`
  independently.
- The original service folders are retained only as migration reference.
- The product seed script is included at `src/scripts/seedProducts.js` and runs
  through `npm run seed:products`.

## Data behavior

- Existing Mongoose collection names remain compatible:
  `products`, `carts`, `orders`, `profiles`, and `notificationlogs`.
- Entra object ID is the stable `userId`.
- Entra user email is copied to orders and profiles where needed.
- Stock is reserved directly in the monolith before an order is created.
- A failed stock reservation restores stock already reserved by that request.
- Notification queue failure does not roll back a successfully created order;
  the API reports `notificationQueued: false` and logs the failure.

## Future implementation guidance

- Preserve same-origin browser calls.
- Prefer a new module inside `src/` over a new service.
- Add a new Service Bus message only when it is a notification command.
- Keep credentials out of source control.
- Update both `steps_to_do.md` and this file when architecture or deployment
  requirements change.
- Validate the monolithic backend syntax, React build, and Function syntax before
  claiming a change is complete.
