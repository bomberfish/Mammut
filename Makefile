dist:
	mkdir -p dist
	cp -r src/* dist/
	npm install -g terser
	npm install -g csso-cli
	npm install -g html-minifier
	# Minify every js file
	find ./dist/ -name "*.js" -exec terser --compress --mangle --ecma 5 --output {} {} \;
	# Minify every css file
	find ./dist/ -name "*.css" -exec csso {} -o {} \;
	# Minify every html file
	find ./dist/ -name "*.html" -exec html-minifier --collapse-whitespace --output {} {} \;

clean:
	rm -rf dist

dev:
	cd src; npx static-server -p 6969 -n 404.html -f

dist_test: dist
	cd dist; npx static-server -p 6969 -n 404.html -f
