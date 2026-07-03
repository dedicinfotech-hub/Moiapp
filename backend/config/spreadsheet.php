<?php
/**
 * Lightweight CSV / XLSX row parser (no external dependencies).
 */

function parseSpreadsheetRows(string $filePath, string $ext): array
{
    $ext = strtolower($ext);
    if ($ext === 'csv') {
        return parseCsvRows($filePath);
    }
    if (in_array($ext, ['xlsx', 'xls'], true)) {
        return parseXlsxRows($filePath);
    }
    return [];
}

function parseCsvRows(string $filePath): array
{
    $rows = [];
    $handle = fopen($filePath, 'r');
    if (!$handle) {
        return [];
    }
    while (($row = fgetcsv($handle)) !== false) {
        $rows[] = $row;
    }
    fclose($handle);
    return $rows;
}

function parseXlsxRows(string $path): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('XLSX support requires ZipArchive on the server');
    }

    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        return [];
    }

    $shared = [];
    $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($sharedXml) {
        $ss = simplexml_load_string($sharedXml);
        if ($ss) {
            foreach ($ss->si as $si) {
                if (isset($si->t)) {
                    $shared[] = (string) $si->t;
                } elseif (isset($si->r)) {
                    $parts = [];
                    foreach ($si->r as $run) {
                        $parts[] = (string) $run->t;
                    }
                    $shared[] = implode('', $parts);
                } else {
                    $shared[] = '';
                }
            }
        }
    }

    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$sheetXml) {
        return [];
    }

    $sheet = simplexml_load_string($sheetXml);
    if (!$sheet || !isset($sheet->sheetData->row)) {
        return [];
    }

    $rows = [];
    foreach ($sheet->sheetData->row as $row) {
        $rowData = [];
        foreach ($row->c as $cell) {
            $value = (string) $cell->v;
            if (isset($cell['t']) && (string) $cell['t'] === 's') {
                $value = $shared[(int) $value] ?? $value;
            }
            $rowData[] = $value;
        }
        $rows[] = $rowData;
    }

    return $rows;
}
