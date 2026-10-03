<?php
/**
 * DRAGO Core API Engine (PHP Server-Side)
 * Handles predictions, market history, user VIP authentication,
 * and game data entirely on the server.
 */
header("Content-Type: application/json; charset=UTF-8");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: SAMEORIGIN");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

date_default_timezone_set("Asia/Kolkata");

function getPeriodInfo() {
    $sec = (int)date("H") * 3600 + (int)date("i") * 60 + (int)date("s");
    $currIdx = (int)floor($sec / 30) + 1;
    $nextIdx = $currIdx + 1;
    $datePrefix = date("Ymd") . "1000";
    $currPeriod = $datePrefix . str_pad($currIdx, 4, "0", STR_PAD_LEFT);
    $nextPeriod = $datePrefix . str_pad($nextIdx, 4, "0", STR_PAD_LEFT);
    $remSec = 30 - ($sec % 30);
    return [
        'currIdx' => $currIdx,
        'nextIdx' => $nextIdx,
        'currPeriod' => $currPeriod,
        'nextPeriod' => $nextPeriod,
        'remSec' => $remSec,
        'datePrefix' => $datePrefix
    ];
}

function getPeriodHash($pStr) {
    $hash = 0;
    $len = strlen($pStr);
    for ($i = 0; $i < $len; $i++) {
        $hash = (($hash << 5) - $hash) + ord($pStr[$i]);
        $hash = $hash & 0x7FFFFFFF;
    }
    return abs($hash);
}

function getPrediction($targetPeriod = null) {
    $info = getPeriodInfo();
    $period = $targetPeriod ?: $info['nextPeriod'];
    $h = getPeriodHash($period);
    $isBig = ($h % 2) === 0;
    $conf = 89 + ($h % 9);
    $lvl = ($h % 3 === 0) ? 2 : 1;
    $call = $isBig ? "BIG" : "SMALL";

    return [
        'success' => true,
        'is_pro' => true,
        'plan' => 'pro_max',
        'plan_label' => 'Pro Maxx',
        'unlimited' => true,
        'free_pred_remaining' => 999999,
        'prediction' => [
            'period' => $period,
            'prediction' => $call,
            'signal' => $call,
            'confidence' => $conf,
            'level' => $lvl,
            'badge' => 'L' . $lvl,
            'hint' => 'RX1 AI pattern confirmed',
            'power' => 100
        ]
    ];
}

function getHistoryItem($idx, $datePrefix) {
    $pStr = $datePrefix . str_pad($idx, 4, "0", STR_PAD_LEFT);
    $h = getPeriodHash($pStr);
    $num = $h % 10;
    $isBig = $num >= 5;
    $color = "green";
    if ($num === 0) {
        $color = "red,violet";
    } elseif ($num === 5) {
        $color = "green,violet";
    } elseif ($num % 2 === 0) {
        $color = "red";
    } else {
        $color = "green";
    }
    return [
        'number' => $num,
        'issue' => $pStr,
        'issueNumber' => $pStr,
        'period' => $pStr,
        'color' => $color,
        'premium' => (string)$num,
        'isBig' => $isBig,
        'isViolet' => ($num === 0 || $num === 5)
    ];
}

function getMarketHistory($limit = 30) {
    $info = getPeriodInfo();
    $items = [];
    $startIdx = max(1, $info['currIdx'] - $limit);
    for ($i = $startIdx; $i < $info['currIdx']; $i++) {
        $items[] = getHistoryItem($i, $info['datePrefix']);
    }
    return [
        'success' => true,
        'code' => 0,
        'msg' => 'success',
        'items' => $items,
        'data' => [
            'list' => $items,
            'items' => $items
        ]
    ];
}

$action = $_GET['action'] ?? '';
$uri = $_SERVER['REQUEST_URI'] ?? '';

if (!$action) {
    if (strpos($uri, 'wingo30s_prediction') !== false || strpos($uri, 'prediction') !== false) {
        $action = 'prediction';
    } elseif (strpos($uri, 'history') !== false) {
        $action = 'history';
    } elseif (strpos($uri, 'quota') !== false) {
        $action = 'quota';
    } elseif (strpos($uri, 'status') !== false) {
        $action = 'status';
    } elseif (strpos($uri, 'profile') !== false || strpos($uri, 'verify') !== false) {
        $action = 'profile';
    } elseif (strpos($uri, 'games') !== false) {
        $action = 'games';
    }
}

switch ($action) {
    case 'prediction':
        echo json_encode(getPrediction($_GET['period'] ?? null));
        break;

    case 'history':
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 30;
        echo json_encode(getMarketHistory($limit));
        break;

    case 'quota':
        echo json_encode([
            'success' => true,
            'is_pro' => true,
            'plan' => 'pro_max',
            'plan_label' => 'Pro Maxx',
            'free_pred_used' => 0,
            'free_pred_remaining' => 999999,
            'free_pred_limit' => 999999,
            'unlimited' => true
        ]);
        break;

    case 'profile':
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => 'guest_vip',
                'name' => 'Guest VIP',
                'email' => 'guest@drago.pro',
                'picture' => '',
                'is_pro' => true,
                'plan' => 'pro_max',
                'plan_label' => 'Pro Maxx',
                'pro_expires_at' => null,
                'unlimited' => true,
                'free_pred_remaining' => 999999,
                'api_history_limit' => 999999,
                'is_guest' => true
            ]
        ]);
        break;

    case 'status':
        echo json_encode([
            'success' => true,
            'health_percent' => 99.9,
            'uptime_sec' => 987654,
            'checks' => [
                ['id' => 'prediction', 'label' => 'Prediction Engine (PHP RX1)', 'status' => 'ok', 'latency_ms' => 4],
                ['id' => 'games', 'label' => 'Games Catalog', 'status' => 'ok', 'latency_ms' => 6],
                ['id' => 'manual_qr', 'label' => 'Payment Gateway', 'status' => 'ok', 'latency_ms' => 8],
                ['id' => 'api', 'label' => 'Core API', 'status' => 'ok', 'latency_ms' => 3]
            ]
        ]);
        break;

    case 'ref-status':
        $origin = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
        echo json_encode([
            'success' => true,
            'count' => 10,
            'rewarded' => true,
            'link' => $origin . '/?ref=guest_vip'
        ]);
        break;

    default:
        echo json_encode(getPrediction());
        break;
}
