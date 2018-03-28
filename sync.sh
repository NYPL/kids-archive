aws s3 sync . s3://production-kids-archive.nypl.org --profile nypl-digital-dev --exclude ".git/*" --exclude ".idea/*" --exclude ".DS_Store" --exclude "sync.sh" --exclude ".gitignore"
