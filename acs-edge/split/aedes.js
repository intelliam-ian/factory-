/* Test for aedes broker */

import net from "net";

import aedes from "aedes";

const broker = aedes.createBroker();
const publish = new Map();
const subscribe = new Map();

const prefix = "fpEdge1";
broker.authenticate = (client, username, password, callback) => {
    const { id } = client;
    console.log("AUTH: %s, %s, %s", id, username, password);
    if (id != username)
        return callback(null, false);

    const dt = "[a-zA-Z0-9_]+";
    publish.set(id, new RegExp(
        `^${prefix}/${id}/(?:status|data/${dt}|err/${dt})$`));
    subscribe.set(id, new RegExp(
        `^${prefix}/${id}/(?:conf|addr|cmd/${dt}|poll)$`));

    callback(null, true);
};
broker.authorizePublish = (client, packet, callback) => {
    const { id } = client;
    const { topic } = packet;

    console.log("PUBLISH: %s %s", id, topic);
    if (packet.retain)
        return callback(new Error("Retained PUBLISH forbidden"));
    if (!publish.get(id).test(topic))
        return callback(new Error("Unauthorised PUBLISH"));
    callback(null);
};
broker.authorizeSubscribe = (client, subscription, callback) => {
    const { id } = client;
    const { topic } = subscription;

    console.log("SUBSCRIBE: %s %s", id, topic);
    if (!subscribe.get(id).test(topic))
        return callback(new Error("Unauthorised SUBSCRIBE"));
    callback(null, subscription);
};

broker.subscribe(`${prefix}/#`, (packet, callback) => {
    callback(packet);
    const { topic, payload } = packet;
    console.log("PACKET: %s %o", topic, payload);
});

const srv = net.createServer(broker.handle);
srv.on("listening", () => console.log("LISTEN: %o", srv.address()));
srv.listen(1883);
