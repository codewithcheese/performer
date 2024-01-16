// Use to test hydration on a session, hydration seems brittle so should test often

// export function testHydration(session: RunSession) {
// 	if (!session.node) {
// 		throw Error('Session node not set');
// 	}
// 	const serialized = serialize(session.node);
// 	JSON.stringify(serialized);
// 	const hydrated = hydrate(session, serialized);
// 	expect(objectValueEquality(hydrated, session.node)).toEqual(true);
// }
