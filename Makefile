REPORTER	= spec
REPORTER_WATCH	= spec

test:
	@NODE_ENV=test ./node_modules/.bin/mocha	\
		--reporter $(REPORTER)			\

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha	\
		--reporter $(REPORTER_WATCH)		\
		--growl					\
		--watch

run:
	@nodemon --abort-on-uncaught-exception app.js

.PHONY: test test-w run
