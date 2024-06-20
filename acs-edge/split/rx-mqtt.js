/* Test script for development of in-EA MQTT broker */

import { Buffer } from "buffer";
import net from "net";

import imm from "immutable";
import mqp from "mqtt-packet";
import rx from "rxjs";

function rx_rx (src, ...pipe) {
    return rx.pipe(...pipe)(rx.from(src));
}

function fromErrorEvent (ev) {
    return rx_rx(
        rx.fromEvent(ev, "error"),
        rx.mergeMap(rx.throwError));
}

function fromSocket (sock) {
    return rx_rx(
        rx.fromEvent(sock, "data"),
        rx.mergeWith(fromErrorEvent(sock)),
        rx.takeUntil(rx.fromEvent(sock, "close")));
}

function mqttDecode () {
    const parser = mqp.parser();
    return rx.pipe(
        /* Parse MQTT packets and return bytes left to parse */
        rx.scan((prev, next) => {
            const buf = prev.length ? Buffer.concat([prev, next]) : next;
            const len = parser.parse(buf);
            /* This saves a copy at the expense of keeping the previous
             * packet around for one cycle longer than necessary. */
            return buf.subarray(buf.length - len);
        }, Buffer.alloc(0)),
        /* We don't care about the bytes-left buffers */
        rx.ignoreElements(),
        /* Pull the parsed packets directly from the parser event */
        rx.mergeWith(
            rx.fromEvent(parser, "packet"),
            fromErrorEvent(parser)));
}
                
function switchMerge (key, cases) {
    return rx.connect(items => rx.merge(
        ...Object.entries(cases)
            .map(([k, seq]) => items.pipe(
                rx.filter(i => key(i) == k),
                seq))));
}

class DisconnectError {
    constructor (packet) {
        this.packet = packet;
    }

    static connack (reason) {
        return new DisconnectError({
            cmd:        "connack",
            reasonCode: 
    

class ConnectState extends imm.Record({
    clients: [],
}) {
    handle (packet) {
        if (packet.cmd != "connect")
            throw new DisconnectError({
                packet

        if (

        return new ClientState({ id: p.clientId })


class ClientState extends imm.Record({
    id:     null,
    subs:   imm.Set(),
}) {
    static known = new Set([
        "connect", "pingreq", "subscribe", "publish"
    ]);

    get prefix () { return `fpEdge1/${this.id}/`; }

    handle (packet) {
        const { cmd } = packet;
        if (!this.constructor.known.has(cmd))
            throw "Protocol error";

        return this[cmd](packet);
    }

    connect (p) {
        console.log("CONNECT: %s, %s", p.clientId, p.username);
        if (this.id)
            throw "Multiple CONNECTs";
        return [
            this.set("id", p.clientId),
            { cmd: "connack", returnCode: 0 },
        ];
    }

    pingreq (p) {
        return [
            this,
            { cmd: "pingresp" },
        ];
    }

    subscribe (p) {
        console.log("SUBSCRIBE: %o", p.subscriptions);
        const results = p.subscriptions
            .map(s => [s.topic, s.topic.startsWith(this.prefix)]);
        return [
            this.set("subs", this.subs.add(
                results.filter(v => v[1]).map(v => v[0]))),
            {
                cmd:            "suback",
                messageId:      p.messageId,
                granted:        results.map(v => v[1] ? 0 : 128),
            }];
    }
}

const srv = new net.Server(cli => {
    console.log("ACCEPT: %s", cli.remoteAddress);

    const conn = rx_rx(
        fromSocket(cli),
        mqttDecode(),
        rx.tap(p => console.log("PACKET IN: %O", p)),
        rx.scan(([prev], packet) => {
            const out = prev.handle(packet);
            console.log("STATE: %O", out[0].toJS());
            return out;
        }, [new DriverState()]),
        rx.share();
    );



    conn.pipe(
        rx.mergeMap(v => v.slice(1)),
        rx.tap(p => console.log("PACKET OUT: %O", p)),
    ).subscribe({
        next:       p => mqp.writeToStream(p, cli),
        error:      e => console.log("ERROR: %O", e),
        complete:   () => console.log("COMPLETE"),
    });
});
srv.on("listening", () => console.log("LISTEN: %O", srv.address()));
srv.listen(1883);
