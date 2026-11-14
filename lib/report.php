<?php
declare(strict_types=1);

/**
 * One-time transactional report delivery. No contacts, report bodies, lead or
 * marketing records are stored. Anti-abuse and idempotency keys are HMAC-only,
 * using the existing rate_limits table and its 48h housekeeping.
 */
function wg_report_enabled(array $config): bool {
    return ($config['report_mail_enabled'] ?? false) === true
        && wg_mail_ready($config)['configured'] === true;
}

function wg_report_number(array $data, string $field, float $min, float $max): float {
    $value = $data[$field] ?? null;
    if ((!is_int($value) && !is_float($value)) || !is_finite((float)$value)
        || $value < $min || $value > $max) {
        wg_fail(422, 'VALIDATION', 'Controleer de berekening van je energieplan.');
    }
    return (float)$value;
}

function wg_report_validate(array $data): array {
    $email = strtolower(wg_text($data['email'] ?? '', 'e-mailadres', 254, true));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || preg_match('/[<>\r\n]/', $email)) {
        wg_fail(422, 'VALIDATION', 'Vul één geldig e-mailadres in.');
    }
    $key = wg_text($data['idempotencyKey'] ?? '', 'verzendcode', 80, true);
    if (!preg_match('/^[A-Za-z0-9_-]{16,80}$/D', $key)) {
        wg_fail(422, 'VALIDATION', 'Vernieuw je energieplan en probeer opnieuw.');
    }
    if (($data['website'] ?? '') !== '') { wg_fail(422,'INVALID_REQUEST','Het rapport kan niet worden verstuurd.'); }
    $source = $data['report'] ?? null;
    if (!is_array($source) || array_is_list($source)) {
        wg_fail(422, 'VALIDATION', 'Controleer de gegevens van je energieplan.');
    }
    $year = $source['year'] ?? null;
    if (!is_int($year) || !in_array($year, [2026, 2027], true)) {
        wg_fail(422, 'VALIDATION', 'Kies een geldig rekenjaar.');
    }
    $types = ['apartment'=>'Appartement','terraced'=>'Rijwoning','corner'=>'Hoekwoning','semi'=>'Twee-onder-een-kap','detached'=>'Vrijstaande woning'];
    $home = $source['homeType'] ?? null;
    if (!is_string($home) || !isset($types[$home])) {
        wg_fail(422, 'VALIDATION', 'Controleer het woningtype.');
    }
    $measures = ['smart-use'=>'Slimmer energie gebruiken','solar'=>'Zonnepanelen','battery'=>'Thuisbatterij','insulation'=>'Isolatie','heatpump'=>'Hybride warmtepomp'];
    $ids = $source['selectedIds'] ?? null;
    if (!is_array($ids) || !array_is_list($ids) || count($ids)>5 || count($ids)!==count(array_unique($ids, SORT_REGULAR))) {
        wg_fail(422, 'VALIDATION', 'Controleer de geselecteerde maatregelen.');
    }
    foreach ($ids as $id) {
        if (!is_string($id) || !isset($measures[$id])) {
            wg_fail(422, 'VALIDATION', 'Controleer de geselecteerde maatregelen.');
        }
    }
    $report = ['year'=>$year, 'homeType'=>$types[$home], 'selectedIds'=>$ids,
        'modelVersion'=>wg_text($source['modelVersion'] ?? '', 'modelversie', 50, true)];
    if (!preg_match('/^[0-9A-Za-z._-]{1,50}$/D', $report['modelVersion'])) {
        wg_fail(422, 'VALIDATION', 'Controleer de modelversie.');
    }
    foreach (['savingsLow','savingsHigh'] as $name) $report[$name]=wg_report_number($source,$name,-100000,100000);
    foreach (['investmentLow','investmentHigh','budgetOverBy'] as $name) $report[$name]=wg_report_number($source,$name,0,250000);
    foreach (['baselineCost','plannedCost'] as $name) $report[$name]=wg_report_number($source,$name,-100000,250000);
    foreach (['electricityUse','gasUse'] as $name) $report[$name]=wg_report_number($source,$name,0,250000);
    if ($report['savingsLow'] > $report['savingsHigh'] || $report['investmentLow'] > $report['investmentHigh']) {
        wg_fail(422, 'VALIDATION', 'De bandbreedte van je plan klopt niet.');
    }
    $difference=$report['baselineCost'] - $report['plannedCost'];
    if ($difference < $report['savingsLow']-200 || $difference > $report['savingsHigh']+200) {
        wg_fail(422, 'VALIDATION', 'De kostenvergelijking en besparing komen niet overeen.');
    }
    // Costs come from a browser calculation; they are never verified meter data
    // or a server-issued quotation. Never accept free-form mail text or links.
    return ['email'=>$email,'key'=>$key,'report'=>$report,'measureLabels'=>$measures];
}

