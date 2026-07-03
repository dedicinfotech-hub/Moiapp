<?php

function get_event_type_label(string $type): string
{
    $labels = [
        'wedding' => 'Wedding',
        'birthday' => 'Birthday',
        'engagement' => 'Engagement',
        'valakaappu' => 'Valakaappu',
        'housewarming' => 'Housewarming',
        'graduation' => 'Graduation',
        'custom' => 'Custom Event',
    ];

    return $labels[$type] ?? ucfirst($type);
}

/**
 * Event display name — aligned with mobile getEventDisplayName().
 */
function get_event_display_name(array $event): string
{
    if (!empty($event['custom_title'])) {
        return trim($event['custom_title']);
    }

    $type = $event['event_type'] ?? '';

    switch ($type) {
        case 'wedding':
            $bride = trim($event['bride_name'] ?? '');
            $groom = trim($event['groom_name'] ?? '');
            if ($bride && $groom) {
                $names = $bride . ' & ' . $groom;
                if (stripos($names, 'wedding') === false) {
                    return $names . ' Wedding';
                }
                return $names;
            }
            break;

        case 'birthday':
            $name = trim($event['birthday_person_name'] ?? '');
            if ($name !== '') {
                return $name . "'s Birthday";
            }
            break;

        case 'graduation':
            $name = trim($event['graduate_name'] ?? '');
            if ($name !== '') {
                return $name . ' Graduation';
            }
            break;

        case 'housewarming':
            $host = trim($event['host_name'] ?? '');
            $spouse = trim($event['spouse_name'] ?? '');
            if ($host !== '' || $spouse !== '') {
                $names = implode(' & ', array_filter([$host, $spouse]));
                if (stripos($names, 'housewarming') === false) {
                    return $names . ' Housewarming';
                }
                return $names;
            }
            break;

        case 'engagement':
        case 'valakaappu':
            $bride = trim($event['bride_name'] ?? '');
            $groom = trim($event['groom_name'] ?? '');
            if ($bride !== '' || $groom !== '') {
                $names = implode(' & ', array_filter([$bride, $groom]));
                $label = get_event_type_label($type);
                if (stripos($names, strtolower($label)) === false) {
                    return $names . ' ' . $label;
                }
                return $names;
            }
            break;
    }

    $host = trim($event['host_name'] ?? '');
    if ($host !== '') {
        return $host;
    }

    return get_event_type_label($type);
}
