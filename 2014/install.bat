cd /cygdrive/c/apache-tomcat-7.0.35/webapps/
/cygdrive/c/s3cmd/s3cmd sync --exclude "*jade_gold*" --exclude ".s3*" --exclude "*.svn*" --exclude "*.idea*" --exclude ".DS_Store" atirudram.us/ s3://atirudram.us
