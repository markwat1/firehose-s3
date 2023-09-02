#! /bin/bash
amazon-linux-extras install nginx1 -y
systemctl enable nginx
amazon-linux-extras install php7.4 -y
systemctl enable php-fpm
cp -p /etc/php-fpm.d/www.conf /etc/php-fpm.d/www.conf.org
sed -i -e 's/user = apache/user = nginx/' /etc/php-fpm.d/www.conf
sed -i -e 's/group = apache/group = nginx/' /etc/php-fpm.d/www.conf
sed -i -e 's/\\/usr\\/share\\/nginx\\/html/\\/var\\/www\\/html/g' /etc/nginx/nginx.conf
mkdir -p /var/www/html
cp -r /usr/share/nginx/html/* /var/www/html/
chown nginx. -R /var/www/html
systemctl start nginx
systemctl start php-fpm
if $(uname -p)x eq X86_64 ; then
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
else
yum install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_arm64/amazon-ssm-agent.rpm
fi
systemctl restart amazon-ssm-agent
echo "<?php" > /var/www/wp-config.php
echo "define( 'DB_NAME', '__DB_NAME__' );" >> /var/www/wp-config.php
echo "define( 'DB_USER', '__DB_USER__' );" >> /var/www/wp-config.php
echo "define( 'DB_PASSWORD', '__DB_PASSWORD__' );" >> /var/www/wp-config.php
echo "define( 'DB_HOST', '__DB_HOST__' );" >> /var/www/wp-config.php
echo "define( 'DB_CHARSET', 'utf8' );" >> /var/www/wp-config.php
echo "define( 'DB_COLLATE', '' );" >> /var/www/wp-config.php
echo "define( 'AUTH_KEY',         '__AUTH_KEY__' );" >> /var/www/wp-config.php
echo "define( 'SECURE_AUTH_KEY',  '__SECURE_AUTH_KEY__' );" >> /var/www/wp-config.php
echo "define( 'LOGGED_IN_KEY',    '__LOGGED_IN_KEY__' );" >> /var/www/wp-config.php
echo "define( 'NONCE_KEY',        '__NONCE_KEY__' );" >> /var/www/wp-config.php
echo "define( 'AUTH_SALT',        '__AUTH_SALT__' );" >> /var/www/wp-config.php
echo "define( 'SECURE_AUTH_SALT', '__SECURE_AUTH_SALT__' );" >> /var/www/wp-config.php
echo "define( 'LOGGED_IN_SALT',   '__LOGGED_IN_SALT__' );" >> /var/www/wp-config.php
echo "define( 'NONCE_SALT',       '__NONCE_SALT__' );" >> /var/www/wp-config.php
echo "\$table_prefix = 'wp_';" >> /var/www/wp-config.php
echo "define( 'WP_DEBUG', false );" >> /var/www/wp-config.php
echo "if ( ! defined( 'ABSPATH' ) ) {" >> /var/www/wp-config.php
echo "	define( 'ABSPATH', __DIR__ . '/' );" >> /var/www/wp-config.php
echo "}" >> /var/www/wp-config.php
echo "require_once ABSPATH . 'wp-settings.php';" >> /var/www/wp-config.php
echo -n "__DB_PASSWORD_TXT__" > /var/www/dbpassword.txt
