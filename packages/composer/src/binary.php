<?php

declare(strict_types=1);

/*
 * Finds, downloads and checks the standalone bootcn executable for this
 * computer. The executable is the same CLI as `npx bootcn`, compiled so it
 * needs no Node.js; it comes from the GitHub release of the same version and
 * is checked against that release's SHA256SUMS before it is used.
 */

namespace Bootcn\Composer;

const REPOSITORY = 'bootcndev/bootcn';

/** The release asset for this system, such as "bootcn-linux-x64". */
function asset(?string $family = null, ?string $machine = null): string
{
    $family ??= PHP_OS_FAMILY;
    $machine = strtolower($machine ?? php_uname('m'));

    $os = match ($family) {
        'Linux' => 'linux',
        'Darwin' => 'darwin',
        'Windows' => 'windows',
        default => throw new \RuntimeException("bootcn has no executable for {$family}."),
    };
    $arch = match (true) {
        in_array($machine, ['x86_64', 'amd64', 'x64'], true) => 'x64',
        in_array($machine, ['arm64', 'aarch64'], true) => 'arm64',
        default => throw new \RuntimeException("bootcn has no executable for the {$machine} processor."),
    };
    if ($os === 'windows' && $arch !== 'x64') {
        throw new \RuntimeException('bootcn has a Windows executable for x64 only.');
    }

    return "bootcn-{$os}-{$arch}" . ($os === 'windows' ? '.exe' : '');
}

function version(string $packageDir): string
{
    $version = trim((string) @file_get_contents($packageDir . '/VERSION'));
    if ($version === '') {
        throw new \RuntimeException('The bootcn package has no VERSION file.');
    }

    return $version;
}

function download(string $url): string
{
    $context = stream_context_create([
        'http' => [
            'header' => "User-Agent: bootcn-composer\r\n",
            'follow_location' => 1,
            'timeout' => 60,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
        throw new \RuntimeException("Could not download {$url}");
    }

    return $body;
}

/**
 * The path of a checked executable, downloading it the first time.
 * BOOTCN_BINARY uses one you already have; BOOTCN_BASE_URL is for tests.
 */
function executable(string $packageDir): string
{
    $own = getenv('BOOTCN_BINARY');
    if (is_string($own) && $own !== '') {
        return $own;
    }

    $version = version($packageDir);
    $asset = asset();
    $dir = $packageDir . '/.bin/' . $version;
    $path = $dir . '/' . $asset;
    if (is_file($path)) {
        return $path;
    }

    $base = getenv('BOOTCN_BASE_URL') ?: 'https://github.com/' . REPOSITORY . '/releases/download';
    $release = rtrim($base, '/') . '/cli-v' . $version;

    fwrite(STDERR, "Downloading bootcn {$version} ({$asset})...\n");
    $sums = download($release . '/SHA256SUMS');
    $expected = null;
    foreach (preg_split('/\R/', $sums) ?: [] as $line) {
        if (preg_match('/^([0-9a-f]{64})\s+\*?' . preg_quote($asset, '/') . '$/', trim($line), $m)) {
            $expected = $m[1];
        }
    }
    if ($expected === null) {
        throw new \RuntimeException("{$asset} is not listed in the release's SHA256SUMS.");
    }

    $binary = download($release . '/' . $asset);
    if (!hash_equals($expected, hash('sha256', $binary))) {
        throw new \RuntimeException("The download of {$asset} does not match its checksum; nothing was saved.");
    }

    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new \RuntimeException("Could not create {$dir}");
    }
    $temporary = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($temporary, $binary);
    chmod($temporary, 0755);
    rename($temporary, $path);

    return $path;
}

/** Runs the executable with these arguments, sharing the terminal. */
function run(string $executable, array $arguments): int
{
    $process = proc_open(array_merge([$executable], $arguments), [STDIN, STDOUT, STDERR], $pipes);
    if (!is_resource($process)) {
        throw new \RuntimeException("Could not start {$executable}");
    }

    return proc_close($process);
}
