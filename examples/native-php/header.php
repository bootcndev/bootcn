<?php

declare(strict_types=1);

/** @var string $pageTitle */
$pageTitle = $pageTitle ?? 'Bootcn native PHP example';
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><?= htmlspecialchars($pageTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.min.css" integrity="sha384-yEPZ7jP9S0QKiUQ0m3jjsO4ProIW7wvR9gXkI7JOGa2XVsw53Yke2bsdkBbjmmiX" crossorigin="anonymous" />
    <!-- Installed by: bootcn init && bootcn add button dialog -->
    <link rel="stylesheet" href="assets/css/tokens.css" />
    <link rel="stylesheet" href="assets/css/button.css" />
    <link rel="stylesheet" href="assets/css/dialog.css" />
  </head>
  <body>
