# KubeCart High-Level Application Architecture

```mermaid
flowchart LR
    User["Customer / Admin"]
    Entra["Microsoft Entra ID<br/>Authentication & IAM"]

    subgraph AppService["Azure App Service"]
        Frontend["React Frontend"]
        Backend["Node.js / Express Backend<br/>HTTP REST API"]
        Frontend -->|"HTTPS REST API<br/>JSON /api/*"| Backend
    end

    KeyVault["Azure Key Vault<br/>Secrets"]
    Blob["Azure Blob Storage<br/>Images & Files"]
    Database[("Azure Cosmos DB<br/>API for MongoDB")]
    Queue[["Azure Service Bus<br/>Notification Queue"]]
    Function["Azure Function<br/>Notification Processor"]
    Email["Email Service"]

    User -->|"HTTPS"| Frontend
    User -->|"Sign in"| Entra
    Entra -->|"Authenticated identity"| Backend
    Backend -->|"Read secrets"| KeyVault
    Backend -->|"Store / retrieve files"| Blob
    Backend -->|"Application data"| Database
    Backend -->|"Publish notification"| Queue
    Queue -->|"Queue trigger"| Function
    Function -->|"Notification logs"| Database
    Function -->|"Send email"| Email

    classDef user fill:#E0F2FE,stroke:#0284C7,color:#0F172A;
    classDef app fill:#ECFDF5,stroke:#10B981,color:#0F172A;
    classDef identity fill:#F5F3FF,stroke:#7C3AED,color:#0F172A;
    classDef data fill:#FFF7ED,stroke:#F59E0B,color:#0F172A;
    classDef async fill:#FEF2F2,stroke:#EF4444,color:#0F172A;

    class User user;
    class Frontend,Backend app;
    class Entra,KeyVault identity;
    class Blob,Database data;
    class Queue,Function,Email async;
```

## Request Flow

1. The user signs in through Microsoft Entra ID.
2. The React frontend communicates with the Node.js/Express backend using
   HTTPS REST API requests and JSON responses.
3. The backend stores application data in Cosmos DB using the MongoDB API and
   uses Blob Storage for images and files.
4. Order notifications are published to Service Bus and processed
   asynchronously by an Azure Function.
