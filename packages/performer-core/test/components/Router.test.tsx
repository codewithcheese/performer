import { expect, test, assert } from 'vitest';
import {
	Goto,
	readTextContent,
	resolveMessages,
	Router,
	Routes,
	RunSession,
	useRouteData
} from '../../src/index.js';

test('should load root route by default and then goto /second', async () => {
	function First() {
		return () => (
			<>
				<system>Greet the user</system>
				<Goto path="/second" data="Hello World" />
			</>
		);
	}
	function Second() {
		const data = useRouteData<string>();
		return () => <system>{data.value}</system>;
	}
	const routes: Routes = [
		{ path: '/', component: <First /> },
		{ path: '/second', component: <Second /> }
	];
	const app = <Router routes={routes} />;
	const session = new RunSession({ element: app });
	session.start();
	await session.waitUntilSettled();
	assert(session.node?.type instanceof Function);
	expect(session.node?.type.name).toEqual('Router');
	assert(session.node?.child?.type instanceof Function);
	expect(session.node?.child?.type.name).toEqual('Second');
	const messages = resolveMessages(session.node!);
	expect(readTextContent(messages[0])).toEqual('Hello World');
});

test('should append');

test('should decide');
