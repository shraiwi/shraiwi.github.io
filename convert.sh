
export DIR=md
export FILES=$(ls -1 "$DIR" | sed -e 's/\.md$//')

while IFS= read -r NAME; do
	echo "$NAME.md -> $NAME.html"
	pandoc -s --template "template.html" -o "$NAME.html" "$DIR/$NAME.md"
done <<< "$FILES"