function wg_report_euro(float $value): string {
    return '€ '.number_format($value, 0, ',', '.');
}
function wg_report_range(float $low, float $high): string {
    return round($low) === round($high) ? wg_report_euro($low)
        : wg_report_euro($low).' – '.wg_report_euro($high);
}
function wg_report_escape(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function wg_report_content(array $prepared): array {
    $r=$prepared['report']; $labels=$prepared['measureLabels'];
    $chosen=array_map(static fn(string $id): string => $labels[$id], $r['selectedIds']);
    if (!$chosen) $chosen=['Nog geen nieuwe maatregelen gekozen'];
    $notes=[
        'De bedragen zijn indicaties op basis van ingevulde gegevens en een berekening in de browser. Ze zijn niet onafhankelijk door de server gecontroleerd.',
        'Jaarkosten en besparing gaan over variabele energiekosten, niet de volledige energierekening. Vaste kosten kunnen afwijken.',
        'Investeringen zijn indicatief, inclusief installatie en vóór eventuele subsidie. Dit is geen offerte of rendementsgarantie.',
        $r['year']===2027 ? 'Rekenjaar 2027: geen saldering van teruggeleverde zonnestroom.' : 'Rekenjaar 2026: saldering is in het model meegenomen.'
    ];
    if (!$r['selectedIds']) $notes[]='Er zijn nog geen verbeteringen gekozen; probeer maatregelen in het interactieve energiehuis.';
    if ($r['savingsHigh']<=0) $notes[]='Dit scenario levert mogelijk geen jaarlijkse kostenbesparing op.';
    if ($r['budgetOverBy']>0) $notes[]='De indicatieve investering ligt boven het gekozen budget.';
    $savings=wg_report_range($r['savingsLow'],$r['savingsHigh']);
    $invest=wg_report_range($r['investmentLow'],$r['investmentHigh']);
    $baseline=wg_report_euro($r['baselineCost']);
    $planned=wg_report_euro($r['plannedCost']);
    $url='https://wattgoedkoper.nl/#advies';
    $txt="Jouw energieplan van WattGoedkoper\n\n";
    $txt.="Woning: ".$r['homeType']." | Rekenjaar: ".$r['year']."\n";
    $txt.="Indicatieve jaarlijkse besparing: ".$savings."\n";
    $txt.="Indicatieve eenmalige investering: ".$invest." (vóór subsidie)\n\n";
    $txt.="Variabele jaarkosten: nu ".$baseline.", met plan ".$planned."\n";
    $txt.="Jaarlijks stroomverbruik: ".number_format($r['electricityUse'],0,',','.')." kWh; gas: ".number_format($r['gasUse'],0,',','.')." m³\n\n";
    $txt.="Gekozen maatregelen:\n- ".implode("\n- ",$chosen)."\n\n";
    $txt.="Belangrijk om te weten:\n- ".implode("\n- ",$notes)."\n\n";
    $txt.="Vrijblijvend advies van NIVO Groep Holland aanvragen? Dat kan alleen als je zelf een aparte aanvraag doet: ".$url."\n";
    $txt.="Een rapportmail geeft geen toestemming voor commerciële opvolging of marketing.\n";
    $txt.="\nWattGoedkoper.nl — Dit is een indicatie, geen offerte.\n";
    $chips=implode('',array_map(static fn(string $label): string =>
        '<span style="display:inline-block;border:1px solid #dae3d6;background:#f4f7ed;border-radius:99px;padding:9px 14px;margin:0 7px 8px 0;font-size:13px;color:#26484b;">'.wg_report_escape($label).'</span>',$chosen));
    $list=implode('',array_map(static fn(string $note): string =>
        '<li style="margin:0 0 9px;">'.wg_report_escape($note).'</li>',$notes));
    $html='<!doctype html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       .'<title>Jouw energieplan</title></head><body style="margin:0;background:#f8f7f1;color:#183d4b;font-family:Arial,Helvetica,sans-serif;">'
       .'<div style="max-width:650px;margin:0 auto;padding:27px 14px;">'
       .'<div style="padding:0 5px 20px;font-size:19px;font-weight:800;letter-spacing:-.5px;">Watt<span style="color:#ac8c13;">Goedkoper</span>.nl</div>'
       .'<div style="background:#fffefa;border:1px solid #e3e7dc;border-radius:19px;overflow:hidden;">'
       .'<div style="background:#153b4a;color:#fff;padding:29px 27px;"><div style="font-size:11px;letter-spacing:1.8px;color:#ffdd60;">JOUW PERSOONLIJKE ENERGIEPLAN</div>'
       .'<h1 style="margin:11px 0;font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.17;">Dit kan jouw huis veranderen.</h1>'
       .'<p style="margin:0;color:#c9dce0;font-size:13px;">'.wg_report_escape($r['homeType']).' · Rekenjaar '.$r['year'].'</p></div>'
       .'<div style="padding:26px 25px;">'
       .'<div style="background:#f3f6e8;border:1px solid #dfe7d2;padding:20px;border-radius:14px;">'
       .'<div style="font-size:11px;color:#557068;">INDICATIEVE BESPARING PER JAAR</div>'
       .'<div style="font-family:Georgia,serif;font-size:31px;padding:7px 0 4px;">'.wg_report_escape($savings).'</div>'
       .'<div style="font-size:12px;color:#536b6e;">Variabele energiekosten · geschatte bandbreedte</div></div>'
       .'<div style="padding:20px 0;font-size:14px;line-height:1.8;border-bottom:1px solid #e9ece4;">'
       .'<strong>Investering: '.wg_report_escape($invest).'</strong><br><span style="font-size:12px;color:#657873;">Eenmalig · vóór subsidie</span>'
       .'</div><h2 style="font-family:Georgia,serif;font-weight:400;font-size:22px;">Nu tegenover jouw plan</h2>'
       .'<table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;">'
       .'<tr><td style="padding:11px;background:#f4f5f0;">Nu, per jaar</td><td style="padding:11px;background:#f4f5f0;text-align:right;"><strong>'.wg_report_escape($baseline).'</strong></td></tr>'
       .'<tr><td style="padding:11px;background:#edf3db;">Met jouw plan</td><td style="padding:11px;background:#edf3db;text-align:right;"><strong>'.wg_report_escape($planned).'</strong></td></tr></table>'
       .'<h2 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin:26px 0 14px;">Jouw maatregelen</h2><div>'.$chips.'</div>'
       .'<h2 style="font-family:Georgia,serif;font-weight:400;font-size:22px;margin:27px 0 10px;">Goed om te weten</h2>'
       .'<ul style="padding-left:19px;font-size:12px;color:#5a7073;line-height:1.6;">'.$list.'</ul>'
       .'<div style="background:#143b4c;border-radius:14px;padding:24px;margin:25px 0 3px;color:#fff;">'
       .'<div style="font-family:Georgia,serif;font-size:22px;">Even samen naar je huis kijken?</div>'
       .'<p style="color:#cfdfdf;font-size:13px;line-height:1.6;">Vraag zelf vrijblijvend advies aan bij NIVO Groep Holland. Geen verplichting en geen automatische opvolging vanuit deze rapportmail.</p>'
       .'<a href="'.$url.'" style="display:inline-block;background:#ffda4a;border-radius:9px;padding:13px 18px;font-size:13px;font-weight:700;color:#173948;text-decoration:none;">Vraag vrijblijvend advies</a>'
       .'</div></div></div><p style="font-size:11px;color:#72827e;text-align:center;line-height:1.7;padding:16px 20px;">'
       .'Je ontvangt dit rapport omdat om verzending naar dit e-mailadres is gevraagd. Geen marketingabonnement. Indicatie, geen offerte. '
       .'<a style="color:#496b71;" href="https://wattgoedkoper.nl/privacy.html">Privacy</a>.</p></div></body></html>';
    return ['subject'=>'Jouw energieplan van WattGoedkoper', 'text'=>$txt, 'html'=>$html];
}

function wg_report_counter(PDO $db, array $config, string $scope, string $identifier, int $limit, int $seconds): void {
    $window=intdiv(time(),$seconds)*$seconds;
    $bucket=hash_hmac('sha256', $scope.'|'.$identifier.'|'.$window, $config['hmac_key']);
    $sql=wg_is_mysql($db)
      ? 'INSERT INTO rate_limits(bucket,window_start,hits) VALUES(?,?,1) ON DUPLICATE KEY UPDATE hits=hits+1'
      : 'INSERT INTO rate_limits(bucket,window_start,hits) VALUES(?,?,1) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1';
    $db->prepare($sql)->execute([$bucket,$window]);
    $q=$db->prepare('SELECT hits FROM rate_limits WHERE bucket=?');$q->execute([$bucket]);
    if ((int)$q->fetchColumn()>$limit) {
        header('Retry-After: '.($seconds-(time()-$window)));
        wg_fail(429,'RATE_LIMIT','Er zijn nu te veel rapportverzoeken. Probeer het later.');
    }
}

/**
 * Returns "send" for the winner, "replayed" only for an SMTP-accepted request.
 * Reserved/uncertain sends never retry automatically, preventing duplicate mail
 * after an SMTP timeout or concurrent click.
 */
function wg_report_reserve(PDO $db, array $config, array $prepared): array {
    $id=hash_hmac('sha256', 'report-id|'.$prepared['key'], $config['hmac_key']);
    $fingerprint=hash('sha256',json_encode([$prepared['email'],$prepared['report']],JSON_THROW_ON_ERROR));
    $body=hash_hmac('sha256','report-body|'.$prepared['key'].'|'.$fingerprint,$config['hmac_key']);
    $q=$db->prepare('SELECT hits FROM rate_limits WHERE bucket=?');$q->execute([$id]);$old=$q->fetchColumn();
    if ($old!==false) {
        $q->execute([$body]);
        if ($q->fetchColumn()===false) { wg_fail(409,'IDEMPOTENCY_CONFLICT','Dezelfde verzendcode hoort bij een ander rapport. Open het plan opnieuw.'); }
        if ((int)$old===2) return ['state'=>'replayed','id'=>$id];
        wg_fail(409,'REPORT_STATUS_UNCERTAIN','Dit rapportverzoek wordt al verwerkt of heeft een onzekere verzendstatus. Controleer eerst je inbox.');
    }
    wg_report_counter($db,$config,'report-hour',(string)($_SERVER['REMOTE_ADDR']??'unknown'),3,3600);
    wg_report_counter($db,$config,'report-day',(string)($_SERVER['REMOTE_ADDR']??'unknown'),10,86400);
    wg_report_counter($db,$config,'report-recipient',$prepared['email'],2,86400);
    wg_report_counter($db,$config,'report-global','all',80,86400);
    $sql=wg_is_mysql($db)
      ? 'INSERT IGNORE INTO rate_limits(bucket,window_start,hits) VALUES(?,?,1)'
      : 'INSERT OR IGNORE INTO rate_limits(bucket,window_start,hits) VALUES(?,?,1)';
    $insert=$db->prepare($sql);$insert->execute([$id,time()]);
    if ($insert->rowCount()!==1) {
        wg_fail(409,'REPORT_STATUS_UNCERTAIN','Dit rapport wordt al verwerkt. Controleer eerst je inbox.');
    }
    $insert->execute([$body,time()]);
    return ['state'=>'send','id'=>$id];
}

function wg_report_finish(PDO $db, string $id, bool $accepted): void {
    $q=$db->prepare('UPDATE rate_limits SET hits=? WHERE bucket=? AND hits=1');
    $q->execute([$accepted?2:3,$id]);
}
