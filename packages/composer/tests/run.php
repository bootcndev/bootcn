<?php

declare(strict_types=1);

/*
 * Tests for the Composer package: php packages/composer/tests/run.php
 * Runs the real bin/bootcn against a local copy of a release served by PHP's
 * built-in server, with a stand-in executable.
 */

require __DIR__ . '/../src/binary.php';

use function Bootcn\Composer\asset;

$failures = 0;
function check(string $name, bool $ok, string $detail = ''): void
{
    global $failures;
    echo ($ok ? 'ok   ' : 'FAIL ') . $name . ($ok || $detail === '' ? '' : " ({$detail})") . "\n";
    if (!$ok) {
        $failures++;
    }
}

// Which file each system gets.
check('linux x64', asset('Linux', 'x86_64') === 'bootcn-linux-x64');
check('linux arm64', asset('Linux', 'aarch64') === 'bootcn-linux-arm64');
check('mac apple silicon', asset('Darwin', 'arm64') === 'bootcn-darwin-arm64');
check('mac intel', asset('Darwin', 'x86_64') === 'bootcn-darwin-x64');
check('windows', asset('Windows', 'AMD64') === 'bootcn-windows-x64.exe');
try {
    asset('BSD', 'x86_64');
    check('unsupported system is refused', false);
} catch (RuntimeException $e) {
    check('unsupported system is refused', str_contains($e->getMessage(), 'BSD'));
}

if (PHP_OS_FAMILY === 'Windows') {
    echo "Skipping the end-to-end test on Windows.\n";
    exit($failures ? 1 : 0);
}

// A copy of the package and a fake release.
$root = sys_get_temp_dir() . '/bootcn-composer-' . bin2hex(random_bytes(4));
$package = $root . '/package';
$release = $root . '/srv/cli-v9.9.9';
mkdir($package . '/bin', 0777, true);
mkdir($package . '/src', 0777, true);
mkdir($release, 0777, true);
copy(__DIR__ . '/../bin/bootcn', $package . '/bin/bootcn');
copy(__DIR__ . '/../src/binary.php', $package . '/src/binary.php');
file_put_contents($package . '/VERSION', "9.9.9\n");
$name = asset();
file_put_contents($release . '/' . $name, "#!/bin/sh\necho \"fake bootcn \$*\"\nexit 3\n");
file_put_contents($release . '/SHA256SUMS', hash_file('sha256', $release . '/' . $name) . "  {$name}\n");

$port = 18765;
$server = proc_open([PHP_BINARY, '-S', "127.0.0.1:{$port}", '-t', $root . '/srv'], [['pipe', 'r'], ['file', '/dev/null', 'w'], ['file', '/dev/null', 'w']], $pipes);
for ($i = 0; $i < 50 && @file_get_contents("http://127.0.0.1:{$port}/cli-v9.9.9/SHA256SUMS") === false; $i++) {
    usleep(100000);
}

function bootcn(string $package, array $args, array $env = []): array
{
    $command = array_merge([PHP_BINARY, $package . '/bin/bootcn'], $args);
    $environment = array_merge(getenv(), $env);
    $process = proc_open($command, [['pipe', 'r'], ['pipe', 'w'], ['pipe', 'w']], $pipes, null, $environment);
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    return [proc_close($process), trim($out), trim($err)];
}

$env = ['BOOTCN_BASE_URL' => "http://127.0.0.1:{$port}"];
[$code, $out, $err] = bootcn($package, ['add', 'dialog'], $env);
check('downloads, checks and runs it', $out === 'fake bootcn add dialog', $out . ' / ' . $err);
check('passes the exit code through', $code === 3, (string) $code);
check('keeps it for next time', is_file("{$package}/.bin/9.9.9/{$name}"));

// The second run does not download again (the server is gone).
proc_terminate($server);
proc_close($server);
[$code, $out] = bootcn($package, ['list'], $env);
check('uses the cached copy', $out === 'fake bootcn list', $out);

// A changed download is refused and nothing is saved.
$other = $root . '/package2';
mkdir($other . '/bin', 0777, true);
mkdir($other . '/src', 0777, true);
copy($package . '/bin/bootcn', $other . '/bin/bootcn');
copy($package . '/src/binary.php', $other . '/src/binary.php');
file_put_contents($other . '/VERSION', "9.9.9\n");
file_put_contents($release . '/' . $name, "tampered\n", FILE_APPEND);
$server = proc_open([PHP_BINARY, '-S', "127.0.0.1:{$port}", '-t', $root . '/srv'], [['pipe', 'r'], ['file', '/dev/null', 'w'], ['file', '/dev/null', 'w']], $pipes);
for ($i = 0; $i < 50 && @file_get_contents("http://127.0.0.1:{$port}/cli-v9.9.9/SHA256SUMS") === false; $i++) {
    usleep(100000);
}
[$code, $out, $err] = bootcn($other, ['init'], $env);
check('refuses a changed download', $code === 1 && str_contains($err, 'does not match its checksum'), $err);
check('saves nothing then', !is_dir("{$other}/.bin/9.9.9") || !is_file("{$other}/.bin/9.9.9/{$name}"));

// BOOTCN_BINARY uses an executable you already have.
[$code, $out] = bootcn($other, ['--version'], ['BOOTCN_BINARY' => $package . "/.bin/9.9.9/{$name}"]);
check('BOOTCN_BINARY is used as is', $out === 'fake bootcn --version', $out);

proc_terminate($server);
proc_close($server);
exec('rm -rf ' . escapeshellarg($root));

echo $failures ? "{$failures} failed\n" : "All passed\n";
exit($failures ? 1 : 0);
