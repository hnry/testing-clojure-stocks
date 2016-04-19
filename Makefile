COLOR = \033[1;33m
COLOR_RESET = \033[0m

default: build

build: build_js

build_js:
	@echo "building javascript"
	cat node_modules/react/dist/react.min.js node_modules/react-dom/dist/react-dom.min.js > resources/public/react.js
	node_modules/.bin/babel --no-comments --minified resources/src -o resources/public/app.js

watch:
	@echo "auto-building javascript"
	cat node_modules/react/dist/react.js node_modules/react-dom/dist/react-dom.js > resources/public/react.js
	node_modules/.bin/babel --no-comments --watch resources/src -o resources/public/app.js

test: test_js

test_js:
	@echo "\n$(COLOR)Running javascript tests...$(COLOR_RESET)"
	@node_modules/.bin/jasmine JASMINE_CONFIG_PATH=chrome/spec/support/extension.json
	@echo "\n"

.PHONY: default build test watch test_js build_js
