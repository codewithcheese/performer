import { defineConfig } from 'vitest/config';
export default defineConfig({
	test: {
		globals: true,
		setupFiles: ['./test/setupTests.ts']
	},
	resolve: {
		alias: {
			'@performer/core/jsx-dev-runtime': './src/jsx'
		}
	}
});
