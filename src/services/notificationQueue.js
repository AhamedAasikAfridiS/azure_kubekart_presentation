const { ServiceBusClient } = require('@azure/service-bus');
const { DefaultAzureCredential } = require('@azure/identity');

let client;
let sender;

const getSender = () => {
  if (sender) return sender;

  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING;
  const namespace = process.env.SERVICE_BUS_NAMESPACE;
  const queueName = process.env.SERVICE_BUS_NOTIFICATION_QUEUE || 'notifications';

  if (connectionString) {
    client = new ServiceBusClient(connectionString);
  } else if (namespace) {
    const credential = new DefaultAzureCredential();
    client = new ServiceBusClient(namespace, credential);
  } else {
    throw new Error(
      'Set SERVICE_BUS_NAMESPACE or SERVICE_BUS_CONNECTION_STRING'
    );
  }

  sender = client.createSender(queueName);
  return sender;
};

const sendNotificationMessage = async ({
  messageId,
  to,
  type,
  subject,
  payload = {},
}) => {
  if (!to || !type || !subject) {
    throw new Error('Notification message requires to, type, and subject');
  }

  const queueSender = getSender();
  await queueSender.sendMessages({
    body: { messageId, to, type, subject, payload },
    messageId,
    subject: type,
    contentType: 'application/json',
    applicationProperties: { notificationType: type },
  });
};

const closeServiceBus = async () => {
  if (sender) await sender.close();
  if (client) await client.close();
  sender = undefined;
  client = undefined;
};

module.exports = { sendNotificationMessage, closeServiceBus };
