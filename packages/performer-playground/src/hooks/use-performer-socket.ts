// import { useEffect, useState } from "react";
// import {
//   CoreEvent,
//   isAssistantMessage,
//   isCoreEvent,
//   isMessageEvent,
//   isTextContent,
// } from "@performer/core";
//
// export function usePerformerSocket(url: string, name: string) {
//   const [sessionId] = useState(crypto.randomUUID());
//   const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
//   const [events, setEvents] = useState<CoreEvent[]>([]);
//   const [loading, setLoading] = useState<boolean>(false);
//
//   useEffect(() => {
//     const fullUrl = new URL(url);
//     fullUrl.searchParams.append("name", name);
//     const ws = new WebSocket(fullUrl);
//     setWebSocket(ws);
//     ws.onopen = () => {
//       setLoading(false);
//     };
//     ws.onmessage = (raw) => {
//       console.log("ws onmessage", raw);
//       const event = JSON.parse(raw.data);
//       if (!isCoreEvent(event)) {
//         return console.error("Unexpected event object");
//       }
//       if (isMessageEvent(event)) {
//         setEvents((prevEvents) => {
//           const prevEvent = prevEvents.findLast(isMessageEvent);
//           if (
//             prevEvent &&
//             event.op === "update" &&
//             prevEvent.sid === event.sid
//           ) {
//             // update content of previous message
//             for (const [index, content] of event.payload.content.entries()) {
//               if (index === 0 && isTextContent(content)) {
//                 const prevTextContent =
//                   prevEvent.payload.content.findLast(isTextContent);
//                 if (prevTextContent) {
//                   prevTextContent.text += content.text;
//                   continue;
//                 }
//               }
//               prevEvent.payload.content.push(content);
//             }
//             return prevEvents.toSpliced(prevEvents.length - 1, 1, prevEvent);
//           } else if (
//             prevEvents.length &&
//             event.op === "close" &&
//             prevEvent &&
//             prevEvent.sid === event.sid
//           ) {
//             // skip "close" event when updates aggreated
//             return prevEvents;
//           } else {
//             return [...prevEvents, event];
//           }
//         });
//       } else {
//         setEvents((prevEvents) => [...prevEvents, event]);
//       }
//     };
//     ws.onerror = (event) => {
//       console.error("WebSocket error:", event);
//     };
//     ws.onclose = (event) => {
//       setEvents((prevEvents) => [
//         ...prevEvents,
//         {
//           type: "LIFECYCLE",
//           op: "once",
//           sid: crypto.randomUUID(),
//           payload: { state: "disconnected" as any },
//         },
//       ]);
//       console.log("WebSocket connection closed:", event);
//     };
//     return () => {
//       ws.close();
//     };
//   }, []);
//
//   function sendMessage(message: string) {
//     if (!webSocket) {
//       return console.error("Cannot send message, no websocket.");
//     }
//     webSocket.send(
//       JSON.stringify({
//         sid: crypto.randomUUID(),
//         type: "MESSAGE",
//         op: "once",
//         payload: {
//           role: "user",
//           content: [{ type: "text", text: message }],
//         },
//       } satisfies CoreEvent),
//     );
//   }
//
//   return { sessionId, loading, events, sendMessage };
// }
//
// if (import.meta.hot) {
//   import.meta.hot.accept((newModule) => {
//     // Handle the updated module
//     console.log("Module updated!", newModule);
//   });
//   import.meta.hot.dispose(() => {
//     // Cleanup or state saving logic
//     console.log("Module will be replaced soon.");
//   });
// }
