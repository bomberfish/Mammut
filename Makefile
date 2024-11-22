dist:
	mkdir -p dist
	cp -r src/* dist/
	npm install -g terser
	npm install -g csso-cli
	npm install -g html-minifier
	# Minify every js file
	find . -name "*.js" -exec terser --compress --mangle --output {} {} \;
	# Minify every css file
	find . -name "*.css" -exec csso {} -o {} \;
	# Minify every html file
	find . -name "*.html" -exec html-minifier --collapse-whitespace --remove-comments --output {} {} \;

clean:
	rm -rf dist

dev:
	cd src; npx static-server -p 6969 -n 404.html -f

dist_test: dist
	cd dist; npx static-server -p 6969 -n 404.html -f
