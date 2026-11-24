<?php

declare(strict_types=1);

$pageTitle = 'Bootcn native PHP example';
require __DIR__ . '/header.php';
?>
    <main class="container py-5">
      <h1 class="h3 mb-3">Bootcn in native PHP</h1>
      <p class="text-body-secondary">
        Components installed with the CLI are plain HTML snippets, included here with PHP.
      </p>

      <h2 class="h5 mt-4">Button</h2>
      <?php include __DIR__ . '/components/ui/button.html'; ?>

      <h2 class="h5 mt-5">Dialog</h2>
      <?php include __DIR__ . '/components/ui/dialog.html'; ?>

      <p class="mt-3 mb-0" id="confirm-status" role="status"></p>
    </main>

    <script>
      document.addEventListener('bootcn:dialog:confirm', function () {
        document.getElementById('confirm-status').textContent = 'Confirmed.';
      });
    </script>
<?php require __DIR__ . '/footer.php'; ?>
