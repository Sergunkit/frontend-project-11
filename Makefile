
install:
	npm ci

develop:
	npx webpack serve

.PHONY:
	test

lint:
	npx eslint .

lint-fix:
	npx eslint --fix

test:
	NODE_OPTIONS=--experimental-vm-modules npx jest

build:
	rm -rf dist
	NODE_ENV=production npx webpack
