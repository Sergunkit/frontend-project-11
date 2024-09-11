
install:
	npm ci

develop:
	npx webpack serve

build:
	npm run build

lint:
	npx eslint .

lint-fix:
	npx eslint --fix
