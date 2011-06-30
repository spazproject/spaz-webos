#!/usr/bin/env php
<?php
# this uses the node.js json lib below to prettify output.
# install with `npm install json`

$SRC_ROOT = dirname(dirname(__FILE__));

$cmd = 'find '.$SRC_ROOT.' -name "*.js" -exec egrep -ho "\\\\\\$L\\([\'\"][^\'\"]+[\'\"]\\)" "{}" +';

$foo = shell_exec($cmd);

$lines = explode("\n", $foo);

$strings = array();
foreach($lines as $line) {
	$string = trim(preg_replace("|\\\$L\\(['\"](.+)['\"]\\)|", "$1", $line), "'\"");
	if ($string) {
		$strings[$string] = $string;
	}
}


@mkdir("$SRC_ROOT/resources/en_us", 0755, true);

$json = json_encode($strings);

file_put_contents('/tmp/strings.json', $json);

$cmd = "cat /tmp/strings.json | json > $SRC_ROOT/resources/en_us/strings.json";

shell_exec($cmd);